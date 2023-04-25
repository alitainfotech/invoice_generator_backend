const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
require("dotenv").config();
require("./models");

// const baseMiddleware = require("./middlewares/baseMiddleware");

// myapi
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/auth.routes");
const clientRoutes = require("./routes/clients.routes");
const invoiceRoutes = require("./routes/invoices.routes");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// app.use(baseMiddleware);

app.use("/logo", express.static("public/assets/logo/"));
app.use("/pdf", express.static("public/assets/pdf/"));
app.use(
  "/node_modules_url",
  express.static(path.join(__dirname, "node_modules"))
);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Invoice." });
});

app.use("/admin", adminRoutes);
app.use("/users", userRoutes);
app.use("/clients", clientRoutes);
app.use("/invoices", invoiceRoutes);
// app.use('/profiles', profile)

// require("./routes/router")(app);

module.exports = app;
