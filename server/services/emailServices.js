const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: "legustoteam@gmail.com",
    pass: "veyx cfjl hzzi aujr"
  }
});

module.exports = { transporter };