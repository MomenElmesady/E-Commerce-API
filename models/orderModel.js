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
  // date: {
  //   type: DataTypes.DATE,
  //   allowNull: false,
  //   // defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  // },
  user_id: {
    type: DataTypes.INTEGER
  },
  address_id: {
    type: DataTypes.INTEGER
  },
  addressInDetails: {
    type: DataTypes.STRING
},
}, {
  timestamps: true
})
