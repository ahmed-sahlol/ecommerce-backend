const express = require('express');
const path = require('path');
const router = express.Router();
const admincontroller = require('../controllers/admin');

router.get('/add-product', admincontroller.getAddproducts);
router.post('/add-product', admincontroller.postAddproduct);
router.get('/products', admincontroller.getproduct);
router.get('/edit-product/:productid', admincontroller.geteditproducts);
router.post('/edit-product', admincontroller.posteditproducts)
router.post('/delete-product', admincontroller.postdeleteproduct);

module.exports = router;
