const express = require('express')
router = express.Router()

const UserController = require('../controllers/UserController')
const authenticate = require('../middlewares/authenticate')
const authorization = require('../middlewares/authorization')


// routes
router.get('/', UserController.getUser)
router.post('/create', 
    // authenticate,
    // authorization(['admin','user']),
    UserController.createUser
)
router.post('/sign-in', UserController.signIn)

module.exports = router