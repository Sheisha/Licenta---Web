const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');
const eAuth = require("../middleware/e-auth");

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login', 
    [
        body('email')
            .isEmail()
            .withMessage('Introdu un email valid.')
            .normalizeEmail(),
        body('password','Parola trebuie sa fie de cel putin 5 caractere.')
            .isLength({min: 5})
            .isAlphanumeric()
            .trim()
    ],
    authController.postLogin
);

router.post(
    '/signup', 
    [
        body('username')
            .isLength({min: 3})
            .withMessage('Numele dv trebuie sa aibe cel putin 3 caractere.'),
        check('email')

            .isEmail()
            .withMessage('Introdu un email valid.')
            .custom((value, {req}) => {
                // if(value === 'test@test.com'){
                //     throw new Error('This email address is forbidden.');
                // }
                // return true;
                return User.findOne({ email: value })
                    .then(userDoc => {
                        if (userDoc) {
                            return Promise.reject(
                                'E-mailul exista deja, folositi alt e-mail.'
                            );
                        }
            });
        })
        .normalizeEmail(),
    body('telefon')
        .isMobilePhone()
        .withMessage('Introduceti un numar de telefon valid.'),
    body(
        'password',
        'Va rugam folositi doar caractere si/sau numere in parola. (minim 5 caractere)'
    )
        .isLength({min: 5})
        .isAlphanumeric()
        .trim(),
    body('confirmPassword')
    .trim()
    .custom((value, {req}) => {
        if (value !== req.body.password){
            throw new Error('Parolele trebuie sa coincida.');
        }
        return true;
    })
    
],
authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/profil',eAuth, authController.getProfil);

router.post('/profil',[
    body('username')
    .isLength({min: 3})
    .withMessage('Nume utilizator trebuie sa aiba minim 3 caractere.'),
    body('numarVehicul')
    .isLength({min: 5})
    .withMessage('Numar vehicul trebuie sa aiba minim 5 caractere.'),
    body('telefon')
    .isMobilePhone()
    .withMessage('Introduceti un numar de telefon valid.')
],eAuth, authController.postProfil);

router.get('/resetarePW', authController.getResetarePW);

router.post('/resetarePW', authController.postResetarePW);

router.get('/resetarePW/:token', authController.getParolaNoua);

router.post('/parola-noua', authController.postParolaNoua);



module.exports = router;