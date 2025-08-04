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
const ReminderSchema = new mongoose_1.Schema({
    time: {
        type: Number,
        required: true
    },
    sent: {
        type: Boolean,
        default: false
    }
});
const RecurrencePatternSchema = new mongoose_1.Schema({
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: true
    },
    daysOfWeek: [{
            type: Number,
            min: 0,
            max: 6
        }],
    endDate: {
        type: Date
    }
});
const ScheduleSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    type: {
        type: String,
        required: true,
        enum: ['class', 'assignment', 'exam', 'study-session', 'personal', 'meeting']
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true,
        validate: {
            validator: function (endTime) {
                return endTime > this.startTime;
            },
            message: 'End time must be after start time'
        }
    },
    location: {
        type: String,
        trim: true,
        maxlength: 200
    },
    course: {
        type: String,
        trim: true,
        maxlength: 100
    },
    professor: {
        type: String,
        trim: true,
        maxlength: 100
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        required: true,
        enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'missed'],
        default: 'scheduled'
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurrencePattern: {
        type: RecurrencePatternSchema,
        required: false
    },
    reminders: {
        type: [ReminderSchema],
        default: []
    },
    attendees: [{
            type: String,
            trim: true
        }],
    notes: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    attachments: [{
            type: String
        }],
    color: {
        type: String,
        default: '#3B82F6',
        match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});
ScheduleSchema.index({ createdBy: 1, startTime: 1 });
ScheduleSchema.index({ createdBy: 1, type: 1 });
ScheduleSchema.index({ createdBy: 1, status: 1 });
ScheduleSchema.index({ startTime: 1, endTime: 1 });
ScheduleSchema.virtual('isDue').get(function () {
    const now = new Date();
    return this.type === 'assignment' && this.endTime <= now && this.status !== 'completed';
});
ScheduleSchema.virtual('timeUntilDue').get(function () {
    const now = new Date();
    return this.endTime.getTime() - now.getTime();
});
ScheduleSchema.statics.getUserSchedule = function (userId, startDate, endDate) {
    const query = { createdBy: userId };
    if (startDate && endDate) {
        query.$or = [
            {
                startTime: {
                    $gte: startDate,
                    $lte: endDate
                }
            },
            {
                endTime: {
                    $gte: startDate,
                    $lte: endDate
                }
            },
            {
                startTime: { $lte: startDate },
                endTime: { $gte: endDate }
            }
        ];
    }
    return this.find(query).sort({ startTime: 1 });
};
ScheduleSchema.statics.getUpcomingDeadlines = function (userId, hours = 24) {
    const now = new Date();
    const deadline = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    return this.find({
        createdBy: userId,
        type: { $in: ['assignment', 'exam'] },
        endTime: {
            $gte: now,
            $lte: deadline
        },
        status: { $ne: 'completed' }
    }).sort({ endTime: 1 });
};
const Schedule = mongoose_1.default.model('Schedule', ScheduleSchema);
exports.default = Schedule;
//# sourceMappingURL=Schedule.js.map