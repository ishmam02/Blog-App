const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth')

const { body } = require('express-validator')

const User = require('../models/user')


router.put('/signup', [
    body('email').isEmail().withMessage('Please provide a valid email')
    .custom((value, {req}) => {
        return User.findOne({email: value}).then(userDoc => {
            if(userDoc){
                return Promise.reject('Email already exists')
            }
        })
    })
    .normalizeEmail().notEmpty(),
    body('password').trim().isLength({min: 5}).notEmpty(),
    body('name').trim().notEmpty()
], authController.signup);

router.post('/login', authController.login);

module.exports = router