<template>
  <div class="editorCrop">
    <div style="float:left">
      <router-link :to="{ name: 'Home'}">홈</router-link>
      <router-link :to="{ name: 'editorPos'}">AudioGram 그래프 좌표 수정</router-link>

      <canvas id="c" style="border: 1px solid;"></canvas>
      <!-- <select name="language" v-model="currentTarget" @change="initArea">
        <option value="jeonnam">전남</option>
        <option value="jeonbuk">전북</option>
        <option value="chungnam">충남</option>
        <option value="gyeongbuk">경북</option>
      </select> -->

      <button @click="setPosition">크롭좌표 설정</button>
      <input type="file" ref='imageUpload' @change="changeImage">audioGram 이미지 업로드
    </div>
    <div>
      <ul>
        <div v-for="(item) of boxObj" :key="item.id" @click="getActiveObj">
          <li>X: {{item.left}}, Y: {{item.top}}, Width:
            {{item.width*item.scaleX}}, Height: {{item.height*item.scaleY}}, {{ item.id }}</li>
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
    name: 'editorCrop',

    data() {
      return {
        originalData: null,
        image: null,
        position: null,
        currentTarget: '광주',
        boxObj: []
      }
    },

    mounted() {
      this.canvas = new fabric.Canvas('c', {
        hoverCursor: 'crosshair',
        fireRightClick: true,
        stopContextMenu: true
      })

      this.getPosition()

      this.setKeyboardEvent()

      this.canvas.on('mouse:down', (evt) => {
          if (evt.button == 3) {
            this.drawBox();
          }
        })
        .on('object:added', (evt) => {
          if (evt.target.id != 'audiogram')
            this.boxObj.push(evt.target);
        })
    },

    destroyed() {
      window.removeEventListener('keydown', () => console.log('이벤트 리스너 삭제 완료'));
    },

    methods: {
      setKeyboardEvent() {
        document.addEventListener('keydown', (evt) => {
          const keyCode = evt.key;
          const activeObj = this.canvas.getActiveObject()
          console.log(activeObj)

          if (activeObj != null) {
            if (keyCode == 'ArrowLeft') {
              activeObj.setLeft(activeObj.left - 0.5)
            } else if (keyCode == 'ArrowUp') {
              activeObj.setTop(activeObj.top - 0.5)
            } else if (keyCode == 'ArrowRight') {
              activeObj.setLeft(activeObj.left + 0.5)
            } else if (keyCode == 'ArrowDown') {
              activeObj.setTop(activeObj.top + 0.5)
            } else if (keyCode == 'Delete') {
              this.deleteObj(activeObj)
              this.canvas.remove(activeObj)
            }

            evt.preventDefault();
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

      getActiveObj() {

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

      calcPer(target) {
        return {
          x: target.left / this.image.width * 100,
          y: target.top / this.image.height * 100,
          w: ((target.width * target.scaleX) / this.image.width) * 100,
          h: ((target.height * target.scaleY) / this.image.width) * 100
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
        this.canvas.selected = false
        this.originalData[this.currentTarget]['box'] = this.boxObj.map(item => this.calcPer(item));
        console.log(this.originalData)

        await axios({
          method: 'post',
          url: 'http://localhost:3000/api/setPosition',
          data: {
            id: this.currentTarget,
            data: this.originalData
          }
        })

        this.getPosition()
      },

      drawBox() {
        const forId = new Date()

        const box = new fabric.Rect({
          left: this.image.width / 2,
          top: this.image.height / 2,
          fill: 'purple',
          width: 100,
          height: 100,
          opacity: 0.1,
          border: 2,
          id: `box_${forId.getTime()}`
        })

        this.canvas.add(box);

        return box;
      },

      deleteObj(target) {
        this.boxObj.forEach((item, idx) => {
          if (item.id == target.id) this.boxObj.splice(idx, 1)
        });
      }
    }
  }
</script>