<template>
  <div class="home">
    <div style="float: left">
      <canvas id="c" style="border: 1px solid;" ref="canvas"></canvas>
    </div>

    <div>
      <select name="language" v-model="currentTarget" @change="setArea">
        <option value="jeonnam">전남</option>
        <option value="jeonbuk">전북</option>
        <option value="chungnam">충남</option>
        <option value="gyeongbuk">경북</option>
      </select>

      <button @click="setPosition">초기좌표 조정</button>
      <button @click="addCircle">커서추가</button>
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
        position_init: null,
        position: {
          left: {},
          right: {}
        },
        canvas: null,
        image: null,
        currentTarget: 'chungnam'
      }
    },

    mounted() {
      this.canvas = new fabric.Canvas('c');

      this.getPosition();

      this.canvas.on('object:moving', (e) => {
        if (e.target.direction) this.position.left[e.target.id] = `${((e.target.left / this.image.width) * 100).toFixed(2)},${((e.target.top / this.image.height) * 100).toFixed(2)}`;
        else this.position.right[e.target.id] = `${((e.target.left / this.image.width) * 100).toFixed(2)},${((e.target.top / this.image.height) * 100).toFixed(2)}`;
      });
    },

    methods: {
      async getPosition() {
        let res = await axios.get('http://localhost:3000/api/getPosition')
        this.position_init = res.data.rows[0].table_position
      },

      async setPosition() {
        // console.log(JSON.stringify(this.position_init))
        this.position_init[this.currentTarget] = this.position

        let res = await axios({
          method: 'post',
          url: 'http://localhost:3000/api/setPosition',
          data: {
            position: this.position_init
          }
        })

        alert('초기좌표 조정이 완료되었습니다.')
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

        this.setArea()
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

      setArea() {
        this.canvas.getObjects().forEach(item => {
          if (item.id != 'audiogram') this.canvas._objects.pop();
        })

        const posLeft = Intervals[this.currentTarget].left;
        const posRight = Intervals[this.currentTarget].right;
        const posLeftKey = Object.keys(Intervals[this.currentTarget].left)
        const posRightKey = Object.keys(Intervals[this.currentTarget].right)

        this.drawCircle(posLeft, posLeftKey, true);
        this.drawCircle(posRight, posRightKey, false);
      },

      drawCircle(_item, _key, mode) {
        _key.forEach((item, idx) => {
          const position = _item[item].split(',')

          const circle = new fabric.Circle({
            left: (position[0] * this.image.width) * 0.01,
            top: (position[1] * this.image.height) * 0.01,
            radius: 3,
            id: item,
            direction: mode
          });

          if (mode) this.position.left[circle.id] = `${position[0]},${position[1]}`;
          else this.position.right[circle.id] = `${position[0]},${position[1]}`;
          circle.hasControls = false;
          this.canvas.add(circle);
        })
      },

      addCircle() {
        const circle = new fabric.Circle({
          left: 0,
          top: 0,
          radius: 7,
          id: this.position.length
        });

        this.position.left[circle.id] = `0,0`;

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