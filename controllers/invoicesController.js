const pdf = require("html-pdf");
const nodemailer = require("nodemailer");
const { fileURLToPath } = require("url");
const { dirname } = require("path");

const db = require("../models");
const ObjectId = db.mongoose.Types.ObjectId;
const Invoice = db.invoices;
const Media = db.medias;

const { pdfTemplate } = require("../helpers/templates/invoice");
const { emailTemplate } = require("../helpers/templates/email");

var options = { format: "A4" };
//SEND PDF IN MAIL
exports.sendPDF = async (req, res) => {
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
        from: `${company.businessName ? company.businessName : company.name
            } <no-reply@invoice.com>`, // sender address
        to: `${email}`, // list of receivers
        replyTo: `${company.email}`,
        subject: `Invoice from ${company.businessName ? company.businessName : company.name
            }`, // Subject line
        text: `Invoice from ${company.businessName ? company.businessName : company.name
            }`, // plain text body
        html: emailTemplate(req.body), // html body
        attachments: [
            {
                filename: "invoice.pdf",
                path: `files/invoice.pdf`,
            },
        ],
    });
    res.send({ message: "Reset link has been sent! check your email" });
};

exports.getInvoice = async (req, res) => {
    const { id } = req.params;

    try {
        const invoice = await Invoice.findById(id)
            .lean()
            .populate("client", "name email userId")
            .populate({ path: "client", populate: { path: "userId" } })
            .populate("user", "name email");

        res.status(200).json(invoice);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
};

exports.createInvoice = async (req, res) => {
    const invoice = req.body;

    const newInvoice = new Invoice(invoice);

    try {
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
                const newMedia = new Media({ file_path, file_name, access_path })
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
                    html: emailTemplate({ company: invoiceDetails.client, email: invoiceDetails.user }), // html body
                    attachments: [
                        {
                            filename: file_name,
                            path: file_path,
                        },
                    ],
                });

                console.log("email: ", invoiceDetails.client.email);

                res
                    .status(200)
                    .json({ statusCode: 200, message: "Invoice created successfully!" });
            });

    } catch (error) {
        res.status(409).json({ statusCode: 400, message: error.message });
    }
};

exports.updateInvoice = async (req, res) => {
    const { id: _id } = req.params;
    const invoice = req.body;

    if (!ObjectId.isValid(_id))
        return res.status(404).send("No invoice with that id");

    const updatedInvoice = await Invoice.findByIdAndUpdate(
        _id,
        { ...invoice, _id },
        { new: true }
    );

    res.json(updatedInvoice);
};

exports.deleteInvoice = async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id))
        return res.status(404).send("No invoice with that id");

    await Invoice.findByIdAndRemove(id);

    res.json({ message: "Invoice deleted successfully" });
};

exports.getInvoicesByUser = async (req, res) => {
    const { searchQuery } = req.query;

    try {
        const invoices = await Invoice.find({ creator: searchQuery });
        // const invoices = await Invoice.find().where('creator').in(searchQuery);

        res.status(200).json({ data: invoices });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};