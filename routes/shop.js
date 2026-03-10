const express = require('express');
const path = require('path');
const router = express.Router();
const shopcontroller = require('../controllers/shop');

router.get('/', shopcontroller.getindex);
router.get('/orders', shopcontroller.getorders);
router.get('/products/:productid', shopcontroller.getspecificprod);
router.get('/products', shopcontroller.getproducts);
router.get('/cart', shopcontroller.getcart);
router.post('/cart', shopcontroller.postcart);
router.post('/cart-delete-item', shopcontroller.deleteitem);
router.get('/checkout', shopcontroller.getcheckout);
module.exports = router;