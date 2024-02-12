const Review = require("../models/productReviewModel")
const Product = require("../models/productModel")
const Order = require("../models/orderModel")
const OrderItem = require("../models/orderItemModel")
const OrderState = require("../models/orderStateModel")
const catchAsync = require("../utils/catchAsync")
const appError = require("../utils/appError")
const sequelize = require("../sequelize")

exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findByPk(req.params.reviewId)
  if (!review)
    return next(new appError("there is no review with this id", 400))
  res.status(200).json({
    status: "success",
    data: review
  })
})

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
  const [rowsUpdated, [updatedReview]] = await Review.update(
    req.body,
    {
      where: { user_id: req.user, id: req.params.reviewId },
      returning: true, // This option returns the updated records
    }
  );

  if (rowsUpdated === 0) {
    return next(new appError("There is no review with this ID that belongs to the user", 400));
  }

  res.status(200).json({
    status: "success",
    message: 'Updated successfully',
    data: {
      review: updatedReview,
    },
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
      user_id: req.user, id: req.params.reviewId,
    }
  })
  if (x == 0)
    return next(new appError("there is no review with this id belong to this user"))

  res.status(200).json({
    status: "success",
    message: 'Deleted successfully',
  })
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
    next(new appError("user dont buy this product", 400))
})
exports.createReview = catchAsync(async (req, res, next) => {
  const checkUserReview = await Review.findOne({
    where: {
      user_id: req.user,
      product_id: req.params.productId
    }
  })
  if (checkUserReview) {
    return next(new appError("This user hasalready rate this product"))
  }
  const review = await Review.create({
    product_id: req.params.productId,
    user_id: req.user,
    rate: req.body.rate,
    description: req.body.description,
    date: Date.now()
  })
  res.status(200).json({ review })
})

exports.getProductReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.findAll({
    where: {
      product_id: req.params.productId
    }
  })
  res.status(200).json({
    status: "success",
    data: reviews
  })
})

exports.getAverageRating = catchAsync(async (req, res, next) => {
  const reviews = await Review.findAll({
    where: {
      product_id: req.params.productId
    },
    attributes: [
      [sequelize.literal('product_id'), 'product_id'],
      [sequelize.fn("AVG", sequelize.literal("rate")), "ratingAverage"]],
    group: ["product_id"]
  })
  res.status(200).json({
    status: "success",
    Average: reviews
  })
})