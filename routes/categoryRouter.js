const express = require("express")
const router = express.Router()
const categoryController = require("../constrollers/categoryController")


router.route("/").post(categoryController.createCategory).get(categoryController.getAllCategories)

router.route("/:id").get(categoryController.getCategory)
.delete(categoryController.deleteCategory)
.patch(categoryController.updateCategory)


module.exports = router