require('dotenv').config()

const express = require('express')
const path = require('path')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')

const query = require('./query')

const app = express()


app.set('view engine', 'pug')

app.use(express.static(path.join(__dirname, '..', 'public')))
app.use(bodyParser.json())


app.get('/', (req,res) => {
  res.render('index.pug')
})

app.post('/user', (req, res) => {
  query.createUser(req.body.username, req.body.password)
  .then(([id]) => {
    const token = jwt.sign({id}, process.env.SESSION_SECRET)
    res.send({
      token
    })
  })
})

app.post('/login', (req, res) => {
  const {username, password} = req.body

  query.compareUser(username, password)
    .then(matched => {
      const token = jwt.sign({username: matched.username}, process.env.SESSION_SECRET)
      res.send({
        token
      })
    })
})

app.listen(process.env.PORT, () => {
  console.log('connect!!!')
})

