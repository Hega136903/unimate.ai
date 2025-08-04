"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const students_1 = __importDefault(require("./routes/students"));
const ai_1 = __importDefault(require("./routes/ai"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const voting_1 = __importDefault(require("./routes/voting"));
const schedule_1 = __importDefault(require("./routes/schedule"));
const portfolio_1 = __importDefault(require("./routes/portfolio"));
const admin_1 = __importDefault(require("./routes/admin"));
const seed_1 = __importDefault(require("./routes/seed"));
const notifications_1 = __importDefault(require("./routes/notifications"));
console.log('🔍 Current working directory:', process.cwd());
console.log('🔍 Looking for .env file at:', require('path').resolve('.env'));
const result = dotenv_1.default.config({ path: '.env' });
console.log('🔍 dotenv result:', result);
console.log('🔍 EMAIL_USER:', process.env.EMAIL_USER);
console.log('🔍 EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '[SET]' : '[NOT SET]');
const emailService_1 = require("./services/emailService");
emailService_1.emailService.initialize();
require("./services/scheduleEmailService");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
(0, database_1.connectDB)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15')) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
});
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use(limiter);
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(',') || ['https://unimate-ai-37d2.vercel.app'],
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/students', students_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/voting', voting_1.default);
app.use('/api/schedule', schedule_1.default);
app.use('/api/portfolio', portfolio_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/seed', seed_1.default);
app.use('/api/notifications', notifications_1.default);
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Unimate.AI Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Unimate.AI Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            users: '/api/users',
            students: '/api/students',
            ai: '/api/ai',
            analytics: '/api/analytics',
            voting: '/api/voting',
            schedule: '/api/schedule',
            portfolio: '/api/portfolio'
        }
    });
});
app.use(errorHandler_1.errorHandler);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});
app.listen(PORT, () => {
    logger_1.logger.info(`🚀 Unimate.AI Backend server running on port ${PORT}`);
    logger_1.logger.info(`📊 Health check: https://unimate-ai.onrender.com/api/health`);
    logger_1.logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map