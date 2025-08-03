"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const portfolioController_1 = require("../controllers/portfolioController");
const router = express_1.default.Router();
router.get('/public', portfolioController_1.getAllPublicPortfolios);
router.get('/public/:username', portfolioController_1.getPublicPortfolio);
router.post('/', auth_1.authenticateToken, portfolioController_1.createPortfolio);
router.get('/', auth_1.authenticateToken, portfolioController_1.getPortfolio);
router.put('/', auth_1.authenticateToken, portfolioController_1.updatePortfolio);
router.delete('/', auth_1.authenticateToken, portfolioController_1.deletePortfolio);
router.post('/projects', auth_1.authenticateToken, portfolioController_1.addProject);
router.put('/projects/:projectId', auth_1.authenticateToken, portfolioController_1.updateProject);
router.delete('/projects/:projectId', auth_1.authenticateToken, portfolioController_1.deleteProject);
router.post('/skills', auth_1.authenticateToken, portfolioController_1.addSkill);
router.delete('/skills/:skillId', auth_1.authenticateToken, portfolioController_1.deleteSkill);
router.post('/achievements', auth_1.authenticateToken, portfolioController_1.addAchievement);
router.delete('/achievements/:achievementId', auth_1.authenticateToken, portfolioController_1.deleteAchievement);
exports.default = router;
//# sourceMappingURL=portfolio.js.map