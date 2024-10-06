const catchAsync = require("../utils/catchAsync");
const appError = require("../utils/appError");
const sequelize = require("../sequelize");
const handlerFactory = require("./handlerFactory");

// const {
//   Order,
//   OrderItem,
//   OrderState,
//   Product,
//   Review
// } = require("../models/asc2.js")

const OrderItem = require("../models/orderItemModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Review = require("../models/productReviewModel");
const User = require("../models/userModel");
const OrderState = require("../models/orderStateModel.js");

exports.updateReview = catchAsync(async (req, res, next) => {
  // Validate rate range
  if (req.body.rate && (req.body.rate < 0 || req.body.rate > 5)) {
    return next(new appError("Rate must be in range 0 and 5", 400));
  }

  // Perform the update operation
  const updateDetails = await Review.update(
    req.body,
    {
      where: { user_id: req.user, id: req.params.id }, 
      returning: true, 
      plain: true,
    }
  );

  if (updateDetails[0] === 0) {
    return next(new appError("No review found with this ID that belongs to the user", 404));
  }

  const updatedReview = await Review.findOne({ where: { id: req.params.id } });

  res.status(200).json({
    status: "success",
    message: 'Updated successfully',
    data: updatedReview, 
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
  if (checkUserReview) {
    return next(new appError("This user has already rated this product", 400));
  }

  next();
});

exports.checkBuying = catchAsync(async (req, res, next) => {
  if (req.body.rate && (req.body.rate < 0 || req.body.rate > 5)) {
    return next(new appError("Rate must be in range 0 and 5", 400));
  }
  const orderItem = await OrderItem.findOne({
    where: {
      product_id: req.params.productId
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

exports.checkUserReviewForProduct = catchAsync(async (req, res, next) => {
  const { productId, userId } = req.params;

  // Validate productId and userId
  if (!productId || !userId) {
    return next(new appError("Product ID and User ID are required", 400));
  }

  const review = await Review.findOne({
    where: {
      product_id: productId,
      user_id: userId
    }
  });

  if (review) {
    res.status(200).json({
      status: "success",
      data: {
        hasReviewed: true,
        review
      }
    });
  } else {
    res.status(200).json({
      status: "success",
      data: {
        hasReviewed: false
      }
    });
  }
});

exports.createReview = handlerFactory.createOne(Review);

exports.getReview = handlerFactory.getOne(Review);
