const dataproducts = require("../models/product");

exports.getAddproducts = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product', path: '/admin/add-product', editing: false
    });
};

exports.postAddproduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageurl;
    const price = req.body.price;
    const description = req.body.description;
    dataproducts.create({
        title: title, price: price, imageurl: imageUrl, description: description
    }).then(result => {
        console.log('Created Product');
        res.redirect('/admin/products');
    }).catch(err => {
        console.log(err);
    });
};

exports.posteditproducts = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageurl;
    const updatedDesc = req.body.description;
    dataproducts.findByPk(prodId).then(curr => {
        curr.title = updatedTitle;
        curr.price = updatedPrice;
        curr.imageUrl = updatedImageUrl;
        curr.description = updatedDesc;
        return curr.save();
    }).then(result => {
        console.log('Updated Product');
        res.redirect('/admin/products');
    }).catch(err => {
        console.log(err);
    });
}

exports.geteditproducts = (req, res, next) => {
    const editemode = req.query.edit;
    if (!editemode) return res.redirect('/');
    const prodid = req.params.productid;
    dataproducts.findByPk(prodid).then(product => {
        if (!product) return res.redirect('/');
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product', path: '/admin/edit-product', editing: editemode, product: product
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.getproduct = (req, res, next) => {
    dataproducts.findAll().then(listproduct => {
        res.render('admin/products', {
            prods: listproduct,
            pageTitle: 'admin products',
            path: '/admin/products',
            hasProducts: listproduct.length > 0,
            activeShop: true,
            productCSS: true
        });
    }).catch(err => {
        console.log(err);
    });
}

exports.postdeleteproduct = (req, res, next) => {
    const prodid = req.body.productid;
    dataproducts.findByPk(prodid).then(curr => {
        return curr.destroy();
    }).then(result => {
        console.log('Deleted Product');
        res.redirect('/admin/products');
    }).catch(err => {
        console.log(err);
    });
}
