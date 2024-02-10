const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Address = sequelize.define("Address",{
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false
  }
},{
  timestamps: false
})




module.exports = Address;
