import nodemailer from "nodemailer";

const getTransporter = () => {
  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  ) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER || "lamadevtest@gmail.com",
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      },
    });
  }
  return null;
};

export const sendMail = async ({
  email,
  subject,
  text,
}: {
  email: string;
  subject: string;
  text: string;
}) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`[Mailer - Simulation] To: ${email} | Subject: ${subject} | Text: ${text}`);
      return;
    }
    const res = await transporter.sendMail({
      from: `"E-Commerce" <${process.env.EMAIL_USER || "lamadev@gmail.com"}>`,
      to: email,
      subject,
      text,
    });
    console.log("MESSAGE SENT:", res);
  } catch (error) {
    console.log("Failed to send email:", error);
  }
};

export default sendMail;
