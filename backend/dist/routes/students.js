"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const studentController_1 = require("../controllers/studentController");
const router = express_1.default.Router();
router.get('/', auth_1.authenticateToken, studentController_1.getStudentData);
router.get('/schedule', auth_1.authenticateToken, studentController_1.getStudentSchedule);
router.get('/courses', auth_1.authenticateToken, studentController_1.getStudentCourses);
exports.default = router;
//# sourceMappingURL=students.js.map