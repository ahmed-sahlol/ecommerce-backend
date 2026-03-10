const adminRoutes = require("../routes/admin");
const dataproducts = require("../models/product");
const cartproducts = require("../models/cart");
const product = require("../models/product");

exports.getproducts = (req, res, next) => {
    dataproducts.findAll().then(listproduct => {
        res.render('shop/product-list', {
            prods: listproduct,
            pageTitle: 'All products',
            path: '/products',
            hasProducts: listproduct.length > 0,
            activeShop: true,
            productCSS: true
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.getindex = (req, res, next) => {
    dataproducts.findAll().then(listproduct => {
        res.render('shop/index', {
            prods: listproduct,
            pageTitle: 'Shop',
            path: '/',
            hasProducts: listproduct.length > 0,
            activeShop: true,
            productCSS: true
        });
    }).catch((err) => {
        console.log(err);
    });
};

exports.getcart = (req, res, next) => {
    cartproducts.getcart(cart => {
        dataproducts.fetchall(products => {
            const cartProducts = [];
            for (const product of products) {
                const cartProductData = cart.product.find(prod => prod.id === product.id);
                if (cartProductData) cartProducts.push({productData: product, qty: cartProductData.qty});
            }
            res.render('shop/cart', {
                path: '/cart', pageTitle: 'Your Cart', products: cartProducts
            });
        });
    });
};

exports.postcart = (req, res, next) => {
    const prodid = req.body.productid;
    dataproducts.findbyid(prodid, product => {
        if (!product) return res.redirect('/');
        cartproducts.addproduct(prodid, product.price);
    });
    res.redirect('/cart');
};

exports.getspecificprod = (req, res, next) => {
    const prodid = req.params.productid;
    dataproducts.findByPk(prodid).then(curr => {
        res.render('shop/product-details', {
            pageTitle: curr.title, path: '/products', prod: curr
        });
    }).catch(err => {
        console.log(err);
    });
}

exports.getorders = (req, res, next) => {
    res.render('shop/orders', {
        path: "/shop/orders", pageTitle: 'Your cart'
    });
};

exports.getcheckout = (req, res, next) => {
    res.render('shop/checkout', {
        path: 'shop/checkout', pageTitle: 'Your checkout'
    });
}

exports.deleteitem = (req, res, next) => {
    const prodid = req.body.productId;
    dataproducts.findbyid(prodid, curr => {
        if (!curr) return res.redirect('/cart');
        cartproducts.deleteproduct(prodid, curr.price);
        return res.redirect('/cart');
    });
};