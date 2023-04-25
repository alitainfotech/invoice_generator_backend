const pdf = require("html-pdf");
const nodemailer = require("nodemailer");
const db = require("../models");
const ObjectId = db.mongoose.Types.ObjectId;
const Invoice = db.invoices;
const Media = db.medias;

const { pdfTemplate } = require("../helpers/templates/invoice");
const { emailTemplate } = require("../helpers/templates/email");

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
const { INVOICE_MESSAGE } = require("../controller-messages/invoice.messages");

//SEND PDF IN MAIL
exports.sendPDF = async (req, res) => {
  try {
    const { email, company } = req.body;
    const transporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE,
      auth: {
        user: process.env.MAIL_AUTH_USER,
        pass: process.env.MAIL_AUTH_PASSWORD,
      },
    });
    // send mail with defined transport object
    transporter.sendMail({
      from: `${
        company.businessName ? company.businessName : company.name
      } <no-reply@invoice.com>`, // sender address
      to: `${email}`, // list of receivers
      replyTo: `${company.email}`,
      subject: `Invoice from ${
        company.businessName ? company.businessName : company.name
      }`, // Subject line
      text: `Invoice from ${
        company.businessName ? company.businessName : company.name
      }`, // plain text body
      html: emailTemplate(req.body), // html body
      attachments: [
        {
          filename: "invoice.pdf",
          path: `files/invoice.pdf`,
        },
      ],
    });
    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
      message: INVOICE_MESSAGE.EMAIL_SENT,
      data: NULL,
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

exports.getInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await Invoice.findById(id)
      .lean()
      .populate("client", "name email userId")
      .populate({ path: "client", populate: { path: "userId" } })
      .populate("user", "name email");

    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
      message: INVOICE_MESSAGE.INVOICE_FOUND,
      data: invoice,
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

exports.createInvoice = async (req, res) => {
  try {
    const invoice = req.body;

    const newInvoice = new Invoice(invoice);
    await newInvoice.save();
    let invoiceDetails = await Invoice.findById(newInvoice._id)
      .lean()
      .populate("client", "name email address phone businessNo")
      .populate({ path: "client", populate: { path: "userId" } })
      .populate("user", "name email address phone");

    // invoiceDetails.user = invoiceDetails.client.userId;

    let hostUrl = req.protocol + "://" + req.headers.host,
      file_name = `${Date.now()}_invoice.pdf`,
      file_path = "public/assets/pdf/" + file_name,
      access_path = hostUrl + "/" + "pdf" + "/" + file_name;

    pdf
      .create(pdfTemplate(invoiceDetails), {})
      .toFile(`public/assets/pdf/${file_name}`, async (err) => {
        if (err) {
          res.send(Promise.reject());
        }
        const newMedia = new Media({ file_path, file_name, access_path });
        await newMedia.save();

        newInvoice.mediaId = newMedia._id;
        await newInvoice.save();

        // res.send(Promise.resolve());

        const transporter = nodemailer.createTransport({
          service: process.env.MAIL_SERVICE,
          auth: {
            user: process.env.MAIL_AUTH_USER,
            pass: process.env.MAIL_AUTH_PASSWORD,
          },
        });
        // send mail with defined transport object
        transporter.sendMail({
          from: `${process.env.MAIL_AUTH_USER} <no-reply@invoice.com>`, // sender address
          to: `${invoiceDetails.client.email}`, // list of receivers
          replyTo: `${invoiceDetails.user.email}`,
          subject: `Invoice from ${invoiceDetails.user.name}`, // Subject line
          text: `Invoice from ${invoiceDetails.user.name} of invoice No. ${newInvoice.invoiceNumber}`, // plain text body
          html: emailTemplate({
            company: invoiceDetails.client,
            email: invoiceDetails.user,
          }), // html body
          attachments: [
            {
              filename: file_name,
              path: file_path,
            },
          ],
        });

        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
          message: INVOICE_MESSAGE.INVOICE_CREATED,
          data: NULL,
          error: NULL,
        };
        return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
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

exports.updateInvoice = async (req, res) => {
  try {
    const { id: _id } = req.params;
    const invoice = req.body;

    if (!ObjectId.isValid(_id)) {
      const responsePayload = {
        status: RESPONSE_PAYLOAD_STATUS_ERROR,
        message: NULL,
        data: NULL,
        error: INVOICE_MESSAGE.USER_NOT_FOUND,
      };
      return res
        .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
        .json(responsePayload);
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      _id,
      { ...invoice, _id },
      { new: true }
    );

    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
      message: INVOICE_MESSAGE.INVOICE_UPDATED,
      data: updatedInvoice,
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

exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      const responsePayload = {
        status: RESPONSE_PAYLOAD_STATUS_ERROR,
        message: NULL,
        data: NULL,
        error: INVOICE_MESSAGE.USER_NOT_FOUND,
      };
      return res
        .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
        .json(responsePayload);
    }

    await Invoice.findByIdAndRemove(id);

    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
      message: INVOICE_MESSAGE.INVOICE_DELETED,
      data: NULL,
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

exports.getInvoicesByUser = async (req, res) => {
  const { searchQuery } = req.query;

  try {
    const invoices = await Invoice.find({ creator: searchQuery });
    // const invoices = await Invoice.find().where('creator').in(searchQuery);

    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
      message: INVOICE_MESSAGE.INVOICE_FOUND,
      data: invoices,
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
