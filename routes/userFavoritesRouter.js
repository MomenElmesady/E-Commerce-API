const express = require("express")
const multer = require("multer")
const favoritesController = require("../constrollers/favoritesController")
const authController = require("../constrollers/authController")


const router = express.Router()

router.route("/").get(authController.protect, favoritesController.getUserFavorites)
router.route("/:productId").post(authController.protect ,favoritesController.addProductToFavorites)
router.route("/:productId").delete(authController.protect ,favoritesController.deleteFromFavorites)

module.exports = router