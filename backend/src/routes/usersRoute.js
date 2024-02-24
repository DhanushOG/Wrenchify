const express = require('express');
const router = express.Router();
const User = require('../model/User');
const argon2 = require('argon2');
const { body, validationResult } = require('express-validator');

// Route for user registration
router.post('/register', [
    // Validate input fields
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('mobile').notEmpty().withMessage('Mobile number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, mobile, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const hash = await argon2.hash(password);

        const newUser = new User({
            name,
            email,
            mobile,
            password: hash
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Route for user login
router.post('/login', [
    // Validate input fields
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (await argon2.verify(user.password, password)) {
            return res.status(200).json({ message: "Login successful" });
        }
        res.status(401).json({ message: "Incorrect password" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
