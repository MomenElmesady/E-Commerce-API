const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');


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
