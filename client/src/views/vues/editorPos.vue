<template>
    <div class="editorPos">
        <div class="container mt-5">
            <nav class="navbar navbar-light mb-3" style="background-color: #e3f2fd;">
                <nav class="navbar navbar-expand-lg">
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav">
                            <li class="nav-item mr-3">
                                <router-link style="text-decoration: none; color: gray;" :to="{ name: 'Home'}">홈</router-link>
                            </li>
                            <li class="nav-item active mr-3">
                                <router-link
                                    style="text-decoration: none; color: gray;"
                                    :to="{ name: 'editorCrop', params: {cropImages}}">AudioGram 그래프 좌표 수정</router-link>
                            </li>
                            <li class="nav-item mr-3">
                                <router-link
                                    style="text-decoration: none; color: gray;"
                                    :to="{ name: 'editorPos', params: {cropImages}}">AudioGram 그래프 좌표 수정</router-link>
                            </li>
                        </ul>
                    </div>
                </nav>
            </nav>

            <div class="row">
                <div class="col-md-7 mr-5 mb-3" ref="canvasContainer">
                    <h3>좌표를 설정할 이미지</h3>
                    <canvas id="c" style="border: 1px solid;" ref="canvas"></canvas>
                    
                    <h3 class="mt-5">이미지 리스트</h3>
                    <div id="cropArea"></div>
                </div>
                <div class="col-md-4">
                    <div>
                        <button class="btn btn-primary mb-3" type="button" @click="setPosition">초기좌표 조정</button>
                    </div>

                    <div class="mb-3" v-if="image&&!isData" id="inputs">
                        <div class="mb-3">
                            <p>개수 : {{ shaftNumX }}</p>
                            <p>x축을 입력해주세요.</p>
                            <button class="btn btn-secondary" type="button" @click="addShaft(true, 'init', 0)">축 추가</button>
                            <div id="xShaft"></div>
                        </div>
                        <div class="mb-3">
                            <p>개수 : {{ shaftNumY }}</p>
                            <p>y축을 입력해주세요.</p>
                            <button class="btn btn-secondary" type="button" @click="addShaft(false, 'init', 0)">축 추가</button>
                            <div id="yShaft"></div>
                        </div>
                        <button class="btn btn-primary"  type="button" @click="addCircleMultiple('init')">생성</button>
                    </div>
                    <button class="btn btn-danger mb-3" type="button" @click="resetPoint">초기화</button>
                    <div>
                        <ul class="list-group" style="max-height: 600px; overflow: auto">
                            <div v-for="item of pointObj" :key="item.id">
                                <li class="list-group-item">{{item.id}}
                                    {{item.left}}
                                    {{item.top}}</li>
                            </div>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>

