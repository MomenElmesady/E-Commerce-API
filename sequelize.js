// sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('ecommerce', 'root', 'Momen@@010', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
