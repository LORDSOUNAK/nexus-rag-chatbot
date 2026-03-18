const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const upload = require('../utils/multer.config');

// POST /api/upload
// The 'file' string matches the name attribute of the input field in the frontend
router.post('/', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            // Handle multer specific errors
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, uploadController.uploadFile);

module.exports = router;
