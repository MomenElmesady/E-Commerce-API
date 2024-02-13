const express = require("express")
const router = express.Router()
const addressController = require("../constrollers/addressController")


router.route("/").post(addressController.createAddress).get(addressController.getAllAddresses)

router.route("/:id").get(addressController.getAddress)
.delete(addressController.deleteAddress)
.patch(addressController.updateAddress)


module.exports = router