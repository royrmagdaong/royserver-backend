// ...existing code...
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    role: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email']
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    verificationCode: { type: String, required: false, select: false },
    is_verified: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null, index: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

module.exports = mongoose.model('User', userSchema)
// ...existing code...