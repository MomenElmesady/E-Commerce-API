const Address = require("../models/addressModel")
const catchAsync = require("../utils/catchAsync")
const handlerFactory = require("./handlerFactory")



exports.updateAddress = handlerFactory.updateOne(Address)

exports.deleteAddress = handlerFactory.deleteOne(Address)

exports.createAddress = handlerFactory.createOne(Address)
exports.getAllAddresses = handlerFactory.getAll(Address)
exports.getAddress = handlerFactory.getOne(Address)