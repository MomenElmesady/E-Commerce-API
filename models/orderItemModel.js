const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const Product = require("./productModel")

const OrderItem = sequelize.define("OrderItem", {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_cost: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  order_id: {
    type: DataTypes.INTEGER
  },
  product_id: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true
})

Product.hasMany(OrderItem, { foreignKey: "product_id" })
OrderItem.belongsTo(Product, { foreignKey: "product_id" })
module.exports = OrderItem;

