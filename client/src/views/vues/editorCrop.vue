<template>
    <div class="editorCrop">
        <div class="container mt-5 mb-5">
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
                                    :to="{ name: 'editorCrop'}">AudioGram 그래프 좌표 수정</router-link>
                            </li>
                            <li class="nav-item mr-3">
                                <router-link style="text-decoration: none; color: gray;"
                                    :to="{ name: 'editorPos'}">AudioGram 그래프 좌표 수정</router-link>
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
                        <button v-if="canvas" class="btn btn-danger mb-3" type="button" @click="deleteCanvas">업로드
                            취소</button>
                        <input class="form-control mb-3" type="file" ref='imageUpload' @change="changeImage"
                            style="display: none;">
                    </div>
                    <div class="row">
                        <ul class="list-group" style="max-height: 600px; overflow: auto">
                            <div v-for="(item, idx) in boxObj" :key="item.id">
                                <li class="box-item list-group-item mb-3 mr-3" :id="item.id">
                                    <p>{{ idx+1 }}번째 좌표</p>
                                    <p>좌표 ID : {{ item.id }}</p>
                                    <p>좌표 X축 위치 : {{ item.left.toFixed(2) }}</p>
                                    <p>좌표 Y축 위치 : {{ item.top.toFixed(2) }}</p>
                                    <p>박스 가로 길이 : {{ item.width*item.scaleX.toFixed(2) }}</p>
                                    <p>박스 세로 길이 : {{ item.height*item.scaleY.toFixed(2) }}</p>
                                </li>
                            </div>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { fabric } from "fabric"
    import axios from 'axios';

    export default {
        name: 'editorCrop',

        data() {
            return {
                originalData: null,
                canvas: null,
                image: null,
                imageUrl: null,
                cropImages: [],
                currentTarget: this.$route.params.id,
                canvasWidth: 0,
                boxObj: [],
            }
        },

        mounted() {
            document.addEventListener('keydown', this.keyEventListener)

            this.canvasWidth = this.$refs.canvasContainer.clientWidth

            this.setCanvas()

            this.loadImage()
        },

        destroyed() {
            window.removeEventListener('keydown', this.keyEventListener, false);
        },

        methods: {
            keyEventListener(e) {
                if (this.canvas.getActiveObject() == null) return false

                const activeObj = this.canvas.getActiveObject()._objects ? this.canvas.getActiveObject()._objects : [this.canvas.getActiveObject()]

                const operator = {
                    'ArrowLeft': () => {
                        activeObj.forEach(item => {
                            item.set('left', item.left - 1);
                        })
                    },

                    'ArrowUp': () => {
                        activeObj.forEach(item => {
                            item.set('top', item.top - 1);
                        })
                    },

                    'ArrowRight': () => {
                        activeObj.forEach(item => {
                            item.set('left', item.left + 1);
                        })
                    },

                    'ArrowDown': () => {
                        activeObj.forEach(item => {
                            item.set('top', item.top + 1);
                        })
                    },

                    'Delete': () => {
                        activeObj.forEach(item => {
                            this.canvas.remove(item);
                            this.deleteObj(item);
                        })
                    },
                }

                const actionFunc = operator[e.key]

                if(!actionFunc) return false

                actionFunc()

                e.preventDefault();
                this.canvas.renderAll();
            },

            selectObject(targets) {
                const target = targets.map(item => item.id)
                document.getElementsByClassName('box-item').forEach(item => {
                    if (target.includes(item.id)) item.classList.add('select-li')
                    else item.classList.remove('select-li')
                })
            },

            unselectObject() {
                document.getElementsByClassName('box-item').forEach(item => {
                    item.classList.remove('select-li')
                })
            },

            setCanvas() {
                document.getElementById('c').style.width = `${this.canvasWidth}px`
                document.getElementById('c').style.height = `${(this.canvasWidth / 16) * 9}px`
            },

            async uploadDefaultImage() {
                const sendData = {
                    area: this.currentTarget,
                    image: this.imageUrl
                }

                await axios.post('/api/uploadImage', sendData)
            },

            async changeImage(e) {
                if (!e.target.files.length)
                    return false

                this.setFabricCanvas()

                this.imageUrl = await this.loadImgDataURL(e.target.files[0])
                this.image = await this.setFabricImage(this.imageUrl)

                this.canvas.clear()

                this.canvas.setWidth(this.canvasWidth)
                this.canvas.setHeight(this.image.height * (this.canvasWidth/this.image.width))

                this.setBackgroundImage(this.image)

                this.getPosition()

                this.uploadDefaultImage()
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

            setFabricCanvas() {
                this.canvas = new fabric.Canvas('c', {
                    hoverCursor: 'crosshair',
                    fireRightClick: true,
                    stopContextMenu: true
                }),

                this.canvas.on('mouse:down', (evt) => {
                    if (evt.button == 3) {
                        this.drawBox(evt.pointer.x, evt.pointer.y, 100, 100);
                    }
                }).on('object:added', (evt) => {
                    if (evt.target.id != 'audiogram')
                        this.boxObj.push(evt.target);
                }).on('selection:created', () => {
                    if (this.canvas.getActiveObject() == null) return false

                    const activeObj = this.canvas.getActiveObject()._objects ? this.canvas.getActiveObject()._objects : [this.canvas.getActiveObject()]

                    this.selectObject(activeObj)
                }).on('selection:updated', () => {
                    if (this.canvas.getActiveObject() == null) return false

                    const activeObj = this.canvas.getActiveObject()._objects ? this.canvas.getActiveObject()._objects : [this.canvas.getActiveObject()]

                    this.selectObject(activeObj)
                }).on('selection:cleared', () => {
                    this.unselectObject()
                    this.canvas.discardActiveObject()
                })
            },

            setFabricImage(url) {
                return new Promise((resolve) => {
                    new fabric.Image.fromURL(url, (img) => {

                        resolve(img)
                    })
                })
            },

            setBackgroundImage(img) {
                this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), {
                    id: 'audiogram',
                    scaleX: this.canvas.width / img.width,
                    scaleY: this.canvas.height / img.height
                })
            },

            calcPer(target) {
                return {
                    x: target.left / this.canvas.width * 100,
                    y: target.top / this.canvas.height * 100,
                    w: ((target.width * target.scaleX) / this.canvas.width) * 100,
                    h: ((target.height * target.scaleY) / this.canvas.height) * 100
                }
            },

            calcFix(target) {
                return {
                    x: target.x * this.canvas.width * 0.01,
                    y: target.y * this.canvas.height * 0.01,
                    w: target.w * this.canvas.width * 0.01,
                    h: target.h * this.canvas.height * 0.01
                }
            },

            async loadImage() {
                const res = await axios.get(`http://localhost:3000/api/loadImage/${this.currentTarget}`)
    
                if (res.data.success) {
                    const url = "data:image/png;base64," + res.data.data

                    this.setFabricCanvas()

                    this.canvas.clear()

                    this.image = await this.setFabricImage(url)

                    this.canvas.setWidth(this.canvasWidth)
                    this.canvas.setHeight(this.image.height * ((this.canvasWidth/this.image.width)))

                    this.setBackgroundImage(this.image)

                    this.getPosition()
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
                    this.originalData['box'].forEach(item => {
                        const calcResult = this.calcFix(item)
                        this.drawBox(
                            calcResult.x,
                            calcResult.y,
                            calcResult.w,
                            calcResult.h
                        )
                    })
                }
            },

            async setPosition() {
                this.canvas.discardActiveObject()
                this.canvas.selected = false
                this.originalData['box'] = this.boxObj.map(item => this.calcPer(item));

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
        border: mediumpurple solid 3px;
        background-color: lightslategray;
        color: white;
    }
</style>
