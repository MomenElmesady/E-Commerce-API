const express = require("express")
const router = express.Router()
const userController = require("../constrollers/userController")
const authController = require("../constrollers/authController")

router.route("/").post(userController.createUser).get(authController.protect,userController.getAllUsers)
router.route("/:userId").get(userController.getUser)
.delete().patch()

router.get("/usersIn/:addressId",userController.getUsersInAddress)
module.exports = router

