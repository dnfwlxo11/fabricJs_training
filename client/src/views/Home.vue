<template>
    <div>
        <select name="area" v-model="areaName">
            <option value="default">--- 선택 ---</option>
        </select>

        <div>
            <div v-if="areaName == 'default'">
                <input type="text" placeholder="새로 만들 이름을 입력" v-model="newArea">
                <button type="button" @click="addArea">추가</button>
            </div>
            <router-link v-if="areaName != 'default'" :to="{ name: 'editorCrop', params: { id: areaName }}">시작하기</router-link>
        </div>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'Home',

    data() {
        return {
            areaName: 'default',
            newArea: ''
        }
    },

    mounted() {
        this.initArea()
    },

    methods: {
        async initArea() {
            let res = await axios.get('http://localhost:3000/api/getArea')

            res.data.rows.forEach(item => {
                const area = new Option();
                area.value = item.id;
                area.text = item.id;
                document.getElementsByName('area')[0].add(area);
            })
        },

        async addArea() {
            if (this.area == '') {
                alert('입력해주세요')
                return false;
            }

            const area = new Option();
            area.value = this.newArea;
            area.text = this.newArea;
            document.getElementsByName('area')[0].add(area);

            await axios.post('http://localhost:3000/api/initArea', {
                data: {
                    id: this.newArea,
                    pos_data: {"box":[], "point":{}}
                }
            });

            this.newArea = '';
        }
    }
}
</script>