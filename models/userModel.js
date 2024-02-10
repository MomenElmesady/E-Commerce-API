const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const bcrypt = require("bcrypt")
const Cart = require("./cartModel")
const Auth = require("../models/authModel");
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
  hooks: {
    afterCreate: catchAsync(async (user, ops) => {
      await Cart.create({
        user_id: user.id
      })
    }),
    beforeDestroy: catchAsync(async (user, ops) => {
      await Cart.destroy({
        where: {
          user_id: user.id
        }
      })
    })
  }
})
User.hasOne(Cart, { foreignKey: "user_id" })
Cart.belongsTo(User, { foreignKey: "user_id" })

User.hasOne(Auth, { foreignKey: "user_id" })
Auth.belongsTo(User, { foreignKey: "user_id" })

module.exports = User;
