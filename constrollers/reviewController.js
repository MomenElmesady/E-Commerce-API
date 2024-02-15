const Review = require("../models/productReviewModel")
const Product = require("../models/productModel")
const Order = require("../models/orderModel")
const OrderItem = require("../models/orderItemModel")
const OrderState = require("../models/orderStateModel")
const catchAsync = require("../utils/catchAsync")
const appError = require("../utils/appError")
const sequelize = require("../sequelize")
const handlerFactory = require("./handlerFactory")


/* other way for updating review */
// exports.updateReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findByPk(req.params.reviewId);

//   if (!review) {
//     return next(new appError("There is no review with this ID", 400));
//   }

//   if (review.user_id !== req.user) {
//     return next(new appError("This review does not belong to the user", 400));
//   }

//   if (req.body.rate) {
//     review.rate = req.body.rate;
//   }

//   if (req.body.description) {
//     review.description = req.body.description;
//   }

//   await review.save();

//   res.status(200).json({
//     status: "success",
//     data: {
//       review,
//     },
//   });
// });


exports.updateReview = catchAsync(async (req, res, next) => {
  const updateDetails = await Review.update(
    req.body,
    {
      where: { user_id: req.user, id: req.params.id },
    }
  );

  if (updateDetails[0] === 0) {
    return next(new appError("There is no review with this ID that belongs to the user", 404));
  }
  res.status(200).json({
    status: "success",
    message: 'Updated successfully',
  });
});

// exports.deleteReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findByPk(req.params.reviewId)
//   if (!review)
//     return next(new appError("there is no review with this id", 400))
//   if (review.user_id != req.user)
//     return next(new appError("this review dont belong to the user", 400))
//   // delete it 
//   await review.destroy()
//   // send response 
//   res.status(200).json({
//     status: "success",
//     message: 'Deleted successfully',
//   })
// })

exports.deleteReview = catchAsync(async (req, res, next) => {
  const x = await Review.destroy({
    where: {
      user_id: req.user, id: req.params.id,
    }
  })
  if (x == 0)
    return next(new appError("There  is no review with this id belong to this user"))

  res.status(200).json({
    status: "success",
    message: 'Deleted successfully',
  })
})

exports.checkReviewExisting = catchAsync(async (req, res, next) => {
  const checkUserReview = await Review.findOne({
    where: {
      user_id: req.user,
      product_id: req.params.productId
    }
  })
  if (checkUserReview) {
    return next(new appError("This user has already rate this product"))
  }
  next()
})

exports.checkBuying = catchAsync(async (req, res, next) => {
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
  })
  if (orderItem)
    next()
  else
    next(new appError("User dont buy this product", 403))
})

exports.addToBodyReq = catchAsync(async (req, res, next) => {
  req.body.product_id = req.params.productId,
    req.body.user_id = req.user,
    req.body.date = Date.now()
  next()
})

exports.getProductReviews = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findOne({
    where: {
      id: productId,
    },
  });
  if (!product) {
    return next(new appError("Product not found", 404))
  }
  const reviews = await Review.findAll({
    where: {
      product_id: productId
    }
  })
  res.status(200).json({
    status: "success",
    data: reviews
  })
})

exports.getAverageRating = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const product = await Product.findOne({
    where: {
      id: productId,
    },
  });
  if (!product) {
    return next(new appError("Product not found", 404))
  }
  const averageRating = await Review.findAll({
    where: {
      product_id: productId
    },
    attributes: [
      [sequelize.literal('product_id'), 'product_id'],
      [sequelize.fn("AVG", sequelize.literal("rate")), "averageRating"]],
    group: ["product_id"]
  })
  if (averageRating.length == 0) {
    return next(new appError("There is no reviews for this product", 400))
  }
  res.status(200).json({
    status: "success",
    data: averageRating
  })
})

exports.createReview = handlerFactory.createOne(Review)

exports.getReview = handlerFactory.getOne(Review)