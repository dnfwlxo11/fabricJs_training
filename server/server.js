const express = require('express')
const app = express()
const mysql = require('mysql2/promise')
const Query = require('./router/Query')
const fs = require('fs')
const atob = require('atob')
const cors = require('cors')

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
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: false }))

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

            !fs.readdir(`./images/${req.body.data.id}`, (err) => {
                if (err) {
                    fs.mkdirSync(`./images/${req.body.data.id}`)
                }
            })

            res.send({ success: true, rows });
        } catch (err) {
            console.log(err)
            conn.release();
            res.send({ success: false, err })
        }
    }

    result();
})

function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};
  
    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }
  
    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');
  
    return response;
}

app.post('/api/uploadImage', (req, res) => {
    let image = req.body.image

    const imageBuffer = decodeBase64Image(image)

    fs.writeFile(`./images/${req.body.area}/default.png`, imageBuffer.data, function(err) { 
        if (err) throw err
        res.send({ success: true })
    })
})

app.get('/api/loadImage/:id', (req, res) => {
    const area = req.params.id

    fs.readFile(`./images/${area}/default.png`, (err, data) => {
        if (err) {
            res.send({
                success: false,
                msg: 'default 이미지가 없습니다.',
                err
            })
        } else {
            data = new Buffer(data, 'utf-8').toString('base64')
            res.send({ success: true, data })
        }
    })
})

app.post('/api/getPosition', (req, res) => {
    const result = async () => {
        const conn = await pool.getConnection();

        try {
            const [rows, fields] = await conn.query(Query.selectPosition(req.body));

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