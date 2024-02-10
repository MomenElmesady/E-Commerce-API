const Address = require("../models/addressModel")
const catchAsync = require("../utils/catchAsync")

exports.createAddress = catchAsync(async (req, res, next) => {
  const address = await Address.create(req.body)
  res.status(200).json(address)
})

exports.getAllAddresses = catchAsync(async (req, res, next) => {
  const addresses = await Address.findAll()
  res.status(200).json(addresses)
})

exports.getAddress = catchAsync(async (req, res, next) => {
  const address = await Address.findByPk(req.params.addressId)
  res.status(200).json(address)
})

exports.deleteAddress = catchAsync(async (req, res, next) => {
  const address = await Address.destroy({
    where: {
      id: req.params.addressId
    }
  })
  res.status(200).json(address)
})

exports.updateAddress = catchAsync(async (req, res, next) => {
  const address = await Address.update(req.body, {
    where: {
      id: req.params.addressId
    }
  })
  res.status(200).json(address)
})

