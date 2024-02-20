const appError = require("../utils/appError")
const catchAsync = require("../utils/catchAsync")

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const result = await Model.destroy({
      where: {
        id: req.params.id
      }
    })
    if (result == 0) {
      return next(new appError("Error On Deleting! May be there is no row with this id", 404))
    }
    res.status(200).json({
      status: "success",
      message: 'Deleted successfully',
    })
  })

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    const data = await Model.findAll()
    // response 
    res.status(200).json({
      status: "success",
      data
    })
  })

exports.getOne = Model =>
  catchAsync(async (req, res, next) => {
    const data = await Model.findByPk(req.params.id)
    if (!data) {
      return next(new appError("There  is no row with this id", 404))
    }
    res.status(200).json({
      status: "success",
      data
    })
  })

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const data = await Model.create(req.body)
    res.status(201).json({
      status: "success",
      data
    })
  })

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const result = await Model.update(
      req.body,
      {
        where: { id: req.params.id },
      }
    );
    if (result[0] === 0) {
      return next(new appError("There is no row with this Id ", 404));
    }
    res.status(200).json({
      status: "success",
      message: 'Updated successfully',
    });
  })
