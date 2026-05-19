const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const normalizeEmail = (email) => {
    if (typeof email !== 'string') return ''
    return email.trim().toLowerCase()
}

const sanitizeUser = (user) => {
    if (!user) return null
    const { _id, role, email, is_verified, created_at, updated_at } = user
    return { _id, role, email, is_verified, created_at, updated_at }
}

module.exports = {
    getUser: async (req, res) => {
        try {
            const userId = req.query.id || (req.user && req.user._id)
            if (!userId) {
                return res.status(400).json({ error: true, message: 'User id is required.' })
            }

            const user = await User.findById(userId).select('-password -verificationCode -__v').exec()
            if (!user) {
                return res.status(404).json({ error: true, message: 'User not found.' })
            }

            return res.status(200).json({ error: false, data: sanitizeUser(user) })
        } catch (error) {
            return res.status(500).json({ error: true, message: error.message })
        }
    },

    getUsers: async (req, res) => {
        try {
            const users = await User.find({ deleted_at: null })
                .select('-password -verificationCode -__v')
                .exec()

            return res.status(200).json({ error: false, data: users.map(sanitizeUser) })
        } catch (error) {
            return res.status(500).json({ error: true, message: error.message })
        }
    },

    createUser: async (req, res) => {
        try {
            const { role, email, password } = req.body
            const normalizedEmail = normalizeEmail(email)

            if (!role || !normalizedEmail || !password) {
                return res.status(400).json({ error: true, message: 'role, email, and password are required.' })
            }

            if (password.length < 6) {
                return res.status(400).json({ error: true, message: 'Password must be at least 6 characters long.' })
            }

            const existingUser = await User.findOne({ email: normalizedEmail }).exec()
            if (existingUser) {
                return res.status(409).json({ error: true, message: 'Email is already registered.' })
            }

            const hashedPassword = await bcrypt.hash(password, 10)
            const user = new User({
                role,
                email: normalizedEmail,
                password: hashedPassword
            })

            const savedUser = await user.save()
            return res.status(201).json({
                error: false,
                data: sanitizeUser(savedUser.toObject()),
                message: 'User created successfully.'
            })
        } catch (error) {
            return res.status(500).json({ error: true, message: error.message })
        }
    },

    signIn: async (req, res) => {
        try {
            const email = normalizeEmail(req.body.email)
            const password = req.body.password

            if (!email || !password) {
                return res.status(400).json({ error: true, message: 'Email and password are required.' })
            }

            const user = await User.findOne({ email }).exec()
            if (!user) {
                return res.status(401).json({ error: true, message: 'Incorrect email or password.' })
            }

            if (!user.is_verified) {
                return res.status(403).json({ error: true, message: 'Email is not verified.' })
            }

            const passwordMatches = await bcrypt.compare(password, user.password)
            if (!passwordMatches) {
                return res.status(401).json({ error: true, message: 'Incorrect email or password.' })
            }

            const token = jwt.sign(
                { _id: user._id, email: user.email, role: user.role },
                process.env.SECRET_KEY,
                { expiresIn: '1d' }
            )

            return res.status(200).json({
                error: false,
                data: {
                    _id: user._id,
                    role: user.role,
                    email: user.email,
                    token
                }
            })
        } catch (error) {
            return res.status(500).json({ error: true, message: error.message })
        }
    }
}
