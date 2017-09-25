require('dotenv').config()

const express = require('express')
const path = require('path')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const expressJwt = require('express-jwt')
const cors = require('cors')
const query = require('./query')

const app = express()


app.set('view engine', 'pug')

app.use(cors())
app.use(express.static(path.join(__dirname, '..', 'public')))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


const authMiddleware = expressJwt({secret:process.env.SESSION_SECRET})

app.get('/user',authMiddleware, (req, res) => {
  // authMiddleware가 express-jwt라서 서명할 때의 정보를 가져올 수 있다.
  res.render('login.pug')
  query.findUserId(req.user.id)
    .then(user => {
      res.send({
        username: user.username
      })
    })
})

// app.get('/', (req,res) => {
//   res.render('index.pug')
// })

app.post('/user', (req, res) => {
  query.createUser(req.body.username, req.body.password)
  .then(([id]) => {
    // sign 으로 들어가는 값인 id를 잘 받아와야한다.
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
      const token = jwt.sign({id: matched.id}, process.env.SESSION_SECRET)
      res.send({
        token
      })
    })
})

app.get('/todos', authMiddleware, (req, res) => {
  // expressjwt로 만든 authMiddleware안의 값은 req.user에 값이 들어간다. 값 = jwt.sign할때 넣은 값이다.
  // db를 사용하기 위해서 user_id Snake Case를 사용했다.
  const user_id = req.user.id
  // userId가 소유하고 있는 할일 목록을 불러와서 반환
  query.getTodosByUserId(user_id)
    .then(todos => {
      res.send(todos)
    })
})

app.post('/todos', authMiddleware, (req, res) => {
  const user_id = req.user.id
  const {title} = req.body
  query.createTodo(user_id, title)
    .then(([id]) => {
      return query.getTodoById(id)
    })
    .then(todo => {
      res.status(201)
      res.send(todo)
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

