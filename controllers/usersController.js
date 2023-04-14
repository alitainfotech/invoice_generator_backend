const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const SECRET = process.env.SECRET_KEY;

const { encryptedData, decryptData } = require("../helpers");
// const { sendEmailThroughNodemailer } = require("../helpers/nodemailer");

const db = require("../models");
const ObjectId = db.mongoose.Types.ObjectId;
const User = db.users;

exports.signin = async (req, res) => {
  const { email, password } = req.body; //Coming from formData

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser)
      return res.json({ statusCode: 400, message: "User doesn't exist" });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect)
      return res.json({ statusCode: 400, message: "Invalid credentials" });

    //If crednetials are valid, create a token for the user
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      SECRET,
      { expiresIn: "24h" }
    );

    //Then send the token to the client/frontend
    res.json({ statusCode: 200, result: existingUser, token });
  } catch (error) {
    res.json({ statusCode: 500, message: "Something went wrong" });
  }
};

exports.signup = async (req, res) => {
  const { email, password, firstname, lastname } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.json({ statusCode: 400, message: "User already exist" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const createdAt = new Date();
    const result = await User.create({
      email,
      password: hashedPassword,
      name: `${firstname} ${lastname}`,
      createdAt,
    });

    const token = jwt.sign({ email: result.email, id: result._id }, SECRET, {
      expiresIn: "24h",
    });

    res.json({ statusCode: 200, result, token });
  } catch (error) {
    res.json({ statusCode: 500, message: "Something went wrong" });
  }
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  // NODEMAILER TRANSPORT FOR SENDING POST NOTIFICATION VIA EMAIL
  const transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE,
    auth: {
      user: process.env.MAIL_AUTH_USER,
      pass: process.env.MAIL_AUTH_PASSWORD,
    },
  });

  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
    }
    const token = buffer.toString("hex");
    User.findOne({ email: email }).then((user) => {
      if (!user) {
        return res.json({ statusCode: 400, message: "User does not exist" });
      }
      user.resetToken = token;
      user.expireToken = new Date(new Date().getTime() + 5 * 60000);
      user
        .save()
        .then((result) => {
          transporter.sendMail({
            to: user.email,
            from: process.env.MAIL_AUTH_USER,
            subject: "Password reset request",
            html: `
                  <p>You requested for password reset from Invoicing application</p>
                  <h5>Please click this <a href="http://localhost:3000/reset-password/${token}">link</a> to reset your password</h5>
                  <p>Link not clickable?, copy and paste the following url in your address bar.</p>
                  <p>http://localhost:3000/reset-password/${token}</p>
                  <P>If this was a mistake, just ignore this email and nothing will happen.</P>
                  `,
          });
          res.json({
            statusCode: 200,
            message: "Reset link has been sent! check your email",
          });
        })
        .catch((err) =>
          res.json({ statusCode: 500, message: "Something went wrong" })
        );
    });
  });
};

exports.resetPassword = (req, res) => {
  const newPassword = req.body.password;
  const sentToken = req.body.token;
  console.log("TOKEN: ", sentToken);
  console.log("EXP DATE: ", new Date());
  User.findOne({ resetToken: sentToken, expireToken: { $gte: new Date() } })
    .then((user) => {
      if (!user) {
        return res.json({
          statusCode: 400,
          message: "Try again session expired",
        });
      }
      bcrypt.hash(newPassword, 12).then((hashedpassword) => {
        user.password = hashedpassword;
        user.resetToken = undefined;
        user.expireToken = undefined;
        user.save().then((saveduser) => {
          res.json({ statusCode: 200, message: "Password updated success!" });
        });
      });
    })
    .catch((err) => {
      res.json({ statusCode: 500, message: "Something went wrong" });
    });
};

exports.editProfile = async (req, res) => {
  let { token, name } = req.body;
  var decoded = jwt.verify(token, SECRET);

  User.findOne({ email: decoded.email })
    .then((user) => {
      if (!user) {
        return res.json({ statusCode: 400, message: "User does not exist" });
      } else {
        user.name = name;
        user
          .save()
          .then((result) =>
            res
              .status(200)
              .send({
                statusCode: 200,
                message: "Profile edited successfully.",
              })
          )
          .catch((err) => res.send({ statusCode: 400, message: err }));
      }
    })
    .catch((err) => res.send({ statusCode: 400, message: err }));
};

exports.getProfile = (req, res) => {
  try {
    let { token } = req.body;
    var decoded = jwt.verify(token, SECRET);
    User.findOne({ email: decoded.email })
      .then((user) => {
        if (!user) {
          return res.json({ statusCode: 400, message: "User does not exist" });
        } else {
          res.send({ statusCode: 200, data: user });
        }
      })
      .catch((err) => res.send({ statusCode: 500, message: err }));
  } catch (error) {
    res.send({ statusCode: 500, message: error.message });
  }
};