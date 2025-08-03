"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.post('/deadline-alerts', notificationController_1.sendDeadlineAlerts);
router.post('/test-email', notificationController_1.testEmailService);
router.get('/history', notificationController_1.getNotificationHistory);
router.put('/preferences', notificationController_1.updateNotificationPreferences);
exports.default = router;
//# sourceMappingURL=notifications.js.map