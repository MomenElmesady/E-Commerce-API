const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const Category = require("./categoryModel")
const CartItem = require("./cartItemModel")
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


Category.hasMany(Product, { foreignKey: "category_id" })
Product.belongsTo(Category, { foreignKey: "category_id" })

module.exports = Product;
