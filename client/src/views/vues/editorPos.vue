<template>
    <div class="editorPos">
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
                <img id="cursor" src="/images/plus.png" alt="" style="display: none">
                <div class="col-md-7 mr-5 mb-3" ref="canvasContainer">
                    <div class="row">
                        <div class="col-md">
                            <button id="one" class="btn mb-3 mr-3" :class="{'btn-primary': mode == 'one'}" @click="selectMode">자유롭게 수정</button>
                            <button id="line-r" class="btn mb-3 mr-3" :class="{'btn-primary': mode == 'line'&&(direction == 'row')}" @click="selectMode">라인별 수정 (가로)</button>
                            <button id="line-c" class="btn mb-3 mr-3" :class="{'btn-primary': mode == 'line'&&(direction == 'col')}" @click="selectMode">라인별 수정 (세로)</button>
                            <button id="all" class="btn mb-3 mr-3" :class="{'btn-primary': (mode == 'all')}" @click="selectMode">전체 선택</button>
                        </div>
                        <canvas id="c" style="border: 1px solid;" ref="canvas"></canvas>
                    </div>
                    <div class="row">
                        <div class="col-12 text-center mt-3">
                            <button class="btn btn-secondary mb-3 mr-3" type="button" @click="prevCanvas">이전</button><span class="text-center" style="text-align: center;">{{ imagePage + 1 }} / {{ cropImages.length }}</span><button class="btn btn-secondary ml-3 mb-3" type="button" @click="nextCanvas">다음</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div>
                        <button class="btn btn-primary mb-3 mr-3" type="button" @click="groupClick">축 잡기</button>
                        <button class="btn btn-primary mb-3 mr-3" type="button" @click="setPosition">좌표 저장</button>
                        <button v-if="isData&&dataCheck" class="btn btn-danger mb-3" type="button" @click="initCanvas()">초기화</button>
                    </div>

                    <div class="mb-3" v-if="!isData||!dataCheck" id="inputs">
                        <div class="mb-3">
                            <p>x축을 입력해주세요.</p><small>ex) 0, 10, 20, 30</small>
                            <div>
                                <input type="text" v-model="xInput" placeholder="x축을 입력해주세요">
                            </div>
                        </div>
                        <div class="mb-3">
                            <p>y축을 입력해주세요.</p><small>ex) 0, 10, 20, 30</small>
                            <div>
                                <input type="text" v-model="yInput" placeholder="y축을 입력해주세요">
                            </div>
                        </div>
                        <button class="btn btn-primary" type="button" @click="genPoint()">생성</button>
                    </div>
                    <div>
                        <ul class="list-group" style="max-height: 600px; overflow: auto">
                            <div v-for="(item, idx) in pointObj" :key="item.id">
                                <li class="box-item list-group-item mr-3" :id="item.id">
                                    <p>{{ idx+1 }}번째 좌표</p>
                                    <p>좌표 ID : {{ item.id }}</p>
                                    <p>좌표 X축 위치 : {{ item.left.toFixed(2) }}</p>
                                    <p>좌표 Y축 위치 : {{ item.top.toFixed(2) }}</p>
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
    import { fabric } from "fabric";
    import axios from 'axios';

    export default {
        name: 'editorPos',

        data() {
            return {
                originalData: null,

                intervalX: 0,
                intervalY: 0,

                xInput: '125,250,500,750,1000,1500,2000,3000,4000,6000,8000,12000',
                yInput: '-10,0,10,20,30,40,50,60,70,80,90,100,110,120',

                pointObj: [],
                canvas: null,
                image: null,

                canvasWidth: 0,

                isData: false,
                currentTarget: this.$route.params.id,
                
                cropImages: [],
                imagePage: 0
            }
        },

        mounted() {
            document.addEventListener('keydown',this.keyEventListener)

            this.canvasWidth = this.$refs.canvasContainer.clientWidth

            this.init()
        },

        destroyed() {
            window.removeEventListener('keydown', this.keyEventListener, false)
        },

        computed: {
            dataCheck() {
                return this.pointObj.length
            }
        },

        methods: {
            async init() {
                fabric.Group.prototype.selectionBackgroundColor = 'rgba(45,207,171,0.25)';

                this.canvas = new fabric.Canvas('c', {
                    hoverCursor: 'crosshair',
                    fireRightClick: true,
                    stopContextMenu: true
                }),

                this.canvas.on('selection:created', (e) => {
                    if (this.mode == 'one') {
                        if (e.target.type == 'activeSelection') {
                            this.activeObj = e.selected
                        } else {
                            this.activeObj = [e.target]
                        }
                    } else if (this.mode == 'line') {
                        if (e.target.type == 'activeSelection') {
                            this.canvas.discardActiveObject()
                            return false
                        }

                        const objs = this.canvas.getObjects()
                        const keys = objs.map(item => item.id)

                        if (this.direction == 'col') {
                            const objId = e.target.id.split(',')[0]
                            
                            this.yInput.split(',').forEach(item => {
                                this.activeObj.push(objs[keys.indexOf(`${objId},${item}`)])
                            })
                            console.log(this.activeObj)
                        } else if (this.direction == 'row') {
                            const objId = e.target.id.split(',')[1]

                            this.xInput.split(',').forEach(item => {
                                this.activeObj.push(objs[keys.indexOf(`${item},${objId}`)])
                            })
                            console.log(this.activeObj)
                        }
                        
                        const group = new fabric.ActiveSelection(this.activeObj, {
                            canvas: this.canvas,
                            fill: 'red',
                            opacity: 0.8,
                            borderColor: 'black'
                        })

                        this.canvas.setActiveObject(group)
                    } else {
                        this.activeObj = this.canvas.getObjects()

                        const group = new fabric.ActiveSelection(this.activeObj, {
                            canvas: this.canvas,
                            fill: 'red',
                            opacity: 0.8,
                            borderColor: 'black'
                        })

                        this.canvas.setActiveObject(group)
                    }

                    this.selectObject(this.activeObj)
                }).on('object:added', (e) => {
                    const obj = this.extractObj(e.target)
                    this.$set(this.pointObj, obj.id, obj)
                }).on('object:moving', (e) => {
                    const obj = this.extractObj(e.target)
                    this.$set(this.pointObj, obj.id, obj)
                }).on('object:removed', (e) => {
                    const obj = this.extractObj(e.target)
                    this.$delete(this.pointObj, obj.id)
                }).on('selection:updated', (e) => {
                    const obj = this.extractObj(e.target)
                    this.$set(this.pointObj, obj.id, obj)
                    this.selectObject(this.activeObj)
                }).on('selection:cleared', (e) => {
                    e.deselected.forEach(item => {
                        const obj = this.extractObj(item)
                        this.$set(this.pointObj, obj.id, obj)
                    })

                    this.selectObject(activeObj)
                }).on('selection:cleared', () => {
                    this.unselectObject()
                    this.canvas.discardActiveObject()
                }).on('mouse:over', function(e) {
                    // this.canvas.moveTo(e.target, 0)
                    // console.log(e.target)
                }).on('mouse:down', (e) => {
                    // console.log(e.target)
                    this.canvas.bringToFront(e.target)
                })

                this.setCanvas()

                await this.loadImage()

                await this.changeImage(this.cropImages[0])

                await this.loadPoint()
            },

            extractObj(target) {
                return {
                    id: target.id,
                    left: target.left / this.canvas.width,
                    top: target.top / this.canvas.height,
                }
            },

            keyEventListener(e) {
                if (this.canvas.getActiveObject() == null) return false

                const activeObj = this.canvas.getActiveObject()._objects ? this.canvas.getActiveObject()._objects : [this.canvas.getActiveObject()]

                let keysPressed = {}
                keysPressed[e.key] = true

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

                    'ArrowDown': () =>{
                        activeObj.forEach(item => {
                            item.set('top', item.top + 1);
                        })
                    },

                    'Delete': () => {
                        alert('혼동을 방지하기 위해 개별 삭제는 지원하지 않습니다.\n기화 버튼을 눌러주세요.')
                    },

                    'Enter': () => {
                        this.canvas.discardActiveObject()
                    },

                    'q': () => {
                        this.canvas.discardActiveObject()
                        this.direction == 'col' ? this.direction = 'row' : this.direction = 'col'
                        this.activeObj = []
                    },

                    'w': () => {
                        this.canvas.discardActiveObject()
                        this.mode == 'line' ? this.mode = 'one' : this.mode = 'line'
                        this.activeObj = []
                    },

                    'a': () => {
                        this.canvas.discardActiveObject()
                        this.mode = 'all'
                        this.activeObj = this.canvas.getObjects()

                        const group = new fabric.ActiveSelection(this.activeObj, {
                            canvas: this.canvas,
                            fill: 'red',
                            opacity: 0.8,
                            borderColor: 'black'
                        })

                        this.canvas.setActiveObject(group)
                        this.selectObject(this.activeObj)
                    }
                }

                const actionFunc = operator[e.key]

                if(!actionFunc) return false

                actionFunc()

                e.preventDefault();
                this.canvas.renderAll();
            },

            async loadImage() {
                await this.getPosition()

                const res = await axios.get(`http://localhost:3000/api/loadImage/${this.currentTarget}`)
    
                if (res.data.success) {
                    const url = "data:image/png;base64," + res.data.data
                    let originalImage = await this.setFabricImage(url)

                    this.originalData['box'].forEach(item => {
                        console.log(item)
                        this.cropImages.push(originalImage.toDataURL({
                            left: item.x * originalImage.width * 0.01,
                            top: item.y * originalImage.height * 0.01,
                            width: item.w * originalImage.width * 0.01,
                            height: item.h * originalImage.height * 0.01
                        }))
                    })
                }
            },

            async setPosition() {
                if (!this.isData) return false

                this.canvas.discardActiveObject()

                const point = {}
                this.pointObj.forEach(item => {
                    point[item.id] = this.calcPer(item)
                })

                this.originalData['point'][this.imagePage] = point

                await axios({
                    method: 'post',
                    url: 'http://localhost:3000/api/setPosition',
                    data: {
                        id: this.currentTarget,
                        data: this.originalData
                    }
                })

                await this.getPosition()
            },

            async changeImage(target) {
                this.image = await this.setFabricImage(target)

                this.canvas.setWidth(this.canvasWidth)
                this.canvas.setHeight(this.image.height * this.image.scaleY)

                // this.setBackgroundImage(this.image)
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

            async getPosition() {
                let res = await axios({
                    method: 'post',
                    url: 'http://localhost:3000/api/getPosition',
                    data: {
                        id: this.currentTarget
                    }
                })

                this.originalData = JSON.parse(res.data.rows[0].pos_data.replaceAll('\\', ''))
            },

            setCanvas() {
                this.canvas.setWidth(this.canvasWidth)
                this.canvas.setHeight((this.canvasWidth * 3) / 4)
            },

            initCanvas() {
                this.canvas.discardActiveObject()

                this.canvas.getObjects().forEach(item => {
                    if (!'audiogram'.includes(item.id)) {
                        this.canvas.remove(item)
                    }
                })

                this.pointObj = []
                this.isData = false
            },

            calcPer(target) {
                return {
                    x: target.left / this.canvas.width * 100,
                    y: target.top / this.canvas.height * 100
                }
            },

            calcFix(target) {
                return {
                    x: target.x * this.canvas.width * 0.01,
                    y: target.y * this.canvas.height * 0.01
                }
            },

            async genPoint() {
                const xLabel = this.xInput.split(',')
                const yLabel = this.yInput.split(',')

                const cursor = new Image()
                

                for (let i=0;i<xLabel.length;i++) {
                    for (let j=0;j<yLabel.length;j++) {
                        const point = new fabric.Circle({
                            left: i*(this.canvas.width / (xLabel.length + 1)) - 4,
                            top: j*(this.canvas.height / (yLabel.length + 1)) - 4,
                            radius: 4,
                            id: `${xLabel[i]},${yLabel[j]}`,
                            fill: 'purple',
                            opacity: 1,
                            hasControl: false
                        })

                        this.canvas.add(point).renderAll()
                    }
                }

                this.isData = true
            },

            deleteCircle(target) {
                this.pointObj.forEach((item, idx) => {
                    if (item.id == target.id)
                        this.pointObj.splice(idx, 1)
                });
            },

            groupClick() {
                let selectedObjects = [];

                selectedObjects.push(this.pointObj[0])
                selectedObjects.push(this.pointObj[1])
                selectedObjects.push(this.pointObj[2])
                selectedObjects.push(this.pointObj[3])

                let group = new fabric.ActiveSelection(selectedObjects)
                this.canvas.add(group)
            },

            async loadPoint() {
                this.initCanvas()

                if (this.originalData == null) await this.getPosition()

                const pointData = this.originalData['point'][this.imagePage]

                if (pointData != undefined && Object.keys(pointData).length != 0) {
                    this.isData = true

                    Object.keys(pointData).forEach(item => {
                        const convert = this.calcFix(pointData[item])

                        const point = new fabric.Circle({
                            left: convert.left - 4,
                            top: convert.top - 4,
                            radius: 4,
                            id: item,
                            fill: 'purple',
                            hasControls : false,
                            centeredRotation: true,
                        })

                        this.canvas.add(point).renderAll()
                    })
                } else {
                    this.isData = false
                    this.originalData['point'][this.imagePage] = {}
                    return false
                }
            },

            selectMode(e) {
                const targetId =  e.target.id

                if (targetId == 'one') {
                    this.canvas.discardActiveObject()
                    this.mode = 'one'
                } else if (targetId == 'line-r') {
                    this.canvas.discardActiveObject()
                    this.mode = 'line'
                    this.direction = 'row'
                } else if (targetId == 'line-c') {
                    this.canvas.discardActiveObject()
                    this.mode = 'line'
                    this.direction = 'col'
                } else if (targetId == 'all') {
                    this.canvas.discardActiveObject()
                    this.mode = 'all'
                }
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

            prevCanvas() {
                if (this.cropImages.length == 1) return false
                if (this.imagePage == 0) this.imagePage = this.cropImages.length
                this.imagePage -= 1
                
                this.changeImage(this.cropImages[this.imagePage])
                // this.loadPoint()
            },

            nextCanvas() {
                if (this.cropImages.length == 1) return false
                if (this.imagePage == this.cropImages.length - 1) this.imagePage = -1
                this.imagePage += 1
                
                this.changeImage(this.cropImages[this.imagePage])
                // this.loadPoint()
            }
        }
    }
</script>

<style>
    .list-group-item {
        margin-bottom: 20px;
    }

    .select-li {
        border: mediumpurple solid 3px;
        background-color: lightslategray;
        color: white;
    }

    .btn {
        border: grey 1px solid;
        border-radius: 10px;
    }
</style>