const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // TLS
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false, // Prevents Render from blocking the certificate
            family: 4 // Force IPv4
        },
        connectionTimeout: 20000, // Wait up to 20s
    });

    // 2) Define the email options
    const mailOptions = {
        from: `"Mall & Online Offers" <${process.env.EMAIL_FROM || 'noreply@dealspheree.in'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    // 3) Actually send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.email}`);
    } catch (error) {
        console.error(`Error sending email to ${options.email}:`, error);
        throw error;
    }
};

module.exports = sendEmail;
