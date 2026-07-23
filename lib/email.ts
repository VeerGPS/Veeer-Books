// Email-OTP delivery service.
// Logic & template preserved exactly from the original server/utils/services.js.

import nodemailer from "nodemailer";

export type SendOTPResult = {
  success: boolean;
  fallbackOtp?: string;
  error?: string;
};

const isProd = process.env.NODE_ENV === "production";

const hasSMTPConfig = () =>
  Boolean(
    process.env.EMAIL_HOST?.trim() &&
      process.env.EMAIL_USER?.trim() &&
      process.env.EMAIL_PASS?.trim()
  );

const createFallbackTransporter = () =>
  nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true,
  });

const createTransporter = async () => {
  console.info(
    "[EMAIL DEBUG] NODE_ENV=", process.env.NODE_ENV,
    "EMAIL_HOST=", Boolean(process.env.EMAIL_HOST),
    "EMAIL_USER=", Boolean(process.env.EMAIL_USER),
    "EMAIL_PASS=", Boolean(process.env.EMAIL_PASS)
  );

  if (!hasSMTPConfig()) {
    if (!isProd) {
      console.info("[EMAIL DEBUG] No SMTP config found, using local fallback transport.");
      return createFallbackTransporter();
    }

    throw new Error(
      "Missing email configuration: EMAIL_HOST, EMAIL_USER, and EMAIL_PASS must be set"
    );
  }

  const host = process.env.EMAIL_HOST!;
  const port = Number(process.env.EMAIL_PORT) || 465;
  const user = process.env.EMAIL_USER!;
  const pass = process.env.EMAIL_PASS!;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.verify();
  return transporter;
};

export const sendOTP = async (email: string, otp: string): Promise<SendOTPResult> => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Veeer Sukhadiya Books" <${process.env.EMAIL_USER ?? "noreply@example.com"}>`,
      to: email,
      subject: "Verify your email - Veeer Books",
      text: `Your OTP for verification is: ${otp}. It expires in 10 minutes.`,
    };

    const info = await transporter.sendMail(mailOptions);

    if (!isProd && transporter.options && "streamTransport" in transporter.options) {
      console.info("[DEV EMAIL] OTP generation succeeded:", otp);
      console.info("[DEV EMAIL] Raw message:\n", (info as any).message?.toString?.());
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[EMAIL] OTP send failed:", message);

    if (!isProd) {
      console.warn("[DEV EMAIL] Failed to send email in development. OTP:", otp, error);
      return { success: false, fallbackOtp: otp, error: message };
    }

    return { success: false, fallbackOtp: otp, error: message };
  }
};
