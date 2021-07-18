<template>
    <div class="container mt-5">
        <div class="row">
            <div class="col-md-6">
                <select class="form-control" name="area" v-model="areaName">
                    <option value="default">--- 선택 ---</option>
                </select>
            </div>

            <div class="col-md-6">
                <div class="row" v-if="areaName == 'default'">
                    <div class="col-6 mt-1">
                        <input class="input-group" type="text" placeholder="새로 만들 이름을 입력" v-model="newArea">
                    </div>
                    <div class="col-6">
                        <button class="btn btn-primary" type="button" @click="addArea">추가</button>
                    </div>
                </div>
                <div>
                    <router-link class="btn btn-primary" tag="button" v-if="areaName != 'default'" :to="{ name: 'editorCrop', params: { id: areaName }}">시작하기</router-link>
                </div>
            </div>
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