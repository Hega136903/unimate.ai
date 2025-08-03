"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.updateProfile = exports.getMe = exports.logout = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    return jsonwebtoken_1.default.sign({ id: userId }, secret, { expiresIn: '7d' });
};
const register = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
            return;
        }
        const { firstName, lastName, email, password, university, role, studentId, department, year } = req.body;
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            });
            return;
        }
        const user = await User_1.User.create({
            firstName,
            lastName,
            email,
            password,
            university,
            role: role || 'student',
            studentId,
            department,
            year,
        });
        const token = generateToken(user._id.toString());
        user.lastLogin = new Date();
        await user.save();
        logger_1.logger.info(`New user registered: ${email}`);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    university: user.university,
                },
                token,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration',
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
            return;
        }
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
            return;
        }
        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact support.',
            });
            return;
        }
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
            return;
        }
        const token = generateToken(user._id.toString());
        user.lastLogin = new Date();
        await user.save();
        logger_1.logger.info(`User logged in: ${email}`);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    university: user.university,
                    preferences: user.preferences,
                },
                token,
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login',
        });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        logger_1.logger.info(`User logged out: ${req.user?.email}`);
        res.status(200).json({
            success: true,
            message: 'Logout successful',
        });
    }
    catch (error) {
        logger_1.logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during logout',
        });
    }
};
exports.logout = logout;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    email: req.user.email,
                    role: req.user.role,
                    university: req.user.university,
                    studentId: req.user.studentId,
                    department: req.user.department,
                    year: req.user.year,
                    profilePicture: req.user.profilePicture,
                    preferences: req.user.preferences,
                    aiUsage: req.user.aiUsage,
                    lastLogin: req.user.lastLogin,
                    createdAt: req.user.createdAt,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching profile',
        });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }
        const allowedUpdates = ['firstName', 'lastName', 'department', 'year', 'studentId', 'preferences'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        if (!isValidOperation) {
            res.status(400).json({
                success: false,
                message: 'Invalid updates. Allowed fields: ' + allowedUpdates.join(', '),
            });
            return;
        }
        const user = await User_1.User.findById(req.user._id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        updates.forEach((update) => {
            user[update] = req.body[update];
        });
        await user.save();
        logger_1.logger.info(`Profile updated for user: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    university: user.university,
                    studentId: user.studentId,
                    department: user.department,
                    year: user.year,
                    preferences: user.preferences,
                },
            },
        });
    }
    catch (error) {
        logger_1.logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating profile',
        });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        const user = await User_1.User.findById(req.user._id).select('+password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        const isValidPassword = await user.comparePassword(currentPassword);
        if (!isValidPassword) {
            res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
            return;
        }
        user.password = newPassword;
        await user.save();
        logger_1.logger.info(`Password changed for user: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while changing password',
        });
    }
};
exports.changePassword = changePassword;
const forgotPassword = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
            return;
        }
        const { email } = req.body;
        const user = await User_1.User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found with that email',
            });
            return;
        }
        logger_1.logger.info(`Password reset requested for: ${email}`);
        res.status(200).json({
            success: true,
            message: 'Password reset email sent (feature not implemented yet)',
        });
    }
    catch (error) {
        logger_1.logger.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while processing password reset',
        });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
            return;
        }
        logger_1.logger.info('Password reset attempted');
        res.status(200).json({
            success: true,
            message: 'Password reset successful (feature not implemented yet)',
        });
    }
    catch (error) {
        logger_1.logger.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while resetting password',
        });
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=authController.js.map