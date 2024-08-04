const express = require("express")
const categoryController = require("../constrollers/categoryController")
const authController = require("../constrollers/authController")
const multer = require("multer")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads")
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1]
    const fileName = `${Date.now()}-p.${ext}`
    cb(null, fileName)
  }
})

const fileFilter = (req, file, cb) => {
  const type = file.mimetype.split("/")[0]
  if (type === "image")
    return cb(null, true)
  else
    return cb(new appError("file must be an image", 400), false)
}
const upload = multer({ storage, fileFilter })

const router = express.Router()

router.route("/").post(authController.protect, authController.allowedTo("manager"),
upload.single("photo"), categoryController.addDefaultPhoto,categoryController.createCategory).get(categoryController.getAllCategories)
router.route("/:id").get(categoryController.getCategory)
.delete(categoryController.deleteCategory)
.patch(categoryController.updateCategory)


module.exports = router