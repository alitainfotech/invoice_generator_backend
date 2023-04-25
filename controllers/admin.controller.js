const moment = require("moment");
const db = require("../models");
const Users = db.users;
const Clients = db.clients;
const Invoices = db.invoices;

const {
  RESPONSE_PAYLOAD_STATUS_SUCCESS,
  NULL,
  RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR,
  RESPONSE_STATUS_CODE_OK,
  RESPONSE_PAYLOAD_STATUS_ERROR,
  RESPONSE_STATUS_CODE_INTERNAL_SERVER_ERROR,
  RESPONSE_PAYLOAD_STATUS_SET_PASSWORD,
  RESPONSE_PAYLOAD_STATUS_INVITE_SENT,
  AUTH_USER_DETAILS,
  FALSE,
} = require("../constants/global.constants");

const { ADMIN_MESSAGE } = require("../controller-messages/admin.messages");

// Retrieve all Tutorials from the database.
exports.getCountsForDashboard = async (req, res) => {
  try {
    const userCount = await Users.countDocuments();
    const clientCount = await Clients.countDocuments();
    const invoiceCount = await Invoices.countDocuments();

    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
      message: ADMIN_MESSAGE.DATA_FETCHED,
      data: { user: userCount, client: clientCount, invoice: invoiceCount },
      error: NULL,
    };
    return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
  } catch (error) {
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_ERROR,
      message: NULL,
      data: NULL,
      error: error.message,
    };
    return res
      .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
      .json(responsePayload);
  }
};

exports.getCountsOfUser = (req, res) => {
  try {
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
          e.date = moment(e.date).format("MMM DD, YYYY");
        });
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
          message: ADMIN_MESSAGE.DATA_FETCHED,
          data: results,
          error: NULL,
        };
        return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
      })
      .catch((err) => {
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_ERROR,
          message: NULL,
          data: NULL,
          error: err,
        };
        return res
          .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
          .json(responsePayload);
      });
  } catch (error) {
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_ERROR,
      message: NULL,
      data: NULL,
      error: error.message,
    };
    return res
      .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
      .json(responsePayload);
  }
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
          e.date = moment(e.date).format("MMM DD, YYYY");
          delete e.userId, delete e.mediaId;
        });
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
          message: ADMIN_MESSAGE.DATA_FETCHED,
          data: results,
          error: NULL,
        };
        return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
      })
      .catch((err) => {
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_ERROR,
          message: NULL,
          data: NULL,
          error: err,
        };
        return res
          .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
          .json(responsePayload);
      });
  } catch (error) {
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_ERROR,
      message: NULL,
      data: NULL,
      error: error.message,
    };
    return res
      .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
      .json(responsePayload);
  }
};

exports.getCountsOfInvoices = async (req, res) => {
  try {
    let allInvoices = await Invoices.find()
      .lean()
      .populate("client", "name email")
      .populate("mediaId", "access_path")
      .select({
        invoiceNumber: 1,
        client: 1,
        mediaId: 1,
        total: 1,
        createdAt: 1,
      });

    allInvoices = JSON.parse(JSON.stringify(allInvoices));

    allInvoices.forEach((e) => {
      e.clientName = e.client ? e.client.name : null;
      e.clientEmail = e.client ? e.client.email: null;
      e.access_path = e.mediaId ? e.mediaId.access_path : "";
      e.total = "₹ " + e.total;
      e.createdAt = moment(e.createdAt).format("MMM DD, YYYY");
      delete e.client, delete e.mediaId;
    });
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
      message: ADMIN_MESSAGE.DATA_FETCHED,
      data: allInvoices,
      error: NULL,
    };
    return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
  } catch (error) {
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_ERROR,
      message: NULL,
      data: NULL,
      error: error.message,
    };
    return res
      .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
      .json(responsePayload);
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
  try {
    Users.find()
      .select({ name: 1 })
      .then((data) => {
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
          message: ADMIN_MESSAGE.DATA_FETCHED,
          data: data,
          error: NULL,
        };
        return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
      })
      .catch((err) => {
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_ERROR,
          message: NULL,
          data: NULL,
          error: err,
        };
        return res
          .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
          .json(responsePayload);
      });
  } catch (error) {
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_ERROR,
      message: NULL,
      data: NULL,
      error: error.message,
    };
    return res
      .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
      .json(responsePayload);
  }
};

exports.getClientName = (req, res) => {
  try {
    Clients.find()
      .populate("userId", "name")
      .select({ name: 1 })
      .then((data) => {
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
          message: ADMIN_MESSAGE.DATA_FETCHED,
          data: data,
          error: NULL,
        };
        return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
      })
      .catch((err) => {
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_ERROR,
          message: NULL,
          data: NULL,
          error: err,
        };
        return res
          .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
          .json(responsePayload);
      });
  } catch (error) {
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_ERROR,
      message: NULL,
      data: NULL,
      error: error.message,
    };
    return res
      .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
      .json(responsePayload);
  }
};
