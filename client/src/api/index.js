import axios from 'axios'

const axiosService = axios.create({
    baseURL: 'http://localhost:3000'
})

function getArea() {
    return axiosService.get('/api/getArea')
}

function initArea(data) {
    return axiosService.post('/api/initArea', data)
}

function getPosition(data) {
    return axiosService.post('/api/getPosition', data)
}

function setPosition(data) {
    return axiosService.post('/api/setPosition', data)
}

module.exports = {
    getArea,
    initArea,
    getPosition,
    setPosition
}