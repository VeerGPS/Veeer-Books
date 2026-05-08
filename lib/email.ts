// Email-OTP delivery service.
// Logic & template preserved exactly from the original server/utils/services.js.

import nodemailer from "nodemailer";

export const sendOTP = async (email: string, otp: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Veeer Sukhadiya Books" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email - Veeer Books",
    text: `Your OTP for verification is: ${otp}. It expires in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};
