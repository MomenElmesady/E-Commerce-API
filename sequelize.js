// sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sql12733949', 'sql12733949', 'fw7dzRt19k', {
  host: 'sql12.freesqldatabase.com',
  dialect: 'mysql',
  dialectOptions: {
    // This option is to avoid deprecation warnings
    supportBigNumbers: true,
    bigNumberStrings: true,
  },
});
module.exports = sequelize;
