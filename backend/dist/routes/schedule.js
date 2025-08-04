"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const scheduleController_1 = require("../controllers/scheduleController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', scheduleController_1.getStudentSchedule);
router.post('/items', scheduleController_1.createScheduleItem);
router.put('/items/:itemId', scheduleController_1.updateScheduleItem);
router.delete('/items/:itemId', scheduleController_1.deleteScheduleItem);
router.get('/deadlines', scheduleController_1.getUpcomingDeadlines);
router.get('/suggestions', scheduleController_1.getAISuggestions);
router.get('/analytics', scheduleController_1.getScheduleAnalytics);
exports.default = router;
//# sourceMappingURL=schedule.js.map