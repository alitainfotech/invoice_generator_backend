const multer = require("multer");
const storageLogo = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/assets/logo");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "_";
    cb(null, uniqueSuffix + file.originalname);
  },
});
const uploadLogo = multer({ storage: storageLogo });

const storagePDF = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/assets/pdf");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "_";
    cb(null, uniqueSuffix + file.originalname);
  },
});
const uploadPDF = multer({ storage: storagePDF });

module.exports = { uploadLogo, uploadPDF };
