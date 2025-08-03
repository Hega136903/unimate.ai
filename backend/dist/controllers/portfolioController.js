"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPublicPortfolios = exports.deleteAchievement = exports.addAchievement = exports.deleteSkill = exports.addSkill = exports.deleteProject = exports.updateProject = exports.addProject = exports.getPublicPortfolio = exports.deletePortfolio = exports.updatePortfolio = exports.getPortfolio = exports.createPortfolio = void 0;
const User_1 = require("../models/User");
const createPortfolio = async (req, res) => {
    try {
        const userId = req.user.id;
        const portfolioData = req.body;
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        portfolioData.createdAt = new Date();
        portfolioData.updatedAt = new Date();
        if (!portfolioData.username) {
            portfolioData.username = user.email.split('@')[0];
        }
        user.portfolio = portfolioData;
        await user.save();
        res.status(201).json({
            success: true,
            message: 'Portfolio created successfully',
            data: { portfolio: portfolioData }
        });
    }
    catch (error) {
        console.error('Create portfolio error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating portfolio',
            error: { message: error.message }
        });
    }
};
exports.createPortfolio = createPortfolio;
const getPortfolio = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.User.findById(userId).select('portfolio firstName lastName email');
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        if (!user.portfolio) {
            res.status(404).json({
                success: false,
                message: 'Portfolio not found'
            });
            return;
        }
        res.json({
            success: true,
            data: { portfolio: user.portfolio }
        });
    }
    catch (error) {
        console.error('Get portfolio error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching portfolio',
            error: { message: error.message }
        });
    }
};
exports.getPortfolio = getPortfolio;
const updatePortfolio = async (req, res) => {
    try {
        const userId = req.user.id;
        const portfolioData = req.body;
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        portfolioData.updatedAt = new Date();
        if (user.portfolio && user.portfolio.createdAt) {
            portfolioData.createdAt = user.portfolio.createdAt;
        }
        else {
            portfolioData.createdAt = new Date();
        }
        if (!portfolioData.username) {
            portfolioData.username = user.email.split('@')[0];
        }
        user.portfolio = portfolioData;
        await user.save();
        res.json({
            success: true,
            message: 'Portfolio updated successfully',
            data: { portfolio: portfolioData }
        });
    }
    catch (error) {
        console.error('Update portfolio error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating portfolio',
            error: { message: error.message }
        });
    }
};
exports.updatePortfolio = updatePortfolio;
const deletePortfolio = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        user.portfolio = undefined;
        await user.save();
        res.json({
            success: true,
            message: 'Portfolio deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete portfolio error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting portfolio',
            error: { message: error.message }
        });
    }
};
exports.deletePortfolio = deletePortfolio;
const getPublicPortfolio = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User_1.User.findOne({
            'portfolio.username': username,
            'portfolio.isPublic': true
        }).select('portfolio firstName lastName email');
        if (!user || !user.portfolio) {
            res.status(404).json({
                success: false,
                message: 'Portfolio not found or not public'
            });
            return;
        }
        res.json({
            success: true,
            data: { portfolio: user.portfolio }
        });
    }
    catch (error) {
        console.error('Get public portfolio error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching public portfolio',
            error: { message: error.message }
        });
    }
};
exports.getPublicPortfolio = getPublicPortfolio;
const addProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const projectData = req.body;
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        if (!user.portfolio) {
            res.status(404).json({
                success: false,
                message: 'Portfolio not found. Please create a portfolio first.'
            });
            return;
        }
        const newProject = {
            ...projectData,
            id: Date.now().toString(),
            createdAt: new Date()
        };
        user.portfolio.projects = user.portfolio.projects || [];
        user.portfolio.projects.push(newProject);
        user.portfolio.updatedAt = new Date();
        await user.save();
        res.status(201).json({
            success: true,
            message: 'Project added successfully',
            data: { project: newProject }
        });
    }
    catch (error) {
        console.error('Add project error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding project',
            error: { message: error.message }
        });
    }
};
exports.addProject = addProject;
const updateProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { projectId } = req.params;
        const projectData = req.body;
        const user = await User_1.User.findById(userId);
        if (!user || !user.portfolio) {
            res.status(404).json({
                success: false,
                message: 'User or portfolio not found'
            });
            return;
        }
        const projectIndex = user.portfolio.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) {
            res.status(404).json({
                success: false,
                message: 'Project not found'
            });
            return;
        }
        user.portfolio.projects[projectIndex] = {
            ...user.portfolio.projects[projectIndex],
            ...projectData
        };
        user.portfolio.updatedAt = new Date();
        await user.save();
        res.json({
            success: true,
            message: 'Project updated successfully',
            data: { project: user.portfolio.projects[projectIndex] }
        });
    }
    catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating project',
            error: { message: error.message }
        });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { projectId } = req.params;
        const user = await User_1.User.findById(userId);
        if (!user || !user.portfolio) {
            res.status(404).json({
                success: false,
                message: 'User or portfolio not found'
            });
            return;
        }
        user.portfolio.projects = user.portfolio.projects.filter(p => p.id !== projectId);
        user.portfolio.updatedAt = new Date();
        await user.save();
        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting project',
            error: { message: error.message }
        });
    }
};
exports.deleteProject = deleteProject;
const addSkill = async (req, res) => {
    try {
        const userId = req.user.id;
        const skillData = req.body;
        const user = await User_1.User.findById(userId);
        if (!user || !user.portfolio) {
            res.status(404).json({
                success: false,
                message: 'User or portfolio not found'
            });
            return;
        }
        const newSkill = {
            ...skillData,
            id: Date.now().toString()
        };
        user.portfolio.skills = user.portfolio.skills || [];
        user.portfolio.skills.push(newSkill);
        user.portfolio.updatedAt = new Date();
        await user.save();
        res.status(201).json({
            success: true,
            message: 'Skill added successfully',
            data: { skill: newSkill }
        });
    }
    catch (error) {
        console.error('Add skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding skill',
            error: { message: error.message }
        });
    }
};
exports.addSkill = addSkill;
const deleteSkill = async (req, res) => {
    try {
        const userId = req.user.id;
        const { skillId } = req.params;
        const user = await User_1.User.findById(userId);
        if (!user || !user.portfolio) {
            res.status(404).json({
                success: false,
                message: 'User or portfolio not found'
            });
            return;
        }
        user.portfolio.skills = user.portfolio.skills.filter(s => s.id !== skillId);
        user.portfolio.updatedAt = new Date();
        await user.save();
        res.json({
            success: true,
            message: 'Skill deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete skill error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting skill',
            error: { message: error.message }
        });
    }
};
exports.deleteSkill = deleteSkill;
const addAchievement = async (req, res) => {
    try {
        const userId = req.user.id;
        const achievementData = req.body;
        const user = await User_1.User.findById(userId);
        if (!user || !user.portfolio) {
            res.status(404).json({
                success: false,
                message: 'User or portfolio not found'
            });
            return;
        }
        const newAchievement = {
            ...achievementData,
            id: Date.now().toString()
        };
        user.portfolio.achievements = user.portfolio.achievements || [];
        user.portfolio.achievements.push(newAchievement);
        user.portfolio.updatedAt = new Date();
        await user.save();
        res.status(201).json({
            success: true,
            message: 'Achievement added successfully',
            data: { achievement: newAchievement }
        });
    }
    catch (error) {
        console.error('Add achievement error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding achievement',
            error: { message: error.message }
        });
    }
};
exports.addAchievement = addAchievement;
const deleteAchievement = async (req, res) => {
    try {
        const userId = req.user.id;
        const { achievementId } = req.params;
        const user = await User_1.User.findById(userId);
        if (!user || !user.portfolio) {
            res.status(404).json({
                success: false,
                message: 'User or portfolio not found'
            });
            return;
        }
        user.portfolio.achievements = user.portfolio.achievements.filter(a => a.id !== achievementId);
        user.portfolio.updatedAt = new Date();
        await user.save();
        res.json({
            success: true,
            message: 'Achievement deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete achievement error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting achievement',
            error: { message: error.message }
        });
    }
};
exports.deleteAchievement = deleteAchievement;
const getAllPublicPortfolios = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const users = await User_1.User.find({
            'portfolio.isPublic': true,
            portfolio: { $exists: true }
        })
            .select('portfolio.personalInfo.fullName portfolio.personalInfo.summary portfolio.username portfolio.personalInfo.avatar')
            .skip(skip)
            .limit(limit);
        const total = await User_1.User.countDocuments({
            'portfolio.isPublic': true,
            portfolio: { $exists: true }
        });
        res.json({
            success: true,
            data: {
                portfolios: users.map(user => ({
                    fullName: user.portfolio?.personalInfo.fullName,
                    summary: user.portfolio?.personalInfo.summary,
                    username: user.portfolio?.username,
                    avatar: user.portfolio?.personalInfo.avatar
                })),
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    }
    catch (error) {
        console.error('Get all public portfolios error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching public portfolios',
            error: { message: error.message }
        });
    }
};
exports.getAllPublicPortfolios = getAllPublicPortfolios;
//# sourceMappingURL=portfolioController.js.map