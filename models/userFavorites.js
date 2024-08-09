const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const bcrypt = require("bcrypt")
const User = require("./userModel")
const Product = require("./productModel")
const Auth = require("../models/authModel");
const catchAsync = require('../utils/catchAsync');

const UserFavorites = sequelize.define("UserFavorites", {
  user_id: {
    type: DataTypes.INTEGER,
  },
  product_id: {
    type: DataTypes.INTEGER,
  }
}, {
  timestamps: false,
})


module.exports = UserFavorites;
