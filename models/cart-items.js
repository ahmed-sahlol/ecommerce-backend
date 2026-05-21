const Sequelize = require("sequelize");
const sequelize = require('../util/database')

const cartitem = sequelize.define('cartitem', {
    id: {
        type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
    }, quantity: {
        type: Sequelize.INTEGER
    }
});
module.exports = cartitem;