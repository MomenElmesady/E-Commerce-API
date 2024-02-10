const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const Product = require("./productModel")
const Cart = require("./cartModel")

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


Product.hasMany(CartItem, { foreignKey: "product_id" })
CartItem.belongsTo(Product, { foreignKey: "product_id" })

module.exports = CartItem;
