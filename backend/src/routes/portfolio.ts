import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  createPortfolio, 
  getPortfolio, 
  updatePortfolio, 
  deletePortfolio,
  getPublicPortfolio,
  addProject,
  updateProject,
  deleteProject,
  addSkill,
  deleteSkill,
  addAchievement,
  deleteAchievement,
  getAllPublicPortfolios
} from '../controllers/portfolioController';

const router = express.Router();

// Public portfolio routes (no auth required)
router.get('/public', getAllPublicPortfolios);
router.get('/public/:username', getPublicPortfolio);

// Portfolio CRUD routes (protected)
router.post('/', authenticateToken, createPortfolio);
router.get('/', authenticateToken, getPortfolio);
router.put('/', authenticateToken, updatePortfolio);
router.delete('/', authenticateToken, deletePortfolio);

// Project management routes (protected)
router.post('/projects', authenticateToken, addProject);
router.put('/projects/:projectId', authenticateToken, updateProject);
router.delete('/projects/:projectId', authenticateToken, deleteProject);

// Skill management routes (protected)
router.post('/skills', authenticateToken, addSkill);
router.delete('/skills/:skillId', authenticateToken, deleteSkill);

// Achievement management routes (protected)
router.post('/achievements', authenticateToken, addAchievement);
router.delete('/achievements/:achievementId', authenticateToken, deleteAchievement);

export default router;
