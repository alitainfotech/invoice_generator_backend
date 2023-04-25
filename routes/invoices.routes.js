const express = require("express");
const {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoice,
  getInvoicesByUser,
  sendPDF,
} = require("../controllers/invoices.controller");

const { uploadPDF } = require("../helpers/index");

const router = express.Router();

router.get("/:id", getInvoice);
router.get("/user", getInvoicesByUser);
router.post("/sendPDF", sendPDF);
router.post("/", createInvoice);
router.patch("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);

module.exports = router;
