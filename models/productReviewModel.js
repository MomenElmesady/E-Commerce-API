const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const ProductReview = sequelize.define("ProductReview", {
  rate: {
    type: DataTypes.INTEGER,
    allowNull: false,
    min: 0,
    max: 5
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER
  },
  user_id: {
    type: DataTypes.INTEGER
  }
}, {
  timestamps: true
})


module.exports = ProductReview;
