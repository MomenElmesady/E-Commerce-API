// sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('ecommerce', 'oraby', '01011088624@tito', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
