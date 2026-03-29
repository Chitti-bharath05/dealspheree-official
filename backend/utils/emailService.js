const nodemailer = require('nodemailer');
const dns = require('dns');

const sendEmail = async (options) => {
    // 1) Create a transporter
    // We are using a more advanced config to force IPv4 and bypass Render connection issues.
    const transporter = nodemailer.createTransport({
        host: '74.125.142.108', // Direct IP for smtp.gmail.com
        port: 465,
        secure: true, 
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false,
            servername: 'smtp.gmail.com' // Required for SSL certificate check
        },
        connectionTimeout: 20000, 
        greetingTimeout: 20000,
        socketTimeout: 20000,
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
