const Review = require("../models/productReviewModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const OrderItem = require("../models/orderItemModel");
const OrderState = require("../models/orderStateModel");
const catchAsync = require("../utils/catchAsync");
const appError = require("../utils/appError");
const sequelize = require("../sequelize");
const handlerFactory = require("./handlerFactory");

exports.updateReview = catchAsync(async (req, res, next) => {
  const updateDetails = await Review.update(
    req.body,
    {
      where: { user_Id: req.user, id: req.params.id },
    }
  );

  if (updateDetails[0] === 0) {
    return next(new appError("No review found with this ID that belongs to the user", 404));
  }

  res.status(200).json({
    status: "success",
    message: 'Updated successfully',
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const deletedCount = await Review.destroy({
    where: {
      user_id: req.user,
      id: req.params.id,
    }
  });

  if (deletedCount === 0) {
    return next(new appError("No review found with this ID that belongs to the user", 404));
  }

  res.status(200).json({
    status: "success",
    message: 'Deleted successfully',
  });
});

exports.checkReviewExisting = catchAsync(async (req, res, next) => {
  const checkUserReview = await Review.findOne({
    where: {
      user_id: req.user,
      product_id: req.params.productId
    }
  });
  console.log(checkUserReview)
  if (checkUserReview) {
    return next(new appError("This user has already rated this product",400));
  }

  next();
});

exports.checkBuying = catchAsync(async (req, res, next) => {
  const orderItem = await OrderItem.findOne({
    where: {
      id: req.params.productId
    },
    include: {
      model: Order,
      where: {
        user_id: req.user
      },
      include: {
        model: OrderState,
        where: { state: 'recieved' }
      }
    }
  });

  if (orderItem) {
    next();
  } else {
    next(new appError("User hasn't bought this product", 403));
  }
});

exports.addToBodyReq = catchAsync(async (req, res, next) => {
  req.body.product_id = req.params.productId;
  req.body.user_id = req.user;
  req.body.date = Date.now();
  next();
});

exports.getProductReviews = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findOne({
    where: {
      id: productId,
    },
  });

  if (!product) {
    return next(new appError("Product not found", 404));
  }

  const reviews = await Review.findAll({
    where: {
      product_id: productId
    }
  });

  res.status(200).json({
    status: "success",
    data: reviews
  });
});

exports.getAverageRating = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findOne({
    where: {
      id: productId,
    },
  });

  if (!product) {
    return next(new appError("Product not found", 404));
  }

  const averageRating = await Review.findAll({
    where: {
      product_id: productId
    },
    attributes: [
      [sequelize.literal('product_id'), 'product_id'],
      [sequelize.fn("AVG", sequelize.literal("rate")), "averageRating"]],
    group: ["product_id"]
  });

  if (averageRating.length === 0) {
    return next(new appError("No reviews for this product", 400));
  }

  res.status(200).json({
    status: "success",
    data: averageRating
  });
});

exports.createReview = handlerFactory.createOne(Review);

exports.getReview = handlerFactory.getOne(Review);
