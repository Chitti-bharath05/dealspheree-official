const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Offer = require('../models/Offer');
const SystemLog = require('../models/SystemLog');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validation');
const sendEmail = require('../utils/emailService');
const sendSMS = require('../utils/smsService');

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '15m', // Short-lived
    });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Long-lived
    });
};

// Login Route
router.post('/login', validateRequest('login'), async (req, res) => {
    const startTime = Date.now();
    try {
        const { email, password } = req.body;
        console.log(`[LOGIN] Attempt: ${email} at ${new Date().toISOString()}`);

        console.time(`[DB] Find User: ${email}`);
        const user = await User.findOne({ email: email.toLowerCase() });
        console.timeEnd(`[DB] Find User: ${email}`);

        if (user) {
            console.time(`[AUTH] Match Password: ${email}`);
            const isMatch = await user.matchPassword(password);
            console.timeEnd(`[AUTH] Match Password: ${email}`);

            if (isMatch) {
                const userId = user._id.toString();
                const accessToken = generateAccessToken(userId);
                const refreshToken = generateRefreshToken(userId);

                user.refreshToken = refreshToken;
                await user.save();

                console.log(`[LOGIN] Success: ${email} (Total Time: ${Date.now() - startTime}ms)`);
                return res.json({
                    success: true,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        mobileNumber: user.mobileNumber,
                        city: user.city,
                        profileImage: user.profileImage || null,
                        token: accessToken,
                        refreshToken: refreshToken
                    }
                });
            }
        }
        
        console.log(`[LOGIN] Invalid credentials: ${email} (Total Time: ${Date.now() - startTime}ms)`);
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    } catch (error) {
        console.error(`💥 [LOGIN] ERROR: ${req.body?.email} -`, error.stack);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Register Route
router.post('/register', validateRequest('register'), async (req, res) => {
    try {
        const { name, email, password, role, mobileNumber } = req.body;
        console.log(`Registration attempt for: ${email}`);

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const accessToken = jwt.sign({ temp: 'auth' }, process.env.JWT_SECRET); // Placeholder for creation

        const newUserData = {
            name,
            email: email.toLowerCase(),
            password,
            role
        };

        // Handle empty mobileNumber to avoid E11000 duplicate key error on sparse index
        if (mobileNumber && mobileNumber.trim() !== '') {
            newUserData.mobileNumber = mobileNumber.trim();
        }

        const newUser = await User.create(newUserData);
        const userId = newUser._id.toString();

        const finalAccessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        newUser.refreshToken = refreshToken;
        await newUser.save();

        // Create System Alert
        await SystemLog.create({
            type: 'info',
            title: 'New User Registered',
            message: `${newUser.name} (${newUser.role}) joined the platform.`,
            color: '#8E8E93'
        });

        console.log(`Registration successful for: ${email}`);
        return res.status(201).json({
            success: true,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                mobileNumber: newUser.mobileNumber,
                city: newUser.city,
                token: finalAccessToken,
                refreshToken: refreshToken
            }
        });
    } catch (error) {
        console.error('API Error in POST /api/auth/register:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Refresh Token Route
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token required' });
        }

        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(403).json({ success: false, message: 'Invalid refresh token' });
        }

        // Verify token
        jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return res.status(403).json({ success: false, message: 'Token expired or invalid' });
            
            const newAccessToken = generateAccessToken(user._id);
            res.json({ success: true, token: newAccessToken });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Logout Route
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
        res.json({ success: true, message: 'Logged out' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete User (Admin Only)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        await User.findByIdAndDelete(userId);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Toggle Favorite
router.post('/favorites/toggle/:offerId', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const offerId = req.params.offerId;
        const user = await User.findById(userId);
        
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isFavorite = user.favorites.includes(offerId);
        
        if (isFavorite) {
            // Remove from User favorites
            user.favorites = user.favorites.filter(id => id.toString() !== offerId.toString());
            // Update Offer: pull from likedBy and decrement likes
            await Offer.findByIdAndUpdate(offerId, {
                $pull: { likedBy: userId },
                $inc: { likes: -1 }
            });
        } else {
            // Add to User favorites
            user.favorites.push(offerId);
            // Update Offer: addToSet to likedBy and increment likes
            await Offer.findByIdAndUpdate(offerId, {
                $addToSet: { likedBy: userId },
                $inc: { likes: 1 }
            });
        }

        await user.save();
        res.json({ success: true, favorites: user.favorites });
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get My Favorites
router.get('/favorites', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'favorites',
            populate: { path: 'storeId', select: 'storeName location' }
        });
        res.json({ success: true, favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with that email' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set OTP and expire
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        console.log('\n*********************************');
        console.log('       PASSWORD RESET OTP        ');
        console.log(`EMAIL: ${user.email}`);
        console.log(`OTP:   ${otp}`);
        console.log('*********************************\n');

        const htmlMessage = `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #1a1a1a; color: #fff; border-radius: 12px; border: 1px solid rgba(245,197,24,0.2);">
            <h2 style="color: #F5C518; margin-top: 0;">&#128274; Password Reset Code</h2>
            <p style="color: #ccc;">You requested a password reset for your Dealspheree account. Use the code below:</p>
            <div style="font-size: 40px; font-weight: bold; color: #F5C518; letter-spacing: 10px; text-align: center; margin: 30px 0; padding: 20px; background: rgba(245,197,24,0.08); border-radius: 8px; border: 1px solid rgba(245,197,24,0.3);">${otp}</div>
            <p style="color: #8E8E93;">This code expires in <strong style="color:#fff;">10 minutes</strong>.</p>
            <p style="color: #8E8E93; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border-color: rgba(255,255,255,0.1); margin: 20px 0;" />
            <p style="color: #555; font-size: 11px;">Dealspheree &mdash; support@dealspheree.in</p>
          </div>
        `;

        try {
            console.log(`Attempting to send OTP email to: ${user.email}`);
            await sendEmail({
                email: user.email,
                subject: '\uD83D\uDD10 Your Dealspheree Password Reset Code',
                html: htmlMessage,
            });
            console.log(`OTP email sent successfully to: ${user.email}`);

            res.status(200).json({ success: true, message: 'OTP sent to your email' });
        } catch (err) {
            console.error(`Failed to send OTP email to ${user.email}:`, err);
            user.resetPasswordOTP = undefined;
            user.resetPasswordOTPExpire = undefined;
            await user.save();

            return res.status(500).json({ success: false, message: 'Email could not be sent: ' + err.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Forgot password via Mobile
// @route   POST /api/auth/forgotpassword/mobile
// @access  Public
router.post('/forgotpassword/mobile', async (req, res) => {
    try {
        const user = await User.findOne({ mobileNumber: req.body.mobileNumber });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with that mobile number' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set OTP and expire
        user.resetPasswordOTP = otp;
        user.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        console.log('\n*********************************');
        console.log('       PASSWORD RESET OTP (SMS)  ');
        console.log(`MOBILE: ${user.mobileNumber}`);
        console.log(`OTP:    ${otp}`);
        console.log('*********************************\n');

        const message = `Your password reset code is: ${otp}. It will expire in 10 minutes.`;

        try {
            await sendSMS({
                mobileNumber: user.mobileNumber,
                message,
            });

            res.status(200).json({ success: true, message: 'OTP sent to mobile number' });
        } catch (err) {
            console.error(err);
            user.resetPasswordOTP = undefined;
            user.resetPasswordOTPExpire = undefined;
            await user.save();

            return res.status(500).json({ success: false, message: 'SMS could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Reset password via OTP
// @route   PUT /api/auth/resetpassword
// @access  Public
router.put('/resetpassword', async (req, res) => {
    try {
        const { otp, password, email, mobileNumber } = req.body;

        let query = {
            resetPasswordOTP: otp,
            resetPasswordOTPExpire: { $gt: Date.now() },
        };

        if (email) {
            query.email = email.toLowerCase();
        } else if (mobileNumber) {
            query.mobileNumber = mobileNumber;
        } else {
            return res.status(400).json({ success: false, message: 'Please provide email or mobile number' });
        }

        const user = await User.findOne(query);

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Set new password
        user.password = password;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpire = undefined;
        user.resetPasswordToken = undefined; // Clear old token too
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Reset password via OTP (POST alias for compatibility)
// @route   POST /api/auth/resetpassword
// @access  Public
router.post('/resetpassword', async (req, res) => {
    try {
        const { otp, password, newPassword, email, mobileNumber } = req.body;
        const finalPassword = password || newPassword;

        if (!otp || !finalPassword) {
            return res.status(400).json({ success: false, message: 'OTP and new password are required' });
        }

        let query = {
            resetPasswordOTP: otp,
            resetPasswordOTPExpire: { $gt: Date.now() },
        };

        if (email) {
            query.email = email.toLowerCase();
        } else if (mobileNumber) {
            query.mobileNumber = mobileNumber;
        } else {
            return res.status(400).json({ success: false, message: 'Please provide email or mobile number' });
        }

        const user = await User.findOne(query);

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
        }

        // Set new password
        user.password = finalPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpire = undefined;
        user.resetPasswordToken = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Save Push Token (Protected)
router.post('/push-token', protect, async (req, res) => {
    try {
        const { pushToken } = req.body;
        // Allow pushToken to be null/undefined, it just means they don't have notifications enabled
        if (pushToken === undefined) {
            return res.status(400).json({ success: false, message: 'Push token field missing' });
        }

        await User.findByIdAndUpdate(req.user._id, { pushToken });
        res.json({ success: true, message: 'Push token saved' });
    } catch (error) {
        console.error('Error saving push token:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update Profile (Protected)
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone, city } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name !== undefined) user.name = name;
        if (phone !== undefined) {
             // If phone is empty, we must handle it to avoid E11000 sparse index issues
             if (phone.trim() === '') {
                 user.mobileNumber = undefined;
             } else {
                 user.mobileNumber = phone;
             }
        }
        if (city !== undefined) user.city = city;

        await user.save();
        res.json({ success: true, user });
    } catch (error) {
        console.error('Profile Update Error:', error);
        if (error.code === 11000 && error.keyPattern && error.keyPattern.mobileNumber) {
            return res.status(400).json({ success: false, message: 'This mobile number is already in use by another account.' });
        }
        res.status(500).json({ success: false, message: 'Failed to update profile. ' + error.message });
    }
});

// Change Password (Protected)
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Password updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Social Login Route
router.post('/social-login', async (req, res) => {
    try {
        const { provider, email, name, socialId, profileImage, role } = req.body;
        console.log(`Social Login attempt: ${provider} - ${email} as ${role || 'existing role'}`);

        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // If it's a new user and no role is provided, tell the frontend to ask for one
            if (!role) {
                return res.json({ 
                    success: false, 
                    requiresRole: true, 
                    message: 'Role required for new registration' 
                });
            }

            // Create new user with selected role
            user = await User.create({
                name,
                email: email.toLowerCase(),
                role: role, 
                socialProvider: provider,
                socialId: socialId,
                profileImage: profileImage,
                password: crypto.randomBytes(16).toString('hex') 
            });
            console.log(`New user created via ${provider}: ${email} (${user.role})`);
        } else {
            // Update existing user if they don't have social linked
            if (!user.socialId) {
                user.socialProvider = provider;
                user.socialId = socialId;
                if (!user.profileImage) user.profileImage = profileImage;
                // We keep the existing role for known users
                await user.save();
            }
        }

        const userId = user._id.toString();
        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                mobileNumber: user.mobileNumber,
                city: user.city,
                profileImage: user.profileImage,
                token: accessToken,
                refreshToken: refreshToken
            }
        });
    } catch (error) {
        console.error('Social Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// Update profile (Protected: any logged in user)
router.put('/profile', protect, async (req, res) => {
    try {
        const { profileImage, name, city, mobileNumber } = req.body;

        const updateFields = {};
        if (profileImage !== undefined) updateFields.profileImage = profileImage;
        if (name !== undefined) updateFields.name = name;
        if (city !== undefined) updateFields.city = city;
        if (mobileNumber !== undefined) updateFields.mobileNumber = mobileNumber;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateFields },
            { new: true, runValidators: false }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                mobileNumber: updatedUser.mobileNumber,
                city: updatedUser.city,
                profileImage: updatedUser.profileImage || null,
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
