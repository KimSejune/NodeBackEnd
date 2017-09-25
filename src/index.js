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

class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NotFoundError'
  }
}
class ForbiddenError extends Error {
  constructor(message) {
    super(message)
    this.name = "ForbiddenError"
  }
}

const authorizeTodo = user_id => todo => {
  if(!todo) {
    // 404
    throw new NotFoundError('경로를 찾을 수 없습니다.')
  } else if (todo.user_id !== user_id){
    // 403
    throw new ForbiddenError('허가되지 않은 접근입니다.')
  } else {
    return
  }
}

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
  const id = req.user.id
  const {title} = req.body
  query.createTodo(id, title)
    .then(([id]) => {
      return query.getTodoById(id)
    })
    .then(todo => {
      // 201 = create
      res.status(201)
      res.send(todo)
    })
})



app.patch('/todos/:id', authMiddleware, (req, res, next) => {
  // query.updateTodoById(1, {title: 'new title'})
  // query.updateTodoById(1, {complete: true})
  // query.updateTodoById(1, {title: 'new title', complete: true})
  const id = req.params.id
  const title = req.body.title
  const complete = req.body.complete
  // req.user는 authMiddleware가 넣어준 것이고 이것은 token의 정보이다.
  // 인가의 문제를 해결한다.
  const user_id = req.user.id
  query.getTodoById(id)
  // authorizeTodo todo를 값으로 가지는 함수를 반환한다.
    .then(authorizeTodo(user_id))
    .then(() => {
      query.updateTodoById(id, {title, complete})
      // knex 문서에는 [id]로 받아와야한다고 하지만 id로 받아와야지 값이 들어간다.
        .then(id => {
          return query.getTodoById(id)
        })
        .then(todo => {
          // 200 = success
          res.status(200)
          res.send(todo)
        })
    })
    .catch(next)
})

app.delete('/todos/:id', authMiddleware, (req, res, next  ) => {
  const id = req.params.id
  const user_id = req.user.id
  query.getTodoById(id)
    .then(authorizeTodo(user_id))
    .then(() => {
      query.deleteTodoById(id)
      .then(() => {
        res.end()
      })
    })
    .catch(next)
})

// error 처리 middleware
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({
      error: err.name,
      message: err.message
    })
  } else if (err instanceof NotFoundError) {
    // 위에서 발생한 err를 처리한다.
    res.status(404)
      res.send({
        message: err.message
      })
  } else if (err instanceof ForbiddenError) {
      res.status(403)
      res.send({
        message: err.message
      })
  }
})



app.listen(process.env.PORT, () => {
  console.log('connect!!!')
})

