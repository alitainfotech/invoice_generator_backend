const db = require("../models");
const ObjectId = db.mongoose.Types.ObjectId;
const Client = db.clients;
const Media = db.medias;

const {
  RESPONSE_PAYLOAD_STATUS_ERROR,
  RESPONSE_PAYLOAD_STATUS_SUCCESS,
  RESPONSE_STATUS_CODE_INTERNAL_SERVER_ERROR,
  RESPONSE_STATUS_MESSAGE_INTERNAL_SERVER_ERROR,
  NULL,
  RESPONSE_STATUS_CODE_OK,
  STATUS_DEFAULT,
  AUTH_USER_DETAILS,
  FALSE,
  RESPONSE_STATUS_CODE_NOT_FOUND,
} = require("../constants/global.constants");
const { CLIENT_MESSAGE } = require("../controller-messages/client.messages");

exports.getClient = async (req, res) => {
  const { id } = req.params;

  try {
    const client = await Client.findById(id);
    if (client) {
      const responsePayload = {
        status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
        message: CLIENT_MESSAGE.CLIENT_FOUND,
        data: client,
        error: NULL,
      };
      return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
    } else {
      const responsePayload = {
        status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
        mmessage: CLIENT_MESSAGE.CLIENT_NOT_FOUND,
        data: NULL,
        error: NULL,
      };
      return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
    }
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

exports.getClients = async (req, res) => {
  const { page } = req.query;

  try {
    const LIMIT = 8;
    const startIndex = (Number(page) - 1) * LIMIT; // get the starting index of every page

    const total = await Client.countDocuments({});
    const clients = await Client.find()
      .sort({ _id: -1 })
      .limit(LIMIT)
      .skip(startIndex);

    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
      message: CLIENT_MESSAGE.CLIENT_FOUND,
      data: clients,
      currentPage: Number(page),
      numberOfPages: Math.ceil(total / LIMIT),
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

exports.createClient = async (req, res) => {
  try {
    // console.log(req.body.user);
    let clientDetails = await Client.find({ email: req.body.email });
    clientDetails = JSON.parse(JSON.stringify(clientDetails));
    if (clientDetails.length) {
      if (clientDetails.some((e) => e.userId == req.body.user)) {
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_ERROR,
          message: NULL,
          data: NULL,
          error: CLIENT_MESSAGE.USER_EXISTS,
        };
        return res
          .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
          .json(responsePayload);
      }
    }

    let file_path = (file_name = access_path = "");
    if (req.files && req.files.length) {
      const files = req.files;
      if (files.length) {
        let hostUrl = req.protocol + "://" + req.headers.host;
        file_path = files[0].path;
        file_name = files[0].originalname;
        access_path = hostUrl + "/" + "logo" + "/" + files[0].filename;

        // let mediaDetails = await Media.findOne({ file_name: file_name });
        // if (mediaDetails) {
        //     req.body.mediaId = mediaDetails._id
        // } else {
        const newMedia = new Media({ file_path, file_name, access_path });
        await newMedia.save();
        req.body.mediaId = newMedia._id;
        // }
        delete req.body.files;
      }

      req.body.userId = req.body.user;
      req.body = { ...req.body, createdAt: new Date().toISOString() };
      const newClient = new Client(req.body);
      await newClient.save();
      const responsePayload = {
        status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
        message: CLIENT_MESSAGE.CLIENT_CREATED,
        data: NULL,
        error: NULL,
      };
      return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
    } else {
      const responsePayload = {
        status: RESPONSE_PAYLOAD_STATUS_ERROR,
        message: NULL,
        data: NULL,
        error: CLIENT_MESSAGE.FILE_NOT_FOUND,
      };
      return res
        .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
        .json(responsePayload);
    }
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

exports.updateClient = async (req, res) => {
  const { id: _id } = req.params;
  const client = req.body;

  if (!ObjectId.isValid(_id)) {
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_ERROR,
      message: NULL,
      data: NULL,
      error: CLIENT_MESSAGE.USER_NOT_FOUND,
    };
    return res
      .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
      .json(responsePayload);
  }

  const updatedClient = await Client.findByIdAndUpdate(
    _id,
    { ...client, _id },
    { new: true }
  );
  if (updatedClient) {
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
      message: CLIENT_MESSAGE.CLIENT_UPDATED,
      data: updatedClient,
      error: NULL,
    };
    return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
  } else {
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_ERROR,
      message: NULL,
      data: NULL,
      error: CLIENT_MESSAGE.CLIENT_NOT_UPDATED,
    };
    return res
      .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
      .json(responsePayload);
  }
};

exports.deleteClient = async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_ERROR,
      message: NULL,
      data: NULL,
      error: CLIENT_MESSAGE.USER_NOT_FOUND,
    };
    return res
      .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
      .json(responsePayload);
  }

  await Client.findByIdAndRemove(id);

  const responsePayload = {
    status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
    message: CLIENT_MESSAGE.CLIENT_DELETED,
    data: NULL,
    error: NULL,
  };
  return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
};

exports.getClientsByUser = async (req, res) => {
  const { searchQuery } = req.query;

  try {
    const client = await Client.find({ userId: searchQuery });

    if (client) {
      const responsePayload = {
        status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
        message: CLIENT_MESSAGE.CLIENT_FOUND,
        data: client,
        error: NULL,
      };
      return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
    } else {
      const responsePayload = {
        status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
        mmessage: CLIENT_MESSAGE.CLIENT_NOT_FOUND,
        data: NULL,
        error: NULL,
      };
      return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
    }
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
