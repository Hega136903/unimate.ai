"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const votingController_1 = require("../controllers/votingController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/polls/active', votingController_1.getActivePolls);
router.get('/polls/:pollId', votingController_1.getPollDetails);
router.post('/vote', votingController_1.castVote);
router.get('/polls/:pollId/results', votingController_1.getPollResults);
exports.default = router;
//# sourceMappingURL=voting.js.map