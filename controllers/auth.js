const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user');
require('dotenv').config();
const sgMail = require('@sendgrid/mail');
const {use} = require("express/lib/application");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
                req.flash('error', 'Invaild email or password');
                return res.redirect('/login');
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    res.redirect('/login');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                });
        })
        .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
        .then(userDoc => {
            if (userDoc) {
                req.flash('error', 'email is exist');
                return res.redirect('/signup');
            }
            return bcrypt.hash(password, 12).then(hashedPassword => {
                const user = new User({email: email, password: hashedPassword, cart: {items: []}});
                return user.save();
            }).then(() => {
                return sgMail.send({
                    to: email,
                    from: 'ahmedsahlol69@gmail.com',
                    subject: 'Signup is Done',
                    html: '<h1>Welcome, you successfully signed up!</h1>'
                });
            }).then(() => {
                console.log('Email accepted by SendGrid');
                return res.redirect('/login');
            }).catch(err => {
                console.error('Signup/Email error:', err.response?.body || err.message);
                if (!res.headersSent) return res.redirect('/signup');
            });
        })
        .catch(err => {
            console.error('Database error:', err);
            if (!res.headersSent) res.redirect('/signup');
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
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
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email}).then(user => {
            if (!user) {
                req.flash('error', 'No account with that email');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        }).then(result => {
            return sgMail.send({
                to: req.body.email, from: 'ahmedsahlol69@gmail.com', subject: 'Reset is Done', html: `
                    <p>Welcome, you successfully Reset Password!</p>
                    <p>click this <a href="http://localhost:3000/reset/${token}"> Link </a></p>`
            });
        }).then(result => {
            res.redirect('/');
        }).catch(err => {
            console.log(err);
        })
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}}).then(user => {
        let message = req.flash('error');
        if (message.length > 0) message = message[0]; else message = null;
        res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'new-password',
            errorMessage: message,
            userId: user._id.toString(),
            passwordToken: token
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
    const newpassword = req.body.password;
    const passwordtoken = req.body.passwordToken;
    const userId = req.body.userId;
    const csrf = req.body._csrf;
    let resetuser;
    User.findOne({_id: userId, resetToken: passwordtoken, resetTokenExpiration: {$gt: Date.now()}}).then(user => {
        resetuser = user;
        return bcrypt.hash(newpassword, 12);
    }).then(hashedpass => {
        resetuser.password = hashedpass;
        resetuser.resetToken = undefined;
        resetuser.resetTokenExpiration = undefined;
        return resetuser.save();
    }).then(result => {
        res.redirect('/login');
    }).catch(err => {
        console.log(err);
    });
};