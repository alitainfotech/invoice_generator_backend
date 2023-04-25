const express = require("express");
const {
  getCountsForDashboard,
  getUserName,
  getClientName,
  getCountsOfUser,
  getCountsOfClients,
  getCountsOfInvoices,
  getClientCountsOfUser,
} = require("../controllers/admin.controller");
const router = express.Router();

router.get("/getCountsForDashboard", getCountsForDashboard);

router.get("/getUserName", getUserName);
router.get("/getClientName", getClientName);

router.get("/getCountsOfUser", getCountsOfUser);
router.get("/getCountsOfClients", getCountsOfClients);
router.get("/getCountsOfInvoices", getCountsOfInvoices);
router.post("/getClientCountsOfUser", getClientCountsOfUser);

module.exports = router;
