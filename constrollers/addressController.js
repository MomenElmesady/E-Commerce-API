const {Address} = require("../models/asc2")
const handlerFactory = require("./handlerFactory")

exports.updateAddress = handlerFactory.updateOne(Address)
exports.deleteAddress = handlerFactory.deleteOne(Address)
exports.createAddress = handlerFactory.createOne(Address)
exports.getAllAddresses = handlerFactory.getAll(Address)
exports.getAddress = handlerFactory.getOne(Address)