"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateToken, (0, auth_1.authorizeRoles)('admin'), (req, res) => {
    res.json({
        success: true,
        message: 'Get all users endpoint - coming soon',
    });
});
router.get('/:id', auth_1.authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Get user by ID endpoint - coming soon',
        userId: req.params.id,
    });
});
exports.default = router;
//# sourceMappingURL=users.js.map