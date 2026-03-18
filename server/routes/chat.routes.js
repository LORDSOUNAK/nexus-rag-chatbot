const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Chat routes
router.post('/', chatController.handleMessage);

module.exports = router;
