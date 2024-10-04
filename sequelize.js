// sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('mysql://root:XAgqDjsSNXDHZIOVNpjjeHZvltsddWNE@autorack.proxy.rlwy.net:13660/railway', {
  dialect: 'mysql',
  dialectOptions: {
    // This option is to avoid deprecation warnings
    supportBigNumbers: true,
    bigNumberStrings: true,
  },
});
module.exports = sequelize;