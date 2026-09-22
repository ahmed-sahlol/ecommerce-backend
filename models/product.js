const getDp = require('../util/database').getDb;
const mongodb = require('mongodb');

class Product {
    constructor(title, price, imageUrl, description, id, user_id) {
        this.title = title;
        this.price = price;
        this.imageUrl = imageUrl;
        this.description = description;
        this._id = id ? new mongodb.ObjectId(id) : null;
        this.userId = user_id;
    }

    save() {
        const db = getDp();
        let dbOp;
        if (this._id) dbOp = db.collection('products').updateOne({_id: new mongodb.ObjectId(this._id)}, {$set: this});
        else dbOp = db.collection('products').insertOne(this);
        return dbOp.then(result => {
            console.log(result);
        }).catch(err => {
            console.log(err);
        });
    }

    static fetchAll() {
        const db = getDp();
        return db.collection('products').find().toArray().then(products => {
            console.log(products);
            return products;
        }).catch(err => {
            console.log(err);
        });
    }

    static getbyid(prodId) {
        const db = getDp();
        return db.collection('products').find({_id: new mongodb.ObjectId(prodId)}).next().then(product => {
            console.log(product);
            return product;
        }).catch(err => {
            console.log(err);
        });
    }

    static deletebyId(prodId) {
        const db = getDp();
        return db.collection('products').deleteOne({_id: new mongodb.ObjectId(prodId)}).then(result => {
            console.log("Removed!");
        }).catch(err => {
            console.log(err);
        });
    }
}

module.exports = Product;
