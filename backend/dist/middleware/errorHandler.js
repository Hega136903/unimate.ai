"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (error, req, res, next) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    logger_1.logger.error(`Error ${statusCode}: ${message}`, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        stack: error.stack,
    });
    if (error.name === 'CastError') {
        message = 'Resource not found';
        statusCode = 404;
    }
    if (error.name === 'MongoServerError' && error.code === 11000) {
        message = 'Duplicate field value entered';
        statusCode = 400;
    }
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((val) => val.message);
        message = `Invalid input data: ${errors.join(', ')}`;
        statusCode = 400;
    }
    if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token';
        statusCode = 401;
    }
    if (error.name === 'TokenExpiredError') {
        message = 'Token expired';
        statusCode = 401;
    }
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map