const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const Product = require("./productModel")

const CartItem = sequelize.define("CartItem", {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  cart_id: {
    type: DataTypes.INTEGER
  },
  product_id: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true
})



module.exports = CartItem;
