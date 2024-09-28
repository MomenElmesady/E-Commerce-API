const appError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const result = await Model.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (result === 0) {
      return next(new appError("Error deleting! No row found with this ID", 404));
    }

    res.status(200).json({
      status: "success",
      message: 'Deleted successfully',
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    console.log("------------------------------")
    const data = await Model.findAll();

    res.status(200).json(
      data,
    );
  });

exports.getOne = Model =>
  catchAsync(async (req, res, next) => {
    const data = await Model.findByPk(req.params.id);

    if (!data) {
      return next(new appError("No row found with this ID", 404));
    }

    res.status(200).json({
      status: "success",
      data,
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const data = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data,
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const result = await Model.update(
      req.body,
      {
        where: { id: req.params.id },
      }
    );

    if (result[0] === 0) {
      return next(new appError("No row found with this ID", 404));
    }

    res.status(200).json({
      status: "success",
      message: 'Updated successfully',
    });
  });
