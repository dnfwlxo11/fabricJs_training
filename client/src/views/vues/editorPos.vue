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
                <div class="col-md-7 mr-5 mb-3" ref="canvasContainer">
                    <div class="row">
                        <div class="col-md">
                            <button id="one" class="btn mb-3 mr-1" :class="{'btn-primary': mode=='one'}" @click="selectMode">자유롭게 수정</button>
                            <button id="line-r" class="btn mb-3 mr-1" :class="{'btn-primary': mode=='line'&&(direction=='row')}" @click="selectMode">라인별 수정 (가로)</button>
                            <button id="line-c" class="btn mb-3 mr-1" :class="{'btn-primary': mode=='line'&&(direction=='col')}" @click="selectMode">라인별 수정 (세로)</button>
                            <button id="all" class="btn mb-3 mr-1" :class="{'btn-primary': (mode=='all')}" @click="selectMode">전체 선택</button>
                            <button id="all" class="btn mb-3 mr-1" :class="{'btn-primary': show}" @click="changeVisible">기준점</button>
                        </div>
                    </div>
                    <div class="row ml-1">
                        <p v-if="mode=='one'" class="font-weight-bold">자유롭게 이동하실 수 있습니다.</p>
                        <p v-if="mode=='line'&&direction=='row'" class="font-weight-bold">X축은 고정되어 이동됩니다.</p>
                        <p v-if="mode=='line'&&direction=='col'" class="font-weight-bold">Y축은 고정되어 이동됩니다.</p>
                        <p v-if="mode=='all'&&direction=='col'" class="font-weight-bold">전체가 선택되고 자유롭게 이동할 수 있습니다.</p>
                    </div>
                    <div class="row">
                        <canvas id="c" style="border: 1px solid;" ref="canvas"></canvas>
                    </div>
                    <div class="row">
                        <div class="col-12 text-center mt-3">
                            <button class="btn btn-secondary mb-3 mr-3" type="button" @click="prevCanvas">이전</button><span class="text-center" style="text-align: center;">{{ imagePage + 1 }} / {{ cropImages.length }}</span><button class="btn btn-secondary ml-3 mb-3" type="button" @click="nextCanvas">다음</button>
                        </div>
                    </div>
                    <div class="row">
                        <button class="btn btn-primary mb-3 mr-3" @click="calcDistance">계산</button>
                    </div>
                </div>
                <div class="col-md-4">
                    <div>
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
                            <div v-for="(value, key) in pointObj" :key="key">
                                <li class="box-item list-group-item mr-3" v-if="key!='undefined'" :id="key">
                                    <p>{{ key }} 좌표</p>
                                    <p>좌표 ID : {{ value.id }}</p>
                                    <p>좌표 X축 위치 : {{ value.left.toFixed(2) }} ({{(value.left * canvas.width).toFixed(2)}}px)</p>
                                    <p>좌표 Y축 위치 : {{ value.top.toFixed(2) }} ({{(value.top * canvas.height).toFixed(2)}}px)</p>
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

                xInput: '125,250,500,750,1000,1500,2000,3000,4000,6000,8000',
                yInput: '-10,0,10,20,30,40,50,60,70,80,90,100,110,120',

                pointObj: {},
                activeObj: [],
                canvas: null,
                image: null,
                mode: 'one',
                show: true,
                direction: 'col',

                canvasWidth: 0,

                isData: false,
                currentTarget: this.$route.params.id,
                
                cropImages: [],
                imagePage: 0,

                detects: require('../../assets/t5.json')
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
                return Object.keys(this.pointObj).length
            }
        },

        methods: {
            async init() {

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

                        let objs = this.canvas.getObjects()
                        const keys = objs.map(item => item.id)

                        if (this.direction == 'col') {
                            const objId = e.target.id.split(',')[0]
                            
                            this.yInput.split(',').forEach(item => {
                                this.activeObj.push(objs[keys.indexOf(`${objId},${item}`)])
                            })
                        } else if (this.direction == 'row') {
                            const objId = e.target.id.split(',')[1]

                            this.xInput.split(',').forEach(item => {
                                this.activeObj.push(objs[keys.indexOf(`${item},${objId}`)])
                            })
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

                    this.unselectObject()
                    this.activeObj = []
                }).on('mouse:over', (e) => {
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
                if (this.activeObj == null) return false

                let keysPressed = {}
                keysPressed[e.key] = true

                const operator = {
                    'ArrowLeft': () => {
                        this.activeObj.forEach(item => {
                            item.set('left', item.left - 1)
                            this.$set(this.pointObj, item.id, this.extractObj(item));
                        })
                    },

                    'ArrowUp': () => {
                        this.activeObj.forEach(item => {
                            item.set('top', item.top - 1);
                            this.$set(this.pointObj, item.id, this.extractObj(item));
                        })
                    },

                    'ArrowRight': () => {
                        this.activeObj.forEach(item => {
                            item.set('left', item.left + 1);
                            this.$set(this.pointObj, item.id, this.extractObj(item));
                        })
                    },

                    'ArrowDown': () =>{
                        this.activeObj.forEach(item => {
                            item.set('top', item.top + 1);
                            this.$set(this.pointObj, item.id, this.extractObj(item));
                        })
                    },

                    'Delete': () => {
                        alert('혼동을 방지하기 위해 개별 삭제는 지원하지 않습니다.\n초기화 버튼을 눌러주세요.')
                    },

                    'Escape': () => {
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
                        if (e.target.type == 'activeSelection') {
                            this.canvas.discardActiveObject()
                            return false
                        }

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
                        this.cropImages.push(originalImage.toDataURL({
                            left: item.x * originalImage.width,
                            top: item.y * originalImage.height,
                            width: item.w * originalImage.width,
                            height: item.h * originalImage.height
                        }))
                    })
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
            },

            async setPosition() {
                this.canvas.discardActiveObject()

                this.originalData['point'][this.imagePage] = this.pointObj

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
                this.canvas.setHeight(this.image.height * (this.canvasWidth / this.image.width))

                this.setBackgroundImage(this.image)
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

                this.pointObj = {}
                this.isData = false
            },

            calcPer(target) {
                return {
                    x: target.left / this.canvas.width,
                    y: target.top / this.canvas.height
                }
            },

            calcFix(target) {
                return {
                    left: target.left * this.canvas.width,
                    top: target.top * this.canvas.height
                }
            },

            calcDistance() {
                if (!Object.keys(this.pointObj).length) {
                    alert('기준점을 먼저 설정해주세요.')
                    return false
                }

                this.detects.forEach(detect => {
                    const pos_1 = this.calcFix({ left: detect.X, top: detect.Y })
                    let maxi = [this.canvasWidth, '']

                    Object.keys(this.pointObj).forEach(point => {
                        const pos_2 = this.calcFix({ left: this.pointObj[point].left, top: this.pointObj[point].top })

                        let result = Math.sqrt(Math.pow(pos_2.left - pos_1.left, 2) + Math.pow(pos_2.top - pos_1.top, 2))
                        if (result < maxi[0]) maxi = [result, point]
                    })

                    const predict = maxi[1].split(',')

                    this.canvas.add(new fabric.Circle({
                        left: pos_1.left - 4,
                        top: pos_1.top - 4,
                        radius: 4,
                        fill: 'green',
                        selectable: false
                    })).renderAll()

                    this.canvas.add(new fabric.Text(`주파수: ${predict[0]}, \n데시벨: ${predict[1]}, \n클래스: ${detect.NAME}`, {
                        left: pos_1.left - 10,
                        top: pos_1.top + 10,
                        fontSize: 10,
                        selectable: false
                    })).renderAll()
                })
            },

            async genPoint() {
                const xLabel = this.xInput.split(',')
                const yLabel = this.yInput.split(',')

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

            async loadPoint() {
                this.initCanvas()

                if (this.originalData == null) await this.getPosition()

                const pointData = this.originalData['point'][this.imagePage]

                if (pointData != undefined && Object.keys(pointData).length != 0) {
                    this.isData = true

                    Object.keys(pointData).forEach(item => {
                        const convert = this.calcFix(pointData[item])

                        const point = new fabric.Circle({
                            left: convert.left,
                            top: convert.top,
                            radius: 4,
                            id: item,
                            fill: 'purple',
                            hasControls : false,
                            visible: this.show ? true : false
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
                this.canvas.discardActiveObject()

                const targetId = e.target.id

                if (targetId == 'one') this.mode = 'one'
                else if (targetId == 'line-r') {
                    this.mode = 'line'
                    this.direction = 'row'
                } else if (targetId == 'line-c') {
                    this.mode = 'line'
                    this.direction = 'col'
                } else if (targetId == 'all') this.mode = 'all'
            },

            changeVisible() {
                this.show = !this.show
                this.loadPoint()
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
                this.loadPoint()
            },

            nextCanvas() {
                if (this.cropImages.length == 1) return false
                if (this.imagePage == this.cropImages.length - 1) this.imagePage = -1
                this.imagePage += 1
                
                this.changeImage(this.cropImages[this.imagePage])
                this.loadPoint()
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