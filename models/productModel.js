const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const Category = require("./categoryModel")
const User = require("./userModel")
const UserFavorites = require("./userFavorites")


const Product = sequelize.define("Product", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  category_id: {
    type: DataTypes.INTEGER
  },
  photo: {
    type: DataTypes.STRING,
    defaultValue: "default.png"
  }
}, {
  timestamps: true
})
module.exports = Product;
