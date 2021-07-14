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
      <button @click="addCircle">커서추가</button>
      <input type="file" @change="changeImage">audioGram 이미지 업로드
    </div>
  </div>
</template>

<script>
  import {
    fabric
  } from "fabric";
  import axios from 'axios';

  export default {
    name: 'Home',

    data() {
      return {
        position: null,
        cursor: require('../assets/x_cursor.png'),
        canvas: null,
        image: null,
        currentTarget: 'chungnam',
        activeTarget: null
      }
    },

    mounted() {
      this.canvas = new fabric.Canvas('c');
      this.canvas.hoverCursor = 'crosshair'

      this.getPosition();

      this.setKeyboardEvent();

      this.canvas.on('selection:created', (e) => {
        e.target.hasControls = false;
        e.target.lockUniScaling = false;
        this.activeTarget = e.selected
      })

      this.canvas.on('selection:cleared', (e) => {
        if (this.activeTarget != null) {
          this.activeTarget.forEach((item, idx) => {
            if (this.activeTarget[idx].direction) this.position[this.currentTarget].left[this.activeTarget[idx]
              .id] = this.calcPer(this.activeTarget[idx].left, this.activeTarget[idx].top)
            else this.position[this.currentTarget].right[this.activeTarget[idx].id] = this.calcPer(this
              .activeTarget[idx].left, this.activeTarget[idx].top);
          })
        }

        this.activeTarget = null
      })
    },

    beforeDestroy() {
      window.removeEventListener('keydown', () => console.log('이벤트 리스너 삭제 완료'));
    },

    methods: {
      setKeyboardEvent() {
        document.addEventListener('keydown', (e) => {
          const keyCode = e.key;
          console.log(keyCode)

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
                if (item.direction) delete this.position[this.currentTarget].left[item.id]
                else delete this.position[this.currentTarget].right[item.id]
              })
            }

            e.preventDefault();
            this.canvas.renderAll();
          }
        })
      },

      async getPosition() {
        let res = await axios.get('http://localhost:3000/api/getPosition')
        this.position = res.data.rows[0].table_position
      },

      async setPosition() {
        this.canvas.discardActiveObject();
        this.canvas.selected = false;

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

      createPoint(left, top, id) {
        return new Promise((resolve) => {
          new fabric.Image.fromURL(this.cursor, (img) => {
            img.set({
              left: left,
              top: top,
              id: id
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

      async drawCircle(_item, _key, mode) {
        _key.forEach((item, idx) => {
          if (_item == "") return false;

          const position = _item[item].split(',')

          // const circle = new fabric.Circle({
          //   left: (position[0] * this.image.width) * 0.01,
          //   top: (position[1] * this.image.height) * 0.01,
          //   radius: 2,
          //   id: item,
          //   direction: mode
          // });

          const cursor = await this.createPoint((position[0] * this.image.width) * 0.01, (position[1] * this.image.height) * 0.01, 'test');
          console.log(cursor)
          // circle.hasControls = false;
          // circle.lockUniScaling = true;

          // this.canvas.add(circle);
          // this.canvas.add(cursor);
        })
      },

      onSelectedObject(evt) {
        console.log(evt.target.left)
      },

      addCircle() {
        const circle = new fabric.Circle({
          left: 0,
          top: 0,
          radius: 2,
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