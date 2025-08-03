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
const PollOptionSchema = new mongoose_1.Schema({
    id: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    voteCount: {
        type: Number,
        default: 0
    }
});
const PollSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    options: {
        type: [PollOptionSchema],
        required: true,
        validate: {
            validator: function (options) {
                return options.length >= 2 && options.length <= 10;
            },
            message: 'Poll must have between 2 and 10 options'
        }
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
    isActive: {
        type: Boolean,
        default: false
    },
    isAnonymous: {
        type: Boolean,
        default: true
    },
    category: {
        type: String,
        required: true,
        enum: ['student-election', 'campus-decision', 'feedback']
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalVotes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});
PollSchema.index({ isActive: 1, category: 1 });
PollSchema.index({ startTime: 1, endTime: 1 });
PollSchema.index({ createdBy: 1 });
PollSchema.virtual('timeRemaining').get(function () {
    const now = new Date();
    const endTime = this.endTime;
    return endTime.getTime() - now.getTime();
});
PollSchema.virtual('status').get(function () {
    const now = new Date();
    if (now < this.startTime)
        return 'upcoming';
    if (now > this.endTime)
        return 'ended';
    return this.isActive ? 'active' : 'paused';
});
PollSchema.methods.canUserVote = function () {
    const now = new Date();
    return this.isActive &&
        now >= this.startTime &&
        now <= this.endTime;
};
PollSchema.statics.getActivePolls = function () {
    const now = new Date();
    return this.find({
        isActive: true,
        startTime: { $lte: now },
        endTime: { $gt: now }
    }).sort({ createdAt: -1 });
};
const Poll = mongoose_1.default.model('Poll', PollSchema);
exports.default = Poll;
//# sourceMappingURL=Poll.js.map