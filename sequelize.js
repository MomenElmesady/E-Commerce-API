// sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('mysql://root:mephRwWvmmLadxuSwuyIkdxOphRGiUry@autorack.proxy.rlwy.net:35664/railway', {
  dialect: 'mysql',
  dialectOptions: {
    // This option is to avoid deprecation warnings
    supportBigNumbers: true,
    bigNumberStrings: true,
  },
});
module.exports = sequelize;
