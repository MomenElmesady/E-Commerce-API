const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Payment = sequelize.define("Payment", {
  method: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
  }, 
  order_id: {
    type: DataTypes.INTEGER
  },
  user_id: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true
})




module.exports = Payment;
