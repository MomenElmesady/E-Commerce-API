const reviewController = require("../constrollers/reviewController")
const authController = require("../constrollers/authController")
const express = require("express")

const router = express.Router({mergeParams: true})

router.get("/getAverageRating",reviewController.getAverageRating)

router.route("/:reviewId").get(reviewController.getReview)
.patch(authController.protect,reviewController.updateReview)
.delete(authController.protect,reviewController.deleteReview)

router.route("/").post(authController.protect, reviewController.checkBuying, reviewController.createReview)
.get(reviewController.getProductReviews)

module.exports = router 