const moment = require("moment");
const db = require("../models");
const Users = db.users;
const Clients = db.clients;
const Invoices = db.invoices;

// Retrieve all Tutorials from the database.
exports.getCountsForDashboard = async (req, res) => {
  try {
    const userCount = await Users.countDocuments();
    const clientCount = await Clients.countDocuments();
    const invoiceCount = await Invoices.countDocuments();

    res
      .status(200)
      .send({ user: userCount, client: clientCount, invoice: invoiceCount });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.getCountsOfUser = (req, res) => {
  Users.find()
    .select({
      name: 1,
      email: 1,
      date: "$createdAt",
      _id: 0,
    })
    .then((results) => {
      results = JSON.parse(JSON.stringify(results));
      results.forEach((e) => {
        e.date = moment(e.date).format("MMM DD, YYYY")
      });
      res.status(200).send({ rows: results });
    })
    .catch((err) => {
      res.status(500).send({ message: err });
    });
};

exports.getCountsOfClients = async (req, res) => {
  try {
    await Clients.find()
      .populate("userId")
      .populate("mediaId")
      .select({
        name: 1,
        email: 1,
        userId: 1,
        mediaId: 1,
        date: "$createdAt",
        _id: 0,
      })
      .then((results) => {
        results = JSON.parse(JSON.stringify(results));
        results.forEach((e) => {
          e.user = e.userId ? e.userId.email : null;
          e.access_path = e.mediaId ? e.mediaId.access_path : "";
          e.date = moment(e.date).format("MMM DD, YYYY")
          delete e.userId, delete e.mediaId;
        });
        return res.status(200).send({ rows: results });
      })
      .catch((err) => {
        res.status(500).send({ message: err });
      });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }

};

exports.getCountsOfInvoices = async (req, res) => {
  try {
    let allInvoices = await Invoices.find().lean()
      .populate("client", "name email")
      .populate("mediaId", "access_path")
      .select({
        invoiceNumber: 1,
        client: 1,
        mediaId: 1,
        total: 1,
        createdAt: 1
      });

    allInvoices = JSON.parse(JSON.stringify(allInvoices));

    allInvoices.forEach((e) => {
      e.clientName = e.client.name;
      e.clientEmail = e.client.email;
      e.access_path = e.mediaId ? e.mediaId.access_path : "";
      e.total = "₹ " + e.total;
      e.createdAt = moment(e.createdAt).format("MMM DD, YYYY")
      delete e.client, delete e.mediaId;
    })
    res.status(200).json(allInvoices);
  } catch (error) {
    res.status(409).json(error.message);
  }
};

exports.getClientCountsOfUser = (req, res) => {
  Users.findOne({ email: req.body.email })
    .then((results) => {
      Users.count({ user_id: results._id })
        // .populate("user_id")
        .then((data) => {
          res
            .status(200)
            .send({ message: "User fetched successfully!", count: data });
        })
        .catch((err) => res.status(500).send({ message: err }));
    })
    .catch((err) => res.status(500).send({ message: err }));
};

exports.getUserName = (req, res) => {
  Users.find().select({ name: 1 })
    .then((data) => {
      res.status(200).send({ message: "User fetched successfully!", data });
    })
    .catch((err) => res.status(500).send({ message: err }));
};