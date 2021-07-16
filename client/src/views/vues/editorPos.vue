<template>
  <div class="editorPos">
    <div>
      <router-link :to="{ name: 'Home'}">홈</router-link>
    </div>

    <canvas id="c" style="border: 1px solid;" ref="canvas"></canvas>

    <div>
      <button @click="setPosition">초기좌표 조정</button>
      <input type="file" @change="changeImage">audioGram 이미지 업로드
    </div>

    <div v-if="image" id="inputs">
      <div>
        개수 : {{ shaftNumX }}
        x축을 입력해주세요. <button type="button" @click="addShaft(true)">축 추가</button>
        <div id="xShaft"></div>
      </div>
      <div>
        개수 : {{ shaftNumY }}
        y축을 입력해주세요. <button type="button" @click="addShaft(false)">축 추가</button>
        <div id="yShaft"></div>
      </div>
      <button type="button" @click="addCircleMultiple">생성</button>
    </div>
    <button type="button" @click="initCanvas">초기화</button>
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

        intervalX: 0,
        intervalY: 0,

        pointObj: [],
        cursor: require('../../assets/x_cursor.png'),
        canvas: null,
        image: null,
        currentTarget: '광주'
      }
    },

    mounted() {
      this.canvas = new fabric.Canvas('c', {
        hoverCursor: 'crosshair',
        fireRightClick: true,
        stopContextMenu: true
      })

      this.canvas.hoverCursor = 'crosshair'

      this.getPosition();

      this.canvas.on('object:added', (evt) => {
        if (evt.target.id != 'audiogram')
          this.pointObj.push(evt.target);
      })

      this.setKeyboardEvent();
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
        console.log(this.originalData)
      },

      async setPosition() {
        this.canvas.discardActiveObject()

        const point = {}
        this.pointObj.forEach(item => {
          point[item.id] = this.calcPer(item)
        })
        this.originalData[this.currentTarget]['point'] = point;

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

      async changeImage(e) {
        if (!e.target.files.length) return false

        this.canvas.clear()
        const dataURL = await this.loadImgDataURL(e.target.files[0])
        this.image = await this.setFabricImage(dataURL)
        this.image.selectable = false;
        this.canvas.add(this.image)
        this.canvas.setWidth(this.image.width)
        this.canvas.setHeight(this.image.height)
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
              height: img.height,
              id: 'audiogram'
            })

            resolve(img)
          })
        })
      },

      addCircleMultiple() {
        const x = this.xShaft.length
        const y = this.yShaft.length

        this.intervalX = this.image.width / (x + 1)
        this.intervalY = this.image.height / (y + 1)

        for (let i = 0; i < x; i++) {
          for (let j = 0; j < y; j++) {
            this.addCircle(i, j)
          }
        }
      },

      addCircle(x, y) {
        const forId = new Date()
        const circle = new fabric.Circle({
          left: x * this.intervalX,
          top: y * this.intervalY,
          radius: 2,
          id: `circle_${this.xShaft[x].value},${this.yShaft[y].value}`
        });

        circle.set('hasControls', false);
        this.canvas.add(circle);
      },

      deleteCircle(target) {
        this.pointObj.forEach((item, idx) => {
          if (item.id == target.id) this.pointObj.splice(idx, 1)
        })
      },

      addShaft(shaft) {
        const shaftName = shaft ? 'xShaft' : 'yShaft'
        const input = document.createElement('input')
        input.setAttribute('placeholder', '값 입력')
        document.getElementById(shaftName).appendChild(input)

        if (shaftName == 'xShaft') this.xShaft.push(input)
        else this.yShaft.push(input)
      },

      initCanvas() {
        this.image.clear();
      }
    },
  }
</script>

<style>
  img {
    background: transparent;
  }
</style>