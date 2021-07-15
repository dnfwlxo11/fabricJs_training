<template>
    <div>
        <select name="area" v-model="areaName">
            <option value="default">--- 선택 ---</option>
            <option value="전남">전남</option>
            <option value="전북">전북</option>
            <option value="충남">충남</option>
            <option value="경북">경북</option>
        </select>

        <div>
            <input type="text" placeholder="새로 만들 이름을 입력" v-model="newArea">
            <button type="button" @click="addArea">추가</button>
            <router-link v-if="areaName != 'default'" :to="{ name: 'editorCrop', params: { areaName: areaName }}">시작하기</router-link>
        </div>
    </div>
</template>

<script>

export default {
    name: 'Home',

    data() {
        return {
            areaName: 'default',
            newArea: ''
        }
    },

    methods: {
        addArea() {
            if (this.area == '') {
                alert('입력해주세요')
                return false;
            }

            const area = new Option();
            area.value = this.newArea;
            area.text = this.newArea;
            document.getElementsByName('area')[0].add(area);
        }
    }
}
</script>