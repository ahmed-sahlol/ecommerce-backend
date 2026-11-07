const express = require('express');
const {check, body} = require('express-validator');
const {rateLimit} = require('express-rate-limit');
const authController = require('../controllers/auth');

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts. Please try again later.'
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many signup attempts. Please try again later.'
});

const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many password reset attempts. Please try again later.'
});

const newPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many password reset attempts. Please try again later.'
});

router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);
router.get('/reset', authController.getReset);
router.get('/reset/:token', authController.getNewPassword);


router.post('/reset', resetLimiter, [check('email')
    .isEmail()
    .withMessage('Please enter a valid email.')], authController.postReset);
router.post('/new-password', newPasswordLimiter, [body('password')
    .isLength({min: 8, max: 128})
    .withMessage('Password must be between 8 and 128 characters.')], authController.postNewPassword);
router.post('/login', loginLimiter, authController.postLogin);
router.post('/signup', signupLimiter, [check('email')
    .isEmail()
    .withMessage('Please enter a valid email.'), body('password')
    .isLength({min: 8, max: 128})
    .withMessage('Password must be between 8 and 128 characters.'), body('confirmPassword')
    .custom((value, {req}) => {
        if (value !== req.body.password) throw new Error('Passwords have to match!');
        return true;
    })], authController.postSignup);
router.post('/logout', authController.postLogout);

module.exports = router;