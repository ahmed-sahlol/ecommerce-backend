const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrdersScheam = new Schema({
    products: [{
        product: {
            type: Object, required: true
        }, quantity: {
            type: Number, required: true
        }
    }], user: {
        name: {
            type: String,
            requierd: true
        }, UserId: {
            type: Schema.Types.ObjectId,
            requierd: true,
            ref: 'User'
        }
    }
});

module.exports = mongoose.model('Order', OrdersScheam);
