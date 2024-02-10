const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const OrderState = sequelize.define("OrderState", {
  state: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "inProgress"
  },
  payment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  order_id: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true
})



module.exports = OrderState;
