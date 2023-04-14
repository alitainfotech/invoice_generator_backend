const express = require("express");
const {
  getCountsForDashboard,
  getUserName,
  getCountsOfUser,
  getCountsOfClients,
  getCountsOfInvoices,
  getClientCountsOfUser,
} = require("../controllers/adminController");
const router = express.Router();

router.get("/getCountsForDashboard", getCountsForDashboard);

router.get("/getUserName", getUserName);
router.get("/getCountsOfUser", getCountsOfUser);
router.get("/getCountsOfClients", getCountsOfClients);
router.get("/getCountsOfInvoices", getCountsOfInvoices);
router.post("/getClientCountsOfUser", getClientCountsOfUser);

module.exports = router;
