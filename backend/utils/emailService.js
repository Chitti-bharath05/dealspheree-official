const axios = require('axios');

const sendEmail = async (options) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.EMAIL_FROM || 'teamalloffers@gmail.com';

    // Brevo API Payload
    const data = {
        sender: { name: "DealSphere Security", email: senderEmail },
        to: [{ email: options.email }],
        subject: options.subject,
        textContent: options.message,
    };

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
