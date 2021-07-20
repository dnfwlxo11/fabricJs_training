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
                        <h3 class="mb-5">좌표를 설정해주세요.</h3>
                        <canvas id="c" style="border: 1px solid;" ref="canvas"></canvas>
                    </div>
                    <div class="row">
                        <div class="col-12 text-center mt-3">
                            <button class="btn btn-secondary mb-3 mr-3" type="button" @click="prevCanvas">이전</button><span class="text-center" style="text-align: center;">{{ imagePage + 1 }} / {{ cropImages.length }}</span><button class="btn btn-secondary ml-3 mb-3" type="button" @click="nextCanvas">다음</button>
                        </div>
                        <!-- <h3 class="mt-5">이미지 리스트</h3>
                        <div id="cropArea"></div> -->
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
                            <!-- <button class="btn btn-secondary" type="button" @click="addShaft(true, 'init', 0)">축
                                추가</button>
                            <div id="xShaft"></div> -->
                            <div>
                                <input type="text" v-model="xInput" placeholder="x축을 입력해주세요">
                            </div>
                        </div>
                        <div class="mb-3">
                            <p>y축을 입력해주세요.</p><small>ex) 0, 10, 20, 30</small>
                            <!-- <button class="btn btn-secondary" type="button" @click="addShaft(false, 'init', 0)">축
                                추가</button>
                            <div id="yShaft"></div> -->
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
                cursor: require('../../assets/x_cursor.png'),
                canvas: null,

                canvasWidth: 0,

                isData: false,
                currentTarget: this.$route.params.id,
                cropImages: this.$route.params.cropImages,
                imagePage: 0
            }
        },

        mounted() {
            document.addEventListener('keydown',this.keyEventListener)

            this.canvasWidth = this.$refs.canvasContainer.clientWidth

            this.canvas = new fabric.Canvas('c', {
                hoverCursor: 'crosshair',
                fireRightClick: true,
                stopContextMenu: true
            }),

            this.canvas.on('selection:created', () => {
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

            this.setCanvas()

            this.changeImage(this.cropImages[0])
            this.loadPoint()
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

                    'ArrowDown': () =>{
                        activeObj.forEach(item => {
                            item.set('top', item.top + 1);
                        })
                    },

                    'Delete': () => {
                        activeObj.forEach(item => {
                            this.canvas.remove(item);
                            this.deleteCircle(item);
                        })
                    },
                }

                const actionFunc = operator[e.key]

                if(!actionFunc) return false

                actionFunc()

                e.preventDefault();
                this.canvas.renderAll();
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
                await this.setFabricImage(target)
            },

            setFabricImage(url) {
                return new Promise((resolve) => {
                    new fabric.Image.fromURL(url, (img) => {
                        this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), {
                            id: `audiogram_${this.imagePage}`,
                            scaleX: this.canvas.width / img.width,
                            scaleY: this.canvas.height / img.height
                        })

                        resolve(img)
                    })
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

            genPoint() {
                const xLabel = this.xInput.split(',')
                const yLabel = this.yInput.split(',')

                for (let i=0;i<xLabel.length;i++) {
                    for (let j=0;j<yLabel.length;j++) {
                        const point = new fabric.Circle({
                            left: i*(this.canvas.width / (xLabel.length + 1)),
                            top: j*(this.canvas.height / (yLabel.length + 1)),
                            radius: 2,
                            id: `${xLabel[i]},${yLabel[j]}`
                        })

                        this.pointObj.push(point)
                        point.set('hasControls', false);
                        this.canvas.add(point)
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

            async loadPoint() {
                this.initCanvas()

                if (this.originalData == null) await this.getPosition()

                const pointData = this.originalData['point'][this.imagePage]

                if (pointData != undefined && Object.keys(pointData).length != 0) {
                    this.isData = true

                    Object.keys(pointData).forEach(item => {
                        const convert = this.calcFix(pointData[item])
                        const point = new fabric.Circle({
                            left: convert.x,
                            top: convert.y,
                            radius: 2,
                            id: item
                        })
                        
                        this.pointObj.push(point)
                        point.set('hasControls', false);
                        this.canvas.add(point)
                    })
                } else {
                    this.isData = false
                    this.originalData['point'][this.imagePage] = {}
                    return false
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
    img {
        background: transparent;
    }

    .list-group-item {
        margin-bottom: 20px;
    }

    .select-li {
        border: mediumpurple solid 3px;
        background-color: lightslategray;
        color: white;
    }
</style>