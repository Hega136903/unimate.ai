"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const analyticsController_1 = require("../controllers/analyticsController");
const router = express_1.default.Router();
router.get('/dashboard', auth_1.authenticateToken, analyticsController_1.getDashboardAnalytics);
router.get('/usage', auth_1.authenticateToken, analyticsController_1.getUsageAnalytics);
router.get('/admin', auth_1.authenticateToken, (0, auth_1.authorizeRoles)('admin'), analyticsController_1.getAdminAnalytics);
exports.default = router;
//# sourceMappingURL=analytics.js.map