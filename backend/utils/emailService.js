const axios = require('axios');

const sendEmail = async (options) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.EMAIL_FROM || 'support@dealspheree.in';

    // Brevo API Payload — supports both html and plain text
    const data = {
        sender: { name: "Dealspheree Security", email: senderEmail },
        to: [{ email: options.email }],
        subject: options.subject,
    };

    // Prefer HTML over plain text if provided
    if (options.html) {
        data.htmlContent = options.html;
    } else if (options.message) {
        data.textContent = options.message;
    }

    try {
        console.log(`[EmailService] Sending email via Brevo API to ${options.email}...`);
        
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log(`[EmailService] Success! Message ID: ${response.data.messageId}`);
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error(`[EmailService] Brevo API failure: ${errorMsg}`);
        throw new Error(`Email could not be sent: ${errorMsg}`);
    }
};

module.exports = sendEmail;
