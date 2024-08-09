const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const CartItem = require("./cartItemModel")
const Cart = sequelize.define("Cart", {
  user_id: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true
})




module.exports = Cart;
