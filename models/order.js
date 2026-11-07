const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderedProductSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId, ref: 'Product', required: true
    }, title: {
        type: String, required: true
    }, price: {
        type: Number, required: true, min: 0.01
    }, description: {
        type: String, required: true
    }, imageUrl: {
        type: String, required: true
    }
}, {_id: false});

const orderItemSchema = new Schema({
    product: {
        type: orderedProductSchema, required: true
    }, quantity: {
        type: Number, required: true, min: [1, 'Quantity must be at least 1'], validate: {
            validator: Number.isInteger, message: 'Quantity must be an integer.'
        }
    }
});

const orderSchema = new Schema({
    products: {
        type: [orderItemSchema], required: true, validate: {
            validator: products => products.length > 0, message: 'An order must contain at least one product.'
        }
    }, user: {
        email: {
            type: String, required: true
        }, userId: {
            type: Schema.Types.ObjectId, required: true, ref: 'User'
        }
    }
}, {
    timestamps: true
});
orderSchema.index({'user.userId': 1});
module.exports = mongoose.model('Order', orderSchema);
