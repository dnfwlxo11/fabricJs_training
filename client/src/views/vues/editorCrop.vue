<template>
  <div class="editorCrop">
    <div>
      <router-link :to="{ name: 'Home'}">홈</router-link>
      <router-link :to="{ name: 'editorPos'}">AudioGram 그래프 좌표 수정</router-link>
    </div>

    <canvas id="c" style="border: 1px solid;"></canvas>
    <div>
      <!-- <select name="language" v-model="currentTarget" @change="initArea">
        <option value="jeonnam">전남</option>
        <option value="jeonbuk">전북</option>
        <option value="chungnam">충남</option>
        <option value="gyeongbuk">경북</option>
      </select> -->

      <button @click="setPosition">크롭좌표 설정</button>
      <input type="file" ref='imageUpload' @change="changeImage">audioGram 이미지 업로드
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
        mouseDown: {
          x: null,
          y: null
        },
        mouseUp: {
          x: null,
          y: null
        },

        image: null,
        originalData: null,
        position: null,
        currentTarget: 'chungnam',
        boxObj: []
      }
    },

    mounted() {
      this.canvas = new fabric.Canvas('c')
      this.canvas.hoverCursor = 'crosshair'

      // this.getPosition()

      this.setKeyboardEvent()

      this.canvas.on('selection:created', (e) => {
        this.activeTarget = e.selected
      })


      this.canvas.on('selection:cleared', (e) => {
        this.updateRect()

        this.activeTarget = null
      })

      this.canvas.on('mouse:down', (e) => {
        if (e.target.id == 'audiogram') {
          this.mouseDown.x = e.pointer.x
          this.mouseDown.y = e.pointer.y
        }
      })

      this.canvas.on('mouse:up', (e) => {
        if (e.target.id == 'audiogram') {
          this.canvas.discardActiveObject()
          this.canvas.selectable = false;

          this.mouseUp.w = e.pointer.x - this.mouseDown.x, 
          this.mouseUp.h = e.pointer.y - this.mouseDown.y
          this.canvas.selected = false

          this.drawBox(this.mouseDown.x, this.mouseDown.y, this.mouseUp.w, this.mouseUp.h)
          this.mouseDown.x = null
          this.mouseDown.y = null
          this.mouseUp.w = null
          this.mouseUp.h = null
        }
      })
    },

    beforeDestroy() {
      window.removeEventListener('keydown', () => console.log('이벤트 리스너 삭제 완료'));
    },

    methods: {
      setKeyboardEvent() {
        document.addEventListener('keydown', (e) => {
          const keyCode = e.key;

          if (this.activeTarget != null) {
            if (keyCode == 'ArrowLeft') { // Enter key
              this.activeTarget.forEach(item => {
                item.set('left', item.left - 0.5);
              })
            } else if (keyCode == 'ArrowUp') {
              this.activeTarget.forEach(item => {
                item.set('top', item.top - 0.5);
              })
            } else if (keyCode == 'ArrowRight') {
              this.activeTarget.forEach(item => {
                item.set('left', item.left + 0.5);
              })
            } else if (keyCode == 'ArrowDown') {
              this.activeTarget.forEach(item => {
                item.set('top', item.top + 0.5);
              })
            } else if (keyCode == 'Delete') {
              this.activeTarget.forEach(item => {
                this.canvas.remove(item);
                if (item.direction) delete this.position.top.left.position[item.id]
                else delete this.position.top.right.position[item.id]
              })
            }

            e.preventDefault();
            this.canvas.renderAll();
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

        // this.initArea()
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

      updateRect() {
        this.boxObj.forEach(item => {
          this.position.top[item.direction ? 'left' : 'right'].crop = {
            "x": this.calcPer(item.left, true),
            "y": this.calcPer(item.top, false),
            "w": this.calcPer(item.width * item.scaleX, true),
            "h": this.calcPer(item.height * item.scaleY, false)
          }
        })
      },

      async getPosition() {
        let res = await axios.get('http://localhost:3000/api/getPosition')
        this.originalData = JSON.parse(res.data.rows[0].pos_data.replaceAll('\\', ''))
        this.position = this.originalData[this.currentTarget]
      },

      async setPosition() {
        this.updateRect();

        this.canvas.discardActiveObject()
        this.canvas.selected = false
        this.originalData[this.currentTarget] = this.position

        await axios({
          method: 'post',
          url: 'http://localhost:3000/api/setPosition',
          data: {
            position: this.originalData
          }
        })

        alert('크롭좌표 조정이 완료되었습니다.')
        this.getPosition()
      },

      calcPer(point, mode) {
        return (mode ? (point / this.image.width) * 100 : (point / this.image.height) * 100).toString();
      },

      calcFix(point, mode) {
        return mode ? parseFloat(point) * this.image.width * 0.01 : parseFloat(point) * this.image.height * 0.01

      },

      initArea() {
        this.position = this.originalData[this.currentTarget];

        this.canvas.getObjects().forEach(item => {
          if (item.id != 'audiogram') this.canvas._objects.pop();
        })

        const leftCrop = this.getBoxPosition('left')
        const rightCrop = this.getBoxPosition('right')

        this.drawBox(this.calcFix(leftCrop.x, true), this.calcFix(leftCrop.y, false), this.calcFix(leftCrop.w, true), this.calcFix(leftCrop.h, false), true);
        this.drawBox(this.calcFix(rightCrop.x, true), this.calcFix(rightCrop.y, false), this.calcFix(rightCrop.w, true), this.calcFix(rightCrop.h, false), false);
      },

      getBoxPosition(direction) {
        return this.position.top[direction].crop
      },

      drawBox(x, y, w, h, direction) {
        const box = new fabric.Rect({
          left: x,
          top: y,
          fill: 'purple',
          width: w,
          height: h,
          opacity: 0.1,
          border: 2,
          direction: direction,
          id: `box_${this.boxObj.length + 1}`
        })

        this.boxObj.push(box);
        this.canvas.add(box);

        return box;
      }
    }
  }
</script>