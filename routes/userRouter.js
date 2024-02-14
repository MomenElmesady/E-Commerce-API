const express = require("express")
const router = express.Router()
const userController = require("../constrollers/userController")
const authController = require("../constrollers/authController")

router.route("/").post(userController.createUser)
.get(authController.protect,userController.getAllUsers)

router.route("/:id").get(userController.getUser)
.delete(userController.deleteUser).patch()

router.get("/usersIn/:addressId",userController.getUsersInAddress)
module.exports = router

