// sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_NAME, // Database name
  process.env.DATABASE_USER, // Username
  process.env.DATABASE_PASSWORD, // Password
  {
    host: process.env.DATABASE_HOST, // Hostname
    dialect: 'mysql', // Database dialect
    port: process.env.DATABASE_PORT || 3306, // Port (default 3306)
  }
);

module.exports = sequelize;