<script>
    import {fabric} from "fabric";
    import axios from 'axios';

    export default {
        name: 'editorPos',

        data() {
            return {
                originalData: null,

                xShaft: [],
                yShaft: [],
                values: [],

                intervalX: 0,
                intervalY: 0,

                pointObj: [],
                cursor: require('../../assets/x_cursor.png'),
                canvas: null,
                canvasTest: [],
                canvasWidth: 0,

                image: null,
                isData: false,
                currentTarget: this.$route.params.id,
                cropImages: this.$route.params.cropImages
            }
        },

        mounted() {
            this.canvasWidth = this.$refs.canvasContainer.clientWidth

            this.canvas = new fabric.Canvas('c', {
                hoverCursor: 'crosshair',
                fireRightClick: true,
                stopContextMenu: true
            }),

            this.canvas.hoverCursor = 'crosshair'

            this.canvas.on('object:added', (evt) => {
                if (!evt.target.id.includes('audiogram'))
                    this.pointObj.push(evt.target);
            })

            this.setKeyboardEvent();
            this.setCanvas()

            this.setFabricImage(this.cropImages[0], this.canvas)
            this.setCropImages()

            this.getPosition()
        },

        destroyed() {
            window.removeEventListener('keydown', () => console.log('이벤트 리스너 삭제 완료'));
        },

        computed: {
            shaftNumX() {
                return this.xShaft.length
            },

            shaftNumY() {
                return this.yShaft.length
            }
        },

        methods: {
            setCanvas() {
                this.originalCanvas = document.getElementById('c')
                this.originalCanvas.style.width = `${this.canvasWidth}px`
                this.originalCanvas.style.height = `${(this.canvasWidth * 9) / 16}px`
            },

            setCropImages() {
                this.cropImages.forEach((item, idx) => {
                    const newCanvas = document.createElement('canvas')
                    // style="border: 1px solid;"
                    newCanvas.setAttribute('id', `c_${idx}`)
                    newCanvas.style.border = '1px solid'

                    document.getElementById('cropArea').appendChild(newCanvas)
                    
                    const newFabric = new fabric.Canvas(`c_${idx}`, {
                        hoverCursor: 'crosshair',
                        fireRightClick: true,
                        stopContextMenu: true,
                        id: `c_${idx}`,
                        class: 'mb-3'
                    })

                    this.canvasTest.push(newFabric)
                    this.setFabricImage(item, newFabric)
                })
            },
          
            setKeyboardEvent() {
                document.addEventListener('keydown', (e) => {
                    const keyCode = e.key;

                    if (this.canvas.getActiveObject() != undefined) {
                        const activeObj = this.canvas.getActiveObject()._objects ? this.canvas.getActiveObject()._objects : [this.canvas.getActiveObject()]
                        if (keyCode == 'ArrowLeft') { // Enter key
                            activeObj.forEach(item => {
                                item.setLeft('left', item.left - 0.5);
                            })
                        } else if (keyCode == 'ArrowUp') {
                            activeObj.forEach(item => {
                                item.setTop('top', item.top - 0.5);
                            })
                        } else if (keyCode == 'ArrowRight') {
                            activeObj.forEach(item => {
                                item.setWidth('left', item.left + 0.5);
                            })
                        } else if (keyCode == 'ArrowDown') {
                            activeObj.forEach(item => {
                                item.setTop('top', item.top + 0.5);
                            })
                        } else if (keyCode == 'Delete') {
                            activeObj.forEach(item => {
                                this.canvas.remove(item);
                                this.deleteCircle(item);
                            })
                        }

                        e.preventDefault();
                        this.canvas.renderAll();
                    }
                })
            },

            calcPer(target) {
                return {
                    x: target.left / this.image.width * 100,
                    y: target.top / this.image.height * 100
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

                const pointKeys = Object.keys(this.originalData['point'])

                if (pointKeys.length != 0) {
                    pointKeys.forEach((item, idx) => {
                        // circle_x축명,y축명 으로 키 값이 저장됨
                        const values = item.split('_')[1]

                        const xBuf = this.xShaft.map(item => item.value)
                        const yBuf = this.yShaft.map(item => item.value)

                        if (!xBuf.includes(values.split(',')[0])) 
                            this.addShaft(true, 'load', values.split(',')[0])
                        if (!yBuf.includes(values.split(',')[1])) 
                            this.addShaft(false, 'load', values.split(',')[1])

                    })

                    this.addCircleMultiple('load')
                }
            },

            async setPosition() {
                this.canvas.discardActiveObject()

                const point = {}
                this.pointObj.forEach(item => {
                    point[item.id] = this.calcPer(item)
                })

                this.originalData['point'] = point;

                await axios({
                    method: 'post',
                    url: 'http://localhost:3000/api/setPosition',
                    data: {
                        id: this.currentTarget,
                        data: this.originalData
                    }
                })
            },

            setFabricImage(url, canvas) {
                return new Promise((resolve) => {
                    new fabric.Image.fromURL(url, (img) => {
                            img.set(
                                {
                                    left: 0, 
                                    top: 0, 
                                    width: img.width, 
                                    scaleX: this.canvasWidth / img.width,
                                    id: `audiogram_${canvas.id}`}
                            )

                            img.selectable = false;
                            this.image = img
                            canvas.add(img)
                            canvas.setWidth(img.width * img.scaleX)
                            canvas.setHeight(img.height)


                            resolve(img)
                        })
                })
            },

            addCircleMultiple(mode) {
                const x = this.xShaft.length
                const y = this.yShaft.length

                this.intervalX = this.image.width / (x + 1)
                this.intervalY = this.image.height / (y + 1)

                for (let i = 0; i < x; i++) {
                    for (let j = 0; j < y; j++) {
                        const data = this.originalData['point'][`circle_${this.xShaft[i].value},${this.yShaft[j].value}`]
                        if (mode == 'init') 
                            this.addCircle(
                                i * this.intervalX,
                                j * this.intervalY,
                                this.xShaft[i].value,
                                this.yShaft[j].value
                            )
                        else 
                            this.addCircle(
                                data.x * this.image.width * 0.01,
                                data.y * this.image.height * 0.01,
                                this.xShaft[i].value,
                                this.yShaft[j].value
                            )
                    }
                }

                this.isData = true
            },

            addCircle(x, y, i, j) {
                const circle = new fabric.Circle(
                    {left: x, top: y, radius: 2, id: `circle_${i},${j}`}
                );

                circle.set('hasControls', false);
                this.canvas.add(circle);
            },

            deleteCircle(target) {
                this.pointObj.forEach((item, idx) => {
                    if (item.id == target.id) 
                        this.pointObj.splice(idx, 1)
                })
            },

            addShaft(shaft, mode, value) {
                const shaftName = shaft ? 'xShaft' : 'yShaft'
                const input = document.createElement('input')
                input.setAttribute('placeholder', '값 입력')

                if (mode == 'load') 
                    input.setAttribute('value', value)

                document.getElementById(shaftName).appendChild(input)

                if (shaftName == 'xShaft') 
                    this.xShaft.push(input)
                else 
                    this.yShaft.push(input)
            },

            resetPoint() {
                this.isData = false
                this.xShaft = []
                this.yShaft = []
                this.pointObj = []
                this.originalData['point'] = {}

                const xEle = document.getElementById('xShaft')
                const yEle = document.getElementById('yShaft')

                this.canvas.getObjects().forEach(item => {
                        if (!item.id.includes('audiogram')) 
                            this.canvas.remove(item)
                        })

                while (xEle.hasChildNodes()) {
                    xEle.removeChild(xEle.firstElementChild)
                }

                while (yEle.hasChildNodes()) {
                    yEle.removeChild(yEle.firstElementChild)
                }
            }
        }
    }
</script>

<style>
    img {
        background: transparent;
    }
</style>