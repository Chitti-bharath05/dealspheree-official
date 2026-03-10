/**
 * SMS Service Utility
 * For now, this just logs the SMS to the console.
 * In a real application, you would integrate with an SMS gateway like Twilio, Vonage, etc.
 */

const sendSMS = async (options) => {
    console.log('\n--- SIMULATED SMS SENT ---');
    console.log(`TO:      ${options.mobileNumber}`);
    console.log(`MESSAGE: ${options.message}`);
    console.log('---------------------------\n');
    
    // Simulate successful sending
    return Promise.resolve({ success: true, message: 'SMS logged to console' });
};

module.exports = sendSMS;
