const {validationResult} = require('express-validator');
const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product', path: '/admin/add-product', editing: false, errorMessage: null
    });
};

exports.postAddProduct = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            errorMessage: errors.array()[0].msg,
            product: req.body
        });
    }

    const {title, imageUrl, price, description} = req.body;

    const product = new Product({title, price, description, imageUrl, userId: req.user._id});

    product.save().then(() => {
        res.redirect('/admin/products');
    }).catch(next);
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (editMode !== 'true') return res.redirect('/');
    const prodId = req.params.productId;
    Product.findOne({_id: prodId, userId: req.user._id}).then(product => {
        if (!product) return res.redirect('/');
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product', path: '/admin/edit-product', editing: true, product, errorMessage: null
        });
    }).catch(next);
};

exports.postEditProduct = (req, res, next) => {
    const {productId, title, price, imageUrl, description} = req.body;
    Product.findOne({_id: productId, userId: req.user._id}).then(product => {
        if (!product) return res.redirect('/');
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).render('admin/edit-product', {
                pageTitle: 'Edit Product', path: '/admin/edit-product', editing: true, product: {
                    _id: product._id, title, price, imageUrl, description
                }, errorMessage: errors.array()[0].msg
            });
        }

        product.title = title;
        product.price = price;
        product.imageUrl = imageUrl;
        product.description = description;
        return product.save();
    }).then(result => {
        if (result) res.redirect('/admin/products');
    }).catch(next);
};

exports.getProducts = (req, res, next) => {
    Product.find({
        userId: req.user._id
    }).then(products => {
        res.render('admin/products', {
            prods: products, pageTitle: 'Admin Products', path: '/admin/products'
        });
    }).catch(next);
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.deleteOne({_id: prodId, userId: req.user._id}).then(result => {
        if (result.deletedCount === 0) return res.redirect('/');
        res.redirect('/admin/products');
    }).catch(next);
};
