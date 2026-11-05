module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn || !req.session.user) return res.redirect('/login');
    next();
}