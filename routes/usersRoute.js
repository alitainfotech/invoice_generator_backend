const express = require("express");
const {
  signin,
  signup,
  forgotPassword,
  resetPassword,
  getProfile,
  editProfile,
} = require("../controllers/usersController");
const router = express.Router();

router.post("/login", signin);
router.post("/register", signup);
router.post("/forget-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/get-profile", getProfile);
router.post("/edit-profile", editProfile);

module.exports = router;
