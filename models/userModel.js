const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const catchAsync = require('../utils/catchAsync');



const User = sequelize.define("User", {
  user_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  user_role: {
    type: DataTypes.ENUM("user", "trader", "manager"),
    defaultValue: 'user'
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address_id: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: false,
  
})




module.exports = User;
