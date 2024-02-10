const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Category = sequelize.define("Category",{
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
},{
  timestamps: true
})




module.exports = Category;
