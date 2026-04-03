const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['info', 'warning', 'error', 'success'],
        default: 'info' 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    timeLabel: { type: String }, // e.g. "2 MINS AGO" (optional)
    color: { type: String, default: '#8E8E93' }, // UI Color
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemLog', systemLogSchema);
