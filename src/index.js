require('dotenv').config()

const express = require('express')
const path = require('path')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const expressJwt = require('express-jwt')
const query = require('./query')

const app = express()


app.set('view engine', 'pug')

app.use(express.static(path.join(__dirname, '..', 'public')))
app.use(bodyParser.json())

const authMiddleware = expressJwt({secret:process.env.SESSION_SECRET})

app.get('/user',authMiddleware, (req, res) => {
  // authMiddleware가 express-jwt라서 서명할 때의 정보를 가져올 수 있다.
  query.findUserId(req.user.id)
    .then(user => {
      res.send({
        username: user.username
      })
    })
})

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

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({
      error: err.name,
      message: err.message
    })
  }
})

app.listen(process.env.PORT, () => {
  console.log('connect!!!')
})

