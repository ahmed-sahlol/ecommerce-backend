const express = require('express');
const {body} = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

const productValidation = [body('title').trim().notEmpty().withMessage('Title is required'), body('price').isFloat({gt: 0}).withMessage('Price must be greater than zero'), body('description').trim().notEmpty().withMessage('Description is required'), body('imageUrl').trim().isURL({
    protocols: ['http', 'https'], require_protocol: true
}).withMessage('Please enter a valid image URL')];

router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/products', isAuth, adminController.getProducts);

router.post('/add-product', isAuth, productValidation, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', isAuth, productValidation, adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;
