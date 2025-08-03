"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
router.post('/admin', async (req, res) => {
    try {
        const existingAdmin = await User_1.User.findOne({ email: 'admin@unimate.ai' });
        if (existingAdmin) {
            res.json({
                success: true,
                message: 'Admin user already exists',
                credentials: {
                    email: 'admin@unimate.ai',
                    password: 'admin123'
                }
            });
            return;
        }
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash('admin123', saltRounds);
        const adminUser = new User_1.User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@unimate.ai',
            password: hashedPassword,
            role: 'admin',
            university: 'Unimate University',
            department: 'Administration',
            isActive: true,
            preferences: {
                notifications: true,
                darkMode: false,
                language: 'en'
            }
        });
        await adminUser.save();
        logger_1.logger.info('Admin user created successfully');
        res.status(201).json({
            success: true,
            message: 'Admin user created successfully',
            credentials: {
                email: 'admin@unimate.ai',
                password: 'admin123'
            },
            user: {
                id: adminUser._id,
                firstName: adminUser.firstName,
                lastName: adminUser.lastName,
                email: adminUser.email,
                role: adminUser.role
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating admin user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create admin user',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/admin-info', async (req, res) => {
    try {
        const adminExists = await User_1.User.findOne({ email: 'admin@unimate.ai' });
        res.json({
            success: true,
            adminExists: !!adminExists,
            credentials: {
                email: 'admin@unimate.ai',
                password: 'admin123'
            },
            instructions: [
                '1. Use the red Admin button in the header',
                '2. Or login manually with the credentials above',
                '3. Admin panel will be accessible at /admin'
            ]
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking admin user'
        });
    }
});
exports.default = router;
//# sourceMappingURL=seed.js.map