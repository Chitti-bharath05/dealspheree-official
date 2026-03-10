const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const testOTP = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mall-offers');
        console.log('Connected to MongoDB');

        const email = 'test_otp@example.com';
        const mobileNumber = '1234567890';
        
        // 1. Clean up
        await User.deleteMany({ email });
        console.log('Cleaned up test user');

        // 2. Register
        const user = await User.create({
            name: 'Test OTP User',
            email,
            password: 'password123',
            mobileNumber,
            role: 'customer'
        });
        console.log('Registered user with mobile number');

        // 3. Forgot Password (Mobile)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000;
        await user.save();
        console.log(`Generated OTP: ${otp}`);

        // 4. Reset Password
        const foundUser = await User.findOne({
            mobileNumber,
            resetPasswordOTP: otp,
            resetPasswordOTPExpire: { $gt: Date.now() }
        });

        if (foundUser) {
            console.log('OTP verification successful');
            foundUser.password = 'newpassword123';
            foundUser.resetPasswordOTP = undefined;
            foundUser.resetPasswordOTPExpire = undefined;
            await foundUser.save();
            console.log('Password reset successful');
        } else {
            console.error('OTP verification failed');
        }

        // 5. Verify login with new password
        const updatedUser = await User.findOne({ email });
        const isMatch = await updatedUser.matchPassword('newpassword123');
        console.log(`Login with new password: ${isMatch ? 'SUCCESS' : 'FAILED'}`);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
};

testOTP();
