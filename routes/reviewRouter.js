const reviewController = require("../constrollers/reviewController")
const authController = require("../constrollers/authController")
const express = require("express")

const router = express.Router({ mergeParams: true })

router.get("/getAverageRating", reviewController.getAverageRating)
router.get("/checkUserReview/:productId/:userId", reviewController.checkUserReviewForProduct);

router.route("/:id").get(reviewController.getReview)
  .patch(authController.protect, reviewController.updateReview)
  .delete(authController.protect, reviewController.deleteReview)

router.route("/").post(authController.protect, reviewController.checkReviewExisting,
  reviewController.checkBuying, reviewController.addToBodyReq, reviewController.createReview)
  .get(reviewController.getProductReviews)

module.exports = router 