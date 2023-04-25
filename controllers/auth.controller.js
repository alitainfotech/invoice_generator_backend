const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

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

const { AUTH_MESSAGES } = require("../controller-messages/auth.messages");

const SECRET = process.env.SECRET_KEY;

const db = require("../models");
const User = db.users;

exports.signin = async (req, res) => {
  const { email, password } = req.body; //Coming from formData

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      const responsePayload = {
        status: RESPONSE_PAYLOAD_STATUS_ERROR,
        message: NULL,
        data: NULL,
        error: AUTH_MESSAGES.USER_NOT_FOUND,
      };
      return res
        .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
        .json(responsePayload);
    }
    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      const responsePayload = {
        status: RESPONSE_PAYLOAD_STATUS_ERROR,
        message: NULL,
        data: NULL,
        error: AUTH_MESSAGES.INVALID_CREDENTIALS,
      };
      return res
        .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
        .json(responsePayload);
    }

    //If crednetials are valid, create a token for the user
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      SECRET,
      { expiresIn: "24h" }
    );

    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
      message: AUTH_MESSAGES.LOGIN_SUCCESSFUL,
      data: { token: token, result: existingUser },
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

exports.signup = async (req, res) => {
  const { email, password, firstname, lastname } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const responsePayload = {
        status: RESPONSE_PAYLOAD_STATUS_ERROR,
        message: NULL,
        data: NULL,
        error: AUTH_MESSAGES.USER_EXISTS,
      };
      return res
        .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
        .json(responsePayload);
    }

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

    const responsePayload = {
      status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
      message: AUTH_MESSAGES.REGISTER_SUCCESSFUL,
      data: { token: token, result: result },
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

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  try {
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
          const responsePayload = {
            status: RESPONSE_PAYLOAD_STATUS_ERROR,
            message: NULL,
            data: NULL,
            error: AUTH_MESSAGES.USER_NOT_FOUND,
          };
          return res
            .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
            .json(responsePayload);
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
            const responsePayload = {
              status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
              message: AUTH_MESSAGES.EMAIL_SENT,
              data: NULL,
              error: NULL,
            };
            return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
          })
          .catch((err) => {
            const responsePayload = {
              status: RESPONSE_PAYLOAD_STATUS_ERROR,
              message: NULL,
              data: NULL,
              error: AUTH_MESSAGES.FORGOT_PASSWORD_FAILED,
            };
            return res
              .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
              .json(responsePayload);
          });
      });
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

exports.resetPassword = (req, res) => {
  try {
    const newPassword = req.body.password;
    const sentToken = req.body.token;
    User.findOne({ resetToken: sentToken, expireToken: { $gte: new Date() } })
      .then((user) => {
        if (!user) {
          const responsePayload = {
            status: RESPONSE_PAYLOAD_STATUS_ERROR,
            message: NULL,
            data: NULL,
            error: AUTH_MESSAGES.URL_EXPIRED,
          };
          return res
            .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
            .json(responsePayload);
        }
        bcrypt.hash(newPassword, 12).then((hashedpassword) => {
          user.password = hashedpassword;
          user.resetToken = undefined;
          user.expireToken = undefined;
          user.save().then((saveduser) => {
            const responsePayload = {
              status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
              message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESSFULLY,
              data: NULL,
              error: NULL,
            };
            return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
          });
        });
      })
      .catch((err) => {
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_ERROR,
          message: NULL,
          data: NULL,
          error: AUTH_MESSAGES.PASSWORD_RESET_UN_SUCCESSFULLY,
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

exports.editProfile = async (req, res) => {
  try {
    let { token, name } = req.body;
    var decoded = jwt.verify(token, SECRET);

    User.findOne({ email: decoded.email })
      .then((user) => {
        if (!user) {
          const responsePayload = {
            status: RESPONSE_PAYLOAD_STATUS_ERROR,
            message: NULL,
            data: NULL,
            error: AUTH_MESSAGES.USER_NOT_FOUND,
          };
          return res
            .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
            .json(responsePayload);
        } else {
          user.name = name;
          user
            .save()
            .then((result) => {
              const responsePayload = {
                status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
                message: AUTH_MESSAGES.EDIT_PROFILE_SUCCESSFUL,
                data: NULL,
                error: NULL,
              };
              return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
            })
            .catch((err) => {
              const responsePayload = {
                status: RESPONSE_PAYLOAD_STATUS_ERROR,
                message: NULL,
                data: NULL,
                error: AUTH_MESSAGES.EDIT_PROFILE_FAILED,
              };
              return res
                .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
                .json(responsePayload);
            });
        }
      })
      .catch((err) => {
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_ERROR,
          message: NULL,
          data: NULL,
          error: AUTH_MESSAGES.EDIT_PROFILE_FAILED,
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

exports.getProfile = (req, res) => {
  try {
    let { token } = req.body;
    var decoded = jwt.verify(token, SECRET);
    User.findOne({ email: decoded.email })
      .then((user) => {
        if (!user) {
          const responsePayload = {
            status: RESPONSE_PAYLOAD_STATUS_ERROR,
            message: NULL,
            data: NULL,
            error: AUTH_MESSAGES.USER_NOT_FOUND,
          };
          return res
            .status(RESPONSE_STATUS_CODE_AUTHORIZATION_ERROR)
            .json(responsePayload);
        } else {
          const responsePayload = {
            status: RESPONSE_PAYLOAD_STATUS_SUCCESS,
            message: AUTH_MESSAGES.GET_PROFILE_SUCCESSFUL,
            data: user,
            error: NULL,
          };
          return res.status(RESPONSE_STATUS_CODE_OK).json(responsePayload);
        }
      })
      .catch((err) => {
        const responsePayload = {
          status: RESPONSE_PAYLOAD_STATUS_ERROR,
          message: NULL,
          data: NULL,
          error: AUTH_MESSAGES.GET_PROFILE_FAILED,
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
