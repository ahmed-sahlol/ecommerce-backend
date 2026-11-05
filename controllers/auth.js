require('dotenv').config();

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {validationResult} = require('express-validator');
const User = require('../models/user');
const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) message = message[0]; else message = null;
    res.render('auth/login', {
        path: '/login', pageTitle: 'Login', errorMessage: message
    });
};


exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) message = message[0]; else message = null;
    res.render('auth/signup', {
        path: '/signup', pageTitle: 'Signup', errorMessage: message
    });
};


exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                req.flash('error', 'Invalid email or password');
                return res.redirect('/login');
            }
            return bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (!doMatch) {
                        req.flash('error', 'Invalid email or password');
                        return res.redirect('/login');
                    }

                    req.session.regenerate(err => {
                        if (err) return next(err);
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        req.session.save(err => {
                            if (err) {
                                return next(err);
                            }

                            res.redirect('/');
                        });
                    });
                });
        }).catch(next);
};


exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const error = validationResult(req);

    if (!error.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup', pageTitle: 'Signup', errorMessage: error.array()[0].msg
        });
    }

    User.findOne({email: email})
        .then(userDoc => {
            if (userDoc) {
                req.flash('error', 'Email already exists');
                return res.redirect('/signup');
            }

            return bcrypt.hash(password, 12).then(hashedPassword => {
                const user = new User({
                    email: email, password: hashedPassword, cart: {
                        items: []
                    }
                });
                return user.save();
            }).then(user => {
                return sgMail.send({
                    to: email,
                    from: process.env.SENDGRID_FROM_EMAIL,
                    subject: 'Signup is Done',
                    html: '<h1>Welcome, you successfully signed up!</h1>'
                });
            }).then(() => {
                console.log('Email accepted by SendGrid');
                res.redirect('/login');
            }).catch(err => {
                console.error('Signup email error:', err.response?.body || err.message);

                req.flash('error', 'Account created, but the welcome email could not be sent. You can log in.');

                res.redirect('/login');
            });
        }).catch(next);
};


exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) return next(err);
        res.redirect('/');
    });
};


exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) message = message[0]; else message = null;


    res.render('auth/reset', {
        path: '/reset', pageTitle: 'Reset Password', errorMessage: message
    });
};

exports.postReset = (req, res, next) => {
    const email = req.body.email;
    crypto.randomBytes(32, (err, buffer) => {
        if (err) return next(err);
        const token = buffer.toString('hex');
        User.findOne({email: email})
            .then(user => {
                if (!user) {
                    req.flash('error', 'If an account exists with this email, a reset link will be sent.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            }).then(result => {
            if (!result) return;
            const baseUrl = process.env.BASE_URL;
            if (!baseUrl) return next(new Error('BASE_URL is not configured'));
            return sgMail.send({
                to: email, from: process.env.SENDGRID_FROM_EMAIL, subject: 'Reset Password', html: `
                        <p>You requested a password reset.</p>
                        <p>
                            Click this
                            <a href="${baseUrl}/reset/${token}">
                                link
                            </a>
                            to reset your password.
                        </p>
                        <p>This link expires in one hour.</p>
                    `
            });
        }).then(result => {
            if (res.headersSent) return;
            req.flash('error', 'If an account exists with this email, a reset link will be sent.');
            res.redirect('/reset');
        }).catch(next);
    });
};


exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}}).then(user => {
        if (!user) {
            req.flash('error', 'Invalid or expired password reset link');
            return res.redirect('/reset');
        }
        let message = req.flash('error');
        if (message.length > 0) message = message[0]; else message = null;

        res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'New Password',
            errorMessage: message,
            userId: user._id.toString(),
            passwordToken: token
        });
    }).catch(next);
};


exports.postNewPassword = (req, res, next) => {
    const newpassword = req.body.password;
    const passwordtoken = req.body.passwordToken;
    const userId = req.body.userId;

    if (!newpassword) {
        req.flash('error', 'Please enter a new password');
        return res.redirect('/reset');
    }
    User.findOne({_id: userId, resetToken: passwordtoken, resetTokenExpiration: {$gt: Date.now()}}).then(user => {
        if (!user) {
            req.flash('error', 'Invalid or expired password reset link');
            return res.redirect('/reset');
        }
        return bcrypt.hash(newpassword, 12).then(hashedpass => {
            user.password = hashedpass;
            user.resetToken = undefined;
            user.resetTokenExpiration = undefined;
            return user.save();
        });
    }).then(result => {
        if (result) res.redirect('/login');
    }).catch(next);
};