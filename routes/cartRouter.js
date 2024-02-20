const express = require("express")
const cartController = require("../constrollers/cartController")
const authController = require("../constrollers/authController")
const router = express.Router()

router.post("/addToCart/:productId", authController.protect, cartController.addToCart)
router.post("/deleteFromCart/:cartItemId", authController.protect, cartController.deleteFromCart)
router.get("/showCart", authController.protect, cartController.showCart)
router.get("/showPrice", authController.protect, cartController.showPrice)

router.route("/:id").get(authController.protect,authController.allowedTo("manager"),cartController.getCart)
router.route("/").get(authController.protect,authController.allowedTo("manager"),cartController.getAllCarts)

module.exports = router