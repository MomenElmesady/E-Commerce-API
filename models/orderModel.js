const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const User = require("./userModel")
const OrderItem = require("./orderItemModel")
const OrderState = require("./orderStateModel")

const Order = sequelize.define("Order", {
  total: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  },
  user_id: {
    type: DataTypes.INTEGER
  },
  address_id: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true
})

User.hasMany(Order, { foreignKey: "user_id" })
Order.belongsTo(User, { foreignKey: "user_id" })

Order.hasMany(OrderItem,{foreignKey: "order_id"})
OrderItem.belongsTo(Order,{foreignKey: "order_id"})


Order.hasOne(OrderState, { foreignKey: "order_id" })
OrderState.belongsTo(Order, { foreignKey: "order_id" })

module.exports = Order;
