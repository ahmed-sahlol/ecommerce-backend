const mongoose = require('mongoose');
const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');

exports.getProducts = (req, res, next) => {
    Product.find().then(products => {
        res.render('shop/product-list', {
            prods: products, pageTitle: 'All Products', path: '/products'
        });
    }).catch(next);
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId).then(product => {
        if (!product) return res.redirect('/');
        res.render('shop/product-detail', {
            product: product, pageTitle: product.title, path: '/products'
        });
    }).catch(next);
};

exports.getIndex = (req, res, next) => {
    Product.find().then(products => {
        res.render('shop/index', {
            prods: products, pageTitle: 'Shop', path: '/'
        });
    }).catch(next);
};

exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart', pageTitle: 'Your Cart', products: products
            });
        }).catch(next);
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId).then(product => {
        if (!product) return res.redirect('/');
        return req.user.addToCart(product);
    }).then(result => {
        if (result) res.redirect('/cart');
    }).catch(next);
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId).then(result => {
        res.redirect('/cart');
    }).catch(next);
};


exports.postOrder = async (req, res, next) => {
    let session;
    try {
        session = await mongoose.startSession();
        let invalidCart = false;
        await session.withTransaction(async () => {
            invalidCart = false;
            const user = await User.findById(req.user._id).session(session).populate('cart.items.productId');

            if (!user || user.cart.items.length === 0 || user.cart.items.some(item => !item.productId)) {
                invalidCart = true;
                return;
            }
            const products = user.cart.items.map(i => {
                return {
                    quantity: i.quantity, product: {...i.productId._doc}
                };
            });

            const order = new Order({
                user: {
                    email: user.email, userId: user._id
                }, products: products
            });

            await order.save({session});
            user.cart.items = [];
            await user.save({session});
        });

        if (invalidCart) return res.redirect('/cart');
        res.redirect('/orders');
    } catch (err) {
        next(err);
    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

exports.getOrders = (req, res, next) => {
    Order.find({'user.userId': req.user._id}).then(orders => {
        res.render('shop/orders', {path: '/orders', pageTitle: 'Your Orders', orders: orders});
    }).catch(next);
};