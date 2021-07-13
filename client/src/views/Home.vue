<template>
  <div class="home">
    <div style="float: left">
      <canvas id="c" style="border: 1px solid;" ref="canvas"></canvas>
    </div>

    <div>
      <select name="language" v-model="currentTarget" @change="initArea">
        <option value="jeonnam">전남</option>
        <option value="jeonbuk">전북</option>
        <option value="chungnam">충남</option>
        <option value="gyeongbuk">경북</option>
      </select>

      <button @click="setPosition">초기좌표 조정</button>
      <button @click="check">커서추가</button>
      <input type="file" @change="changeImage">audioGram 이미지 업로드
    </div>
  </div>
</template>

<script>
  import { fabric } from "fabric";
  import axios from 'axios';
  import Intervals from '@/position_init'


  export default {
    name: 'Home',

    data() {
      return {
        position: null,
        canvas: null,
        image: null,
        currentTarget: 'chungnam',
        activeTarget: null
      }
    },

    mounted() {
      

      this.canvas = new fabric.Canvas('c');

      this.getPosition();

      

      document.addEventListener('keydown', (e) => {
        const keyCode = e.keyCode;
        const objectTarget = this.activeTarget;
        console.log(objectTarget)
        if (objectTarget != null) {
          if(keyCode == 37){ // Enter key
            objectTarget.forEach(item => {
              item.left -= 0.5;
            })
          } else if (keyCode == 38) {
            objectTarget.forEach(item => {
              item.top -= 0.5;
            })
          } else if (keyCode == 39) {
            objectTarget.forEach(item => {
              item.left += 0.5;
            })
          } else if (keyCode == 40) {
            objectTarget.forEach(item => {
              item.top += 0.5;
            })
          } else if (keyCode == 46) {
            console.log('지운다')
            this.canvas.remove(objectTarget);
          }

          this.canvas.renderAll();
        }
      })

      document.addEventListener('keyup', () => {
        this.activeTarget.forEach(item => {
          if (item.direction) this.position[this.currentTarget].left[item.id] = this.calcPer(item.left, item.top)
          else this.position[this.currentTarget].right[e.target.id] = this.calcPer(item.left, item.top)
        })
      })

      this.canvas.on('object:moving', (e) => {
        if (e.target.direction) this.position[this.currentTarget].left[e.target.id] = this.calcPer(e.target.left, e.target.top)
        else this.position[this.currentTarget].right[e.target.id] = this.calcPer(e.target.left, e.target.top);
      });

      this.canvas.on('selection:created', (e) => {
        this.activeTarget = e.selected;
      })

      this.canvas.on('selection:cleared', () => {
        this.activeTarget = null;
      })
    },

    methods: {
      check() {
        console.log(this.position)
      },

      async getPosition() {
        let res = await axios.get('http://localhost:3000/api/getPosition')
        this.position = res.data.rows[0].table_position
      },

      async setPosition() {

        await axios({
          method: 'post',
          url: 'http://localhost:3000/api/setPosition',
          data: {
            position: this.position
          }
        })

        alert('초기좌표 조정이 완료되었습니다.')
        this.getPosition()
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

        this.initArea()
      },

      calcPer(pointL, pointT) {
        return `${((pointL / this.image.width) * 100).toFixed(2)},${((pointT / this.image.height) * 100).toFixed(2)}`;
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

      initArea() {
        this.canvas.getObjects().forEach(item => {
          if (item.id != 'audiogram') this.canvas._objects.pop();
        })

        const posLeft = this.position[this.currentTarget].left;
        const posRight = this.position[this.currentTarget].right;
        const posLeftKey = Object.keys(this.position[this.currentTarget].left)
        const posRightKey = Object.keys(this.position[this.currentTarget].right)

        this.drawCircle(posLeft, posLeftKey, true);
        this.drawCircle(posRight, posRightKey, false);
      },

      drawCircle(_item, _key, mode) {
        _key.forEach((item, idx) => {
          const position = _item[item].split(',')

          const circle = new fabric.Circle({
            left: (position[0] * this.image.width) * 0.01,
            top: (position[1] * this.image.height) * 0.01,
            radius: 2,
            id: item,
            direction: mode
          });

          if (mode) this.position[this.currentTarget].left[circle.id] = `${position[0]},${position[1]}`;
          else this.position[this.currentTarget].right[circle.id] = `${position[0]},${position[1]}`;
          circle.hasControls = false;
          this.canvas.add(circle);
        })
      },

      addCircle() {
        const circle = new fabric.Circle({
          left: 0,
          top: 0,
          radius: 7,
          id: this.position[this.currentTarget].length
        });

        this.position[this.currentTarget].left[circle.id] = `0,0`;

        circle.set('hasControls', false);
        this.canvas.add(circle);
      }
    }
  }
</script>

<style>
  img {
    background: transparent;
  }
</style>