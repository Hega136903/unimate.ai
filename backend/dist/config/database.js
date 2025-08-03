"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI ||
            'mongodb+srv://221501044:Sripriyan%40619@cluster0.jdhu8rq.mongodb.net/unimate-ai?retryWrites=true&w=majority&appName=Cluster0';
        console.log('🔍 Attempting to connect to MongoDB:', mongoURI.substring(0, 50) + '...');
        const conn = await mongoose_1.default.connect(mongoURI);
        logger_1.logger.info(`🍃 MongoDB Connected: ${conn.connection.host}`);
        logger_1.logger.info(`📊 Database: ${conn.connection.name}`);
    }
    catch (error) {
        logger_1.logger.warn('⚠️ MongoDB connection failed - running without database:', error);
        logger_1.logger.info('🔧 For full functionality, please install and start MongoDB');
    }
};
exports.connectDB = connectDB;
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.logger.warn('🔌 MongoDB disconnected');
});
mongoose_1.default.connection.on('error', (error) => {
    logger_1.logger.error('❌ MongoDB error:', error);
});
process.on('SIGINT', async () => {
    try {
        await mongoose_1.default.connection.close();
        logger_1.logger.info('🔌 MongoDB connection closed through app termination');
    }
    catch (error) {
        logger_1.logger.info('🔌 App termination (no database connection)');
    }
    process.exit(0);
});
//# sourceMappingURL=database.js.map