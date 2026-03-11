const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobileNumber: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['customer', 'store_owner', 'admin'], default: 'customer' },
    refreshToken: { type: String },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }],
    resetPasswordToken: { type: String }, // For email link (keeping if needed, but will use OTP mostly)
    resetPasswordOTP: { type: String },
    resetPasswordOTPExpire: { type: Date },
    pushToken: { type: String },
    city: { type: String, default: '' }
}, { timestamps: true });

// Hash password before saving to the database
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
