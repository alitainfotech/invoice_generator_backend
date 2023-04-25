const express = require("express");
const {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getClientsByUser,
} = require("../controllers/clients.controller");

const { uploadLogo } = require("../helpers/index");

const router = express.Router();

router.get("/", getClients);
router.get("/user", getClientsByUser);
router.post("/", uploadLogo.array("files"), createClient);
router.patch("/:id", updateClient);
router.delete("/:id", deleteClient);

module.exports = router;
