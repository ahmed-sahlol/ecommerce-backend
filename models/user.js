const mongodb = require('mongodb');
const getDp = require('../util/database').getDb;

class User {
    constructor(username, email, cart, id) {
        this.name = username;
        this.email = email;
        this.cart = cart;
        this._id = id;
    }

    save() {
        const db = getDp();
        return db.collection('Users').insertOne(this).then(result => {
            console.log("add new user");
        }).catch(err => {
            console.log(err);
        });
    }

    addtocart(product) {
        const cartProductIndex = this.cart.items.findIndex(cp => {
            return cp.producId.toString() === product._id.toString();
        });
        let updatedquantity = 1;
        const updatedcartItems = [...this.cart.items];

        if (cartProductIndex >= 0) {
            updatedquantity = this.cart.items[cartProductIndex].quantity + 1;
            updatedcartItems[cartProductIndex].quantity = updatedquantity;
        } else updatedcartItems.push({producId: new mongodb.ObjectId(product._id), quantity: 1});

        const updatedcart = {items: updatedcartItems};
        const db = getDp();
        return db.collection('Users').updateOne({_id: new mongodb.ObjectId(this._id)}, {$set: {cart: updatedcart}});
    }

    getCart() {
        const db = getDp();
        const productIds = this.cart.items.map(i => {
            return i.producId;
        });
        return db.collection('products').find({_id: {$in: productIds}}).toArray().then(products => {
            return products.map(p => {
                return {
                    ...p, quantity: this.cart.items.find(i => {
                        return i.producId.toString() === p._id.toString();
                    }).quantity
                };
            });
        }).catch(err => {
            console.log(err);
        });
    }

    deleteItemFromCar(productId) {
        const updatedcartitem = this.cart.items.filter(item => {
            return item.producId.toString() !== productId.toString();
        });
        const db = getDp();
        return db.collection('Users').updateOne({_id: new mongodb.ObjectId(this._id)}, {$set: {cart: {items: updatedcartitem}}});
    };

    addOrder() {
        const db = getDp();
        return this.getCart().then(products => {
            const order = {
                items: products, user: {
                    name: this.name, _id: new mongodb.ObjectId(this._id)
                }
            }
            return db.collection('orders').insertOne(order);
        }).then(result => {
            this.cart = {items: []};
            return db.collection('Users').updateOne({_id: new mongodb.ObjectId(this._id)}, {$set: {cart: {items: []}}});
        }).catch(err => {
            console.log(err);
        })
    };

    getOrdeers() {
        const db = getDp();
        return db.collection('orders').find({'user._id': new mongodb.ObjectId(this._id)}).toArray();
    }

    static findById(uId) {
        const db = getDp();
        return db.collection('Users').findOne({_id: new mongodb.ObjectId(uId)}).then(user => {
            console.log(user);
            return user;
        }).catch(err => {
            console.log(err);
        });
    }
};module.exports = User;
