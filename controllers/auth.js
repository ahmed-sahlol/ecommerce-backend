require('dotenv').config();

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {validationResult} = require('express-validator');
const User = require('../models/user');
const sgMail = require('@sendgrid/mail');
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-that-is-never-used', 12);
const normalizeEmail = value => {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
};

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
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login', pageTitle: 'Login', errorMessage: error.array()[0].msg
        });
    }

    User.findOne({email: email})
        .then(user => {
            const passwordHash = user ? user.password : DUMMY_PASSWORD_HASH;
            return bcrypt.compare(password, passwordHash)
                .then(doMatch => {
                    if (!user || !doMatch) {
                        req.flash('error', 'Invalid email or password');
                        return res.redirect('/login');
                    }
                    req.session.regenerate(err => {
                        if (err) return next(err);
                        req.session.isLoggedIn = true;
                        req.session.user = {
                            _id: user._id.toString(), email: user.email
                        };
                        req.session.save(err => {
                            if (err) return next(err);
                            res.redirect('/');
                        });
                    });
                });
        }).catch(next);
};

exports.postSignup = (req, res, next) => {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup', pageTitle: 'Signup', errorMessage: error.array()[0].msg
        });
    }

    User.findOne({email: email}).then(userDoc => {
        if (userDoc) {
            req.flash('error', 'Email already exists');
            res.redirect('/signup');
            return null;
        }
        return bcrypt.hash(password, 12).then(hashedPassword => {
            const user = new User({
                email: email, password: hashedPassword, cart: {
                    items: []
                }
            });
            return user.save();
        });
    }).then(user => {
        if (!user) return;
        return sgMail.send({
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: 'Signup is Done',
            html: '<h1>Welcome, you successfully signed up!</h1>'
        }).then(() => {
            console.log('Email accepted by SendGrid');
            res.redirect('/login');
        }).catch(err => {
            console.error('Signup email error:', err.response?.body || err.message);

            req.flash('error', 'Account created, but the welcome email could not be sent. You can log in.');

            res.redirect('/login');
        });
    }).catch(err => {
        if (err.code === 11000) {
            req.flash('error', 'Email already exists');
            return res.redirect('/signup');
        }
        next(err);
    });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) return next(err);
        res.redirect('/');
    });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    let successMessage = req.flash('success');
    if (message.length > 0) message = message[0]; else message = null;
    if (successMessage.length > 0) successMessage = successMessage[0]; else successMessage = null;
    res.render('auth/reset', {
        path: '/reset', pageTitle: 'Reset Password', errorMessage: message, successMessage: successMessage
    });
};

exports.postReset = (req, res, next) => {
    const email = normalizeEmail(req.body.email);
    const error = validationResult(req);

    if (!error.isEmpty()) {
        req.flash('error', error.array()[0].msg);
        return res.redirect('/reset');
    }

    crypto.randomBytes(32, (err, buffer) => {
        if (err) return next(err);
        const token = buffer.toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        User.findOne({email: email})
            .then(user => {
                if (!user) {
                    req.flash('success', 'If an account exists with this email, a reset link will be sent.');
                    return res.redirect('/reset');
                }
                user.resetToken = tokenHash;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                if (!result || res.headersSent) return;
                const baseUrl = process.env.BASE_URL;
                if (!baseUrl) throw new Error('BASE_URL is not configured');

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
                }).catch(err => {
                    console.error('Password reset email error:', err.response?.body || err.message);
                });
            })
            .then(() => {
                if (res.headersSent) return;
                req.flash('success', 'If an account exists with this email, a reset link will be sent.');
                res.redirect('/reset');
            })
            .catch(err => {
                console.error('Password reset error:', err.response?.body || err.message);
                if (res.headersSent) return;
                next(err);
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    User.findOne({
        resetToken: tokenHash, resetTokenExpiration: {$gt: Date.now()}
    }).then(user => {
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
    const newpassword = typeof req.body.password === 'string' ? req.body.password : '';
    const passwordtoken = typeof req.body.passwordToken === 'string' ? req.body.passwordToken : '';
    const userId = typeof req.body.userId === 'string' ? req.body.userId : '';
    const error = validationResult(req);
    if (!error.isEmpty()) {
        req.flash('error', error.array()[0].msg);
        return res.redirect('/reset');
    }

    if (!newpassword || !passwordtoken || !userId) {
        req.flash('error', 'Invalid or expired password reset link');
        return res.redirect('/reset');
    }
    const tokenHash = crypto
        .createHash('sha256')
        .update(passwordtoken)
        .digest('hex');
    bcrypt.hash(newpassword, 12).then(hashedPassword => {
        return User.findOneAndUpdate({
            _id: userId, resetToken: tokenHash, resetTokenExpiration: {$gt: Date.now()}
        }, {
            $set: {password: hashedPassword}, $unset: {
                resetToken: 1, resetTokenExpiration: 1
            }
        }, {
            new: false, runValidators: true
        });
    }).then(user => {
        if (!user) {
            req.flash('error', 'Invalid or expired password reset link');
            return res.redirect('/reset');
        }
        res.redirect('/login');
    })
        .catch(next);
};