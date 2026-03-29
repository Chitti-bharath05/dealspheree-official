const nodemailer = require('nodemailer');
const dns = require('dns');

const sendEmail = async (options) => {
    // 1) Create a transporter
    // We are using a more advanced config to force IPv4 and bypass Render connection issues.
    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST || 'live.smtp.mailtrap.io',
        port: 587,
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
        },
    });

    // 2) Define the email options
    const mailOptions = {
        from: `"DealSphere Security" <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    // 3) Actually send the email
    try {
        console.log(`[EmailService] Attempting to send email to ${options.email} via IPv4...`);
        await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email sent successfully to ${options.email}`);
    } catch (error) {
        console.error(`[EmailService] SMTP error caught: ${error.code} - ${error.message}`);
        // If it still fails with ENETUNREACH, we try an alternate lookup
        if (error.code === 'ENETUNREACH') {
            console.log('[EmailService] Detected IPv6 unreachable, suggest switching to SendGrid API');
        }
        throw error;
    }
};

module.exports = sendEmail;
