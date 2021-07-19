<template>
    <div class="editorCrop">
        <div class="container mt-5">
            <nav class="navbar navbar-light mb-3" style="background-color: #e3f2fd;">
                <nav class="navbar navbar-expand-lg">
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav">
                            <li class="nav-item mr-3">
                                <router-link style="text-decoration: none; color: gray;" :to="{ name: 'Home'}">홈
                                </router-link>
                            </li>
                            <li class="nav-item active mr-3">
                                <router-link style="text-decoration: none; color: gray;"
                                    :to="{ name: 'editorCrop', params: {cropImages}}">AudioGram 그래프 좌표 수정</router-link>
                            </li>
                            <li class="nav-item mr-3">
                                <router-link style="text-decoration: none; color: gray;"
                                    :to="{ name: 'editorPos', params: {cropImages}}">AudioGram 그래프 좌표 수정</router-link>
                            </li>
                        </ul>
                    </div>
                </nav>
            </nav>
            <div class="row">
                <div class="col-md-9">
                    <div ref="canvasContainer">
                        <canvas id="c" class="mb-3" @click="$refs.imageUpload.click()"
                            style="border: 1px solid;"></canvas>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="row-md">
                        <button class="btn btn-primary mb-3 mr-3" type="button" @click="setPosition">크롭좌표 저장</button>
                        <button v-if="image" class="btn btn-danger mb-3" type="button" @click="deleteCanvas">업로드
                            취소</button>
                        <input class="form-control mb-3" type="file" ref='imageUpload' @change="changeImage"
                            style="display: none;">
                    </div>
                    <div class="row">
                        <ul class="list-group" style="max-height: 600px; overflow: auto">
                            <div v-for="(item) of boxObj" :key="item.id">
                                <li class="box-item list-group-item mb-3" :id="item.id" @click="selectObject">X:
                                    {{item.left}}, Y:
                                    {{item.top}}, Width:
                                    {{item.width*item.scaleX}}, Height:
                                    {{item.height*item.scaleY}},
                                    {{ item.id }}</li>
                            </div>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {
        fabric
    } from "fabric";
    import axios from 'axios';

    export default {
        name: 'editorCrop',

        data() {
            return {
                originalData: null,
                originalCanvas: null,
                image: null,
                canvas: null,
                canvas2: null,
                cropImages: [],
                position: null,
                currentTarget: this.$route.params.id,
                canvasWidth: 0,
                boxObj: [],
            }
        },

        computed: {
            strongActive() {
                const activeObjects = this.canvas.getActiveObject()
                console.log(activeObjects)

                // boxObj.forEach(item => {
                //     if (!item.includes(activeObjects)) document.getElementById(item).classList.add('select-li')
                //     else document.getElementById(item).classList.remove('select-li')
                // })
            }
        },

        mounted() {
            this.canvasWidth = this.$refs.canvasContainer.clientWidth

            this.setKeyboardEvent()

            this.setCanvas()
        },

        destroyed() {
            this.crop()
            window.removeEventListener('keydown', () => console.log('이벤트 리스너 삭제 완료'));
        },

        methods: {
            selectObject(targets) {
                const target = targets.map(item => item.id)
                document.getElementsByClassName('box-item').forEach(item => {
                    if (target.includes(item.id)) item.classList.add('select-li')
                    else item.classList.remove('select-li')
                })
            },

            deselectObject() {
                document.getElementsByClassName('box-item').forEach(item => {
                    item.classList.remove('select-li')
                })
            },

            setCanvas() {
                this.originalCanvas = document.getElementById('c')
                this.originalCanvas.style.width = `${this.canvasWidth}px`
                this.originalCanvas.style.height = `${(this.canvasWidth * 9) / 16}px`
            },

            setKeyboardEvent() {
                document.addEventListener('keydown', (evt) => {
                    const okKey = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Delete']
                    const keyCode = evt.key

                    if (!okKey.includes(keyCode)) return false
                    if (this.canvas.getActiveObject() == null) return false

                    const activeObj = this.canvas.getActiveObject()._objects ? this.canvas.getActiveObject()
                        ._objects : [this.canvas.getActiveObject()]

                    if (keyCode == 'ArrowLeft') {
                        activeObj.forEach(item => {
                            item.set('left', item.left - 0.5)
                        })
                    } else if (keyCode == 'ArrowUp') {
                        activeObj.forEach(item => {
                            item.set('top', item.top - 0.5)
                        })
                    } else if (keyCode == 'ArrowRight') {
                        activeObj.forEach(item => {
                            item.set('left', item.left + 0.5)
                        })
                    } else if (keyCode == 'ArrowDown') {
                        activeObj.forEach(item => {
                            item.set('top', item.top + 0.5)
                        })
                    } else if (keyCode == 'Delete') {
                        this.deleteObj(activeObj)
                        this.canvas.remove(activeObj)
                    }

                    evt.preventDefault();
                    this.canvas.renderAll();
                })
            },

            crop() {
                this.boxObj.forEach(item => {
                    const left = item.left
                    const top = item.top
                    const width = item.width * item.scaleX
                    const height = item.height * item.scaleY

                    this.cropImages.push(this.image.toDataURL({
                        left,
                        top,
                        width,
                        height
                    }))
                })

                console.log('크롭 완료')
            },

            async changeImage(e) {
                if (!e.target.files.length)
                    return false

                this.setFabricCanvas()

                this.canvas.clear()
                const dataURL = await this.loadImgDataURL(e.target.files[0])

                this.image = await this.setFabricImage(dataURL)
                this.image.selectable = false;
                this.canvas.add(this.image)
                this.canvas.setWidth(this.image.width * this.image.scaleX)
                this.canvas.setHeight(this.image.height)


                this.getPosition()
            },

            setFabricCanvas() {
                this.canvas = new fabric.Canvas('c', {
                    hoverCursor: 'crosshair',
                    fireRightClick: true,
                    stopContextMenu: true,
                    refs: 'imageUpload'
                })

                this.canvas.on('mouse:down', (evt) => {
                        if (evt.button == 3) {
                            this.drawBox(evt.pointer.x, evt.pointer.y, 100, 100);
                        }
                    }).on('object:added', (evt) => {
                        if (evt.target.id != 'audiogram')
                            this.boxObj.push(evt.target);
                    }).on('selection:created', () => {
                        const activeObj = this.canvas.getActiveObject()._objects ? this.canvas.getActiveObject()
                            ._objects : [this.canvas.getActiveObject()]

                        this.selectObject(activeObj)
                    }).on('selection:updated', () => {
                        const activeObj = this.canvas.getActiveObject()._objects ? this.canvas.getActiveObject()
                            ._objects : [this.canvas.getActiveObject()]

                        this.selectObject(activeObj)
                    })
                    .on('selection:cleared', () => {
                        this.deselectObject()
                        this.canvas.discardActiveObject()
                    })
            },

            loadImgDataURL(file) {
                return new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.readAsDataURL(file)
                    reader.onload = () => {
                        resolve(reader.result)
                    }
                })
            },

            setFabricImage(url) {
                return new Promise((resolve) => {
                    new fabric.Image.fromURL(url, (img) => {
                        img.set({
                            left: 0,
                            top: 0,
                            width: img.width,
                            scaleX: this.canvasWidth / img.width,
                            id: 'audiogram'
                        })

                        resolve(img)
                    })
                })
            },

            calcPer(target) {
                return {
                    x: target.left / this.image.width * 100,
                    y: target.top / this.image.height * 100,
                    w: ((target.width * target.scaleX) / this.image.width) * 100,
                    h: ((target.height * target.scaleY) / this.image.height) * 100
                }
            },

            async getPosition() {
                let res = await axios({
                    method: 'post',
                    url: 'http://localhost:3000/api/getPosition',
                    data: {
                        id: this.currentTarget
                    }
                })

                this.originalData = JSON.parse(res.data.rows[0].pos_data.replaceAll('\\', ''))
                if (this.originalData['box'].length != 0) {
                    this
                        .originalData['box']
                        .forEach(item => {
                            this.drawBox(
                                item.x * this.image.width * 0.01,
                                item.y * this.image.height * 0.01,
                                item.w * this.image.width * 0.01,
                                item.h * this.image.height * 0.01
                            )
                        })
                }
            },

            async setPosition() {
                this.canvas.discardActiveObject()
                this.canvas.selected = false
                this.originalData['box'] = this.boxObj.map(item => this.calcPer(item));
                console.log(this.originalData)

                await axios({
                    method: 'post',
                    url: 'http://localhost:3000/api/setPosition',
                    data: {
                        id: this.currentTarget,
                        data: this.originalData
                    }
                })
            },

            drawBox(left, top, w, h) {
                const forId = new Date()

                const box = new fabric.Rect({
                    left: left,
                    top: top,
                    fill: 'purple',
                    width: w,
                    height: h,
                    opacity: 0.1,
                    border: 2,
                    id: `box_${forId.getTime()}${this.boxObj.length}`
                })

                this.canvas.add(box);

                return box;
            },

            deleteObj(target) {
                this.boxObj.forEach((item, idx) => {
                    if (item.id == target.id)
                        this.boxObj.splice(idx, 1)
                });
            },

            deleteCanvas() {
                const objects = this.canvas.getObjects()

                objects.forEach(item => {
                    this.canvas.remove(item)
                })

                this.boxObj = []
                this.image = null
                document.getElementsByClassName('upper-canvas').forEach(item => item.remove())
                this.canvas.clear()
                this.canvas = null

                this.setCanvas()
            }
        }
    }
</script>

<style>
    canvas {
        widows: 50%;
    }

    .select-li {
        border: lightcoral solid 3px;
    }
</style>