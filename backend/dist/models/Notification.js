"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const NotificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['deadline_alert', 'assignment_reminder', 'exam_reminder', 'poll_alert', 'general']
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    scheduleItemId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Schedule',
        required: false
    },
    pollId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Poll',
        required: false
    },
    method: {
        type: String,
        required: true,
        enum: ['email', 'push', 'sms', 'in_app'],
        default: 'in_app'
    },
    status: {
        type: String,
        required: true,
        enum: ['sent', 'failed', 'pending', 'read', 'unread'],
        default: 'pending'
    },
    sentAt: {
        type: Date,
        required: false
    },
    readAt: {
        type: Date,
        required: false
    },
    metadata: {
        emailAddress: {
            type: String,
            trim: true
        },
        urgencyLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        reminderTime: {
            type: Number
        }
    }
}, {
    timestamps: true
});
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ status: 1, method: 1 });
NotificationSchema.virtual('isRecent').get(function () {
    const now = new Date();
    const hoursDiff = (now.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
});
NotificationSchema.statics.getUserNotifications = function (userId, limit = 50) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('scheduleItemId', 'title type endTime')
        .populate('pollId', 'title endTime');
};
NotificationSchema.statics.getUnreadCount = function (userId) {
    return this.countDocuments({
        userId,
        status: { $in: ['unread', 'sent'] }
    });
};
NotificationSchema.statics.markAsRead = function (userId, notificationIds) {
    return this.updateMany({
        _id: { $in: notificationIds },
        userId
    }, {
        status: 'read',
        readAt: new Date()
    });
};
NotificationSchema.statics.createNotification = function (data) {
    return this.create({
        ...data,
        status: data.status || 'unread'
    });
};
const Notification = mongoose_1.default.model('Notification', NotificationSchema);
exports.default = Notification;
//# sourceMappingURL=Notification.js.map