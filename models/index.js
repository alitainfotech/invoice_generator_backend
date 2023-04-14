const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

const db = {};
db.mongoose = mongoose;
db.users = require("./usersModel")(mongoose);
db.profiles = require("./profilesModel")(mongoose);
db.clients = require("./clientsModel")(mongoose);
db.invoices = require("./invoicesModel")(mongoose);
db.medias = require("./mediaModel")(mongoose);

module.exports = db;
