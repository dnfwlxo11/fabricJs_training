<template>
  <div class="editorPos">
    <div>
      <router-link :to="{ name: 'Home'}">홈</router-link>
    </div>

    <canvas id="c" style="border: 1px solid;" ref="canvas"></canvas>

    <div>
      <button @click="setPosition">초기좌표 조정</button>
    </div>

    <div v-if="image&&!isData" id="inputs">
      <div>
        개수 : {{ shaftNumX }}
        x축을 입력해주세요. <button type="button" @click="addShaft(true, 'init', 0)">축 추가</button>
        <div id="xShaft"></div>
      </div>
      <div>
        개수 : {{ shaftNumY }}
        y축을 입력해주세요. <button type="button" @click="addShaft(false, 'init', 0)">축 추가</button>
        <div id="yShaft"></div>
      </div>
      <button type="button" @click="addCircleMultiple('init')">생성</button>
    </div>
    <button type="button" @click="resetPoint">초기화</button>
    <div>
      <ul>
        <div v-for="item of pointObj" :key="item.id">
          <li>{{item.id}} {{item.left}} {{item.top}}</li>
        </div>
      </ul>
    </div>
  </div>
</template>

<script>
  import {
    fabric
  } from "fabric";
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
        image: null,
        isData: false,
        currentTarget: this.$route.params.id,
        cropImages: this.$route.params.cropImages
      }
    },

    mounted() {
      this.canvas = new fabric.Canvas('c', {
        hoverCursor: 'crosshair',
        fireRightClick: true,
        stopContextMenu: true
      })

      this.canvas.hoverCursor = 'crosshair'

      this.canvas.on('object:added', (evt) => {
        if (evt.target.id != 'audiogram')
          this.pointObj.push(evt.target);
      })

      this.setKeyboardEvent();

      this.setFabricImage(this.cropImages[0])
  
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
      setKeyboardEvent() {
        document.addEventListener('keydown', (e) => {
          const keyCode = e.key;

          if (this.canvas.getActiveObject() != undefined) {
            const activeObj = this.canvas.getActiveObject()._objects ? this.canvas.getActiveObject()._objects : [
              this.canvas.getActiveObject()
            ]
            console.log(activeObj)
            if (keyCode == 'ArrowLeft') { // Enter key
              activeObj.forEach(item => {
                item.set('left', item.left - 0.5);
              })
            } else if (keyCode == 'ArrowUp') {
              activeObj.forEach(item => {
                item.set('top', item.top - 0.5);
              })
            } else if (keyCode == 'ArrowRight') {
              activeObj.forEach(item => {
                item.set('left', item.left + 0.5);
              })
            } else if (keyCode == 'ArrowDown') {
              activeObj.forEach(item => {
                item.set('top', item.top + 0.5);
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

            if (!xBuf.includes(values.split(',')[0])) this.addShaft(true, 'load', values.split(',')[0])
            if (!yBuf.includes(values.split(',')[1])) this.addShaft(false, 'load', values.split(',')[1])
            
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

      setFabricImage(url) {
        return new Promise((resolve) => {
          new fabric.Image.fromURL(url, (img) => {
            img.set({
              left: 0,
              top: 0,
              width: img.width,
              height: img.height,
              id: 'audiogram'
            })

            img.selectable = false;
            this.image = img
            this.canvas.add(img)
            this.canvas.setWidth(img.width)
            this.canvas.setHeight(img.height)

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
            if (mode == 'init') this.addCircle(i*this.intervalX, j*this.intervalY, this.xShaft[i].value, this.yShaft[j].value)
            else this.addCircle(data.x * this.image.width * 0.01, data.y * this.image.height * 0.01, this.xShaft[i].value, this.yShaft[j].value)
          }
        }

        this.isData = true
      },

      addCircle(x, y, i, j) {
        const circle = new fabric.Circle({
          left: x,
          top: y,
          radius: 2,
          id: `circle_${i},${j}`
        });

        circle.set('hasControls', false);
        this.canvas.add(circle);
      },

      deleteCircle(target) {
        this.pointObj.forEach((item, idx) => {
          if (item.id == target.id) this.pointObj.splice(idx, 1)
        })
      },

      addShaft(shaft, mode, value) {
        const shaftName = shaft ? 'xShaft' : 'yShaft'
        const input = document.createElement('input')
        input.setAttribute('placeholder', '값 입력')

        if (mode == 'load') input.setAttribute('value', value)

        document.getElementById(shaftName).appendChild(input)

        if (shaftName == 'xShaft') this.xShaft.push(input)
        else this.yShaft.push(input)
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
          if (item.id != 'audiogram') this.canvas.remove(item)
        })

        while (xEle.hasChildNodes()) {
          xEle.removeChild(xEle.firstElementChild)
        }

        while (yEle.hasChildNodes()) {
          yEle.removeChild(yEle.firstElementChild)
        }
      }
    },
  }
</script>

<style>
  img {
    background: transparent;
  }
</style>