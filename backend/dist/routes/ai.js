"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const aiController_1 = require("../controllers/aiController");
const router = express_1.default.Router();
router.post('/ask', auth_1.authenticateToken, [
    (0, express_validator_1.body)('question').trim().notEmpty().withMessage('Question is required'),
    (0, express_validator_1.body)('context').optional().trim(),
], aiController_1.askAI);
router.post('/study-session', auth_1.authenticateToken, [
    (0, express_validator_1.body)('topic').trim().notEmpty().withMessage('Topic is required'),
    (0, express_validator_1.body)('duration').optional().isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
    (0, express_validator_1.body)('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
], aiController_1.createStudySession);
router.get('/recommendations', auth_1.authenticateToken, aiController_1.getAIRecommendations);
exports.default = router;
//# sourceMappingURL=ai.js.map