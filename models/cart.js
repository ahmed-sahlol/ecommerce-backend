const path = require('path');
const fs = require('fs');
const root = require('../util/path');
const product = require("./product");
const p = path.join(root, 'data', 'cart.json');

module.exports = class cart {
    static addproduct(id, productprice) {
        fs.readFile(p, (err, data) => {
            let cart = {product: [], totalprice: 0};
            if (!err && data.length > 0) {
                try {
                    cart = JSON.parse(data);
                    if (!cart.product) cart.product = [];
                    if (!cart.totalprice) cart.totalprice = 0;
                } catch {
                    cart = {product: [], totalprice: 0};
                }
            }
            // find if i add in last
            // const exisitingproductIndex = cart.product.findIndex(proo => proo.id === id);
            const exisitingproductIndex = cart.product.findIndex(prod => prod.id === id);
            const exisitingproduct = cart.product[exisitingproductIndex];
            let updateproduct;
            if (exisitingproduct) {
                updateproduct = {...exisitingproduct}; // make copy
                updateproduct.qty = updateproduct.qty + 1;
                cart.product = [...cart.product]; // make copy
                cart.product[exisitingproductIndex] = updateproduct;
            } else {
                updateproduct = {id: id, qty: 1};
                cart.product = [...cart.product, updateproduct];
            }
            cart.totalprice += +productprice;
            fs.writeFile(p, JSON.stringify(cart), (err) => {
                if (err) {
                    console.log(err);
                    console.log("error at add cart");
                }
            });
        });
    };

    static deleteproduct(id, currprice) {
        fs.readFile(p, (err, data) => {
            if (err) return;
            const updatedcart = JSON.parse(data);
            const product = updatedcart.product.find(pro => pro.id === id);
            if (!product) return;
            const productQty = product.qty;
            updatedcart.totalprice -= productQty * currprice;
            const newupdatedcart = {product: [], totalprice: 0};
            newupdatedcart.product = updatedcart.product.filter(pro => pro.id !== id);
            newupdatedcart.totalprice = updatedcart.totalprice;
            fs.writeFile(p, JSON.stringify(newupdatedcart), err => {
                if (err) console.log(err);
            });
        });
    }

    static getcart(cb) {
        fs.readFile(p, (err, data) => {
            let cart = {product: [], totalprice: 0};
            if (!err && data.length > 0) {
                try {
                    cart = JSON.parse(data);
                    if (!cart.product) cart.product = [];
                    if (!cart.totalprice) cart.totalprice = 0;
                } catch {
                    cart = {product: [], totalprice: 0};
                }
            }
            cb(cart);
        });
    }
}