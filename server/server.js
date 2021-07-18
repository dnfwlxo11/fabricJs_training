const express = require('express')
const app = express()
const mysql = require('mysql2/promise')
const Query = require('./router/Query')
const cors = require('cors');

const PORT = 3000;

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: 13000,
    database: 'positions'
}

const pool = mysql.createPool(dbConfig);

app.use(cors());
app.use(express.json())

app.get('/api/getArea', (req, res) => {
    const result = async () => {
        const conn = await pool.getConnection();

        try {
            const [rows, fields] = await conn.query(Query.selectArea());

            conn.release();
            res.send({ success: true, rows });
        } catch (err) {
            console.log(err)
            conn.release();
            res.send({ success: false, err })
        }
    }

    result();
})

app.post('/api/initArea', (req, res) => {
    const result = async () => {
        const conn = await pool.getConnection();

        try {
            const [rows, fields] = await conn.query(Query.insertArea(req.body.data));

            conn.release();
            res.send({ success: true, rows });
        } catch (err) {
            console.log(err)
            conn.release();
            res.send({ success: false, err })
        }
    }

    result();
})

app.post('/api/getPosition', (req, res) => {
    const result = async () => {
        const conn = await pool.getConnection();

        try {
            const [rows, fields] = await conn.query(Query.selectPosition(req.body));

            console.log(rows)
            conn.release();
            res.send({ success: true, rows });
        } catch (err) {
            console.log(err)
            conn.release();
            res.send({ success: false, err })
        }
    }

    result();
})

app.post('/api/setPosition', (req, res) => {
    console.log(req.body)

    const result = async () => {
        const conn = await pool.getConnection();

        try {
            const ended = await conn.query(Query.updatePosition(req.body));

            console.log(ended)
            conn.release();
            res.send({ success: true, ended });
        } catch (err) {
            console.log(err)
            conn.release();
            res.send({ success: false, err })
        }
    }

    result();
})

app.listen(PORT, () => {
    console.log('start Server!!');
})