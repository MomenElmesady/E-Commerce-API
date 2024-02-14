const express = require("express")
const categoryController = require("../constrollers/categoryController")

const router = express.Router()

router.route("/").post(categoryController.createCategory).get(categoryController.getAllCategories)
router.route("/:id").get(categoryController.getCategory)
.delete(categoryController.deleteCategory)
.patch(categoryController.updateCategory)


module.exports = router