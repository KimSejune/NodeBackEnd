const knex = require('./knex')
const bcrypt = require('bcrypt')

module.exports = {
/**
 *
 * @param {String} username
 * @param {String} password
 */
  createUser(username, password) {
    return bcrypt.hash(password, 10)
    .then( (hashed_password) => {
      return knex('user')
        .insert({
          username,
          hashed_password
        })
    })
  },

  compareUser(username, password) {
    return knex('user')
      .where({username})
      .first()
      .then(user => {
        return bcrypt.compare(password, user.hashed_password)
        .then(matched => {
          if(matched){
            return user
          }
          throw new Error('사용자 이름 혹은 비밀번호가 일치하지 않습니다.')
        })
      })
  },

  findUserId(id) {
    return knex('user')
      .where({id})
      .first()
  },

  getTodosByUserId(user_id) {
    return knex('todolist')
      .where({user_id})
  },

  createTodo(user_id, title) {
    return knex('todolist')
      .insert({
        user_id,
        title
      })
  },

  getTodoById(id) {
    return knex('todolist')
      .where({id})
      .first()
  },

  // title, complete를 객체로 하면 각자 수정이 가능하다. => index.js
  updateTodoById(id, {title, complete}) {
    return knex('todolist')
      .where({id})
      .update({title, complete})
  },

  deleteTodoById(id) {
    return knex('todolist')
    .where({id})
    .delete()
  }

}
