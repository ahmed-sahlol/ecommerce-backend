const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const Product = sequelize.define('product', {
    id: {
        type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false
    }, title: {
        type: Sequelize.STRING
    }, price: {
        type: Sequelize.DOUBLE, allowNull: false
    }, imageurl: {
        type: Sequelize.STRING, allowNull: false
    }, description: {
        type: Sequelize.STRING, allowNull: false
    }
});
module.exports = Product;