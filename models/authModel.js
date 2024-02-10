const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');
const bcrypt = require("bcrypt")
const Auth = sequelize.define("Auth", {
  user_id: {
    type: DataTypes.INTEGER
  },
  password: {
    type: DataTypes.STRING
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false 
  },
  verificationToken: {
    type: DataTypes.STRING
  },
  refreshToken: {
    type: DataTypes.STRING
  },
  passwordResetToken: {
    type: DataTypes.STRING
  },
},{
  timestamps: true,
  hooks: {
    beforeCreate: async (auth, options) => {
      auth.password = await hashPassword(auth.password);
    },
}})

async function hashPassword(password){
  return await bcrypt.hash(password,12)
}


module.exports = Auth