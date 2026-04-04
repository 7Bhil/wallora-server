const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { upload } = require('../config/cloudinary');
const auth = require('../middleware/auth');

// Protected route to fetch personal profile
router.get('/profile', auth, userController.getProfile);

// Protected route to update profile + avatar
router.put('/profile', auth, upload.single('avatar'), userController.updateProfile);

// Public route for user rankings
router.get('/leaderboard', userController.getUserLeaderboard);

module.exports = router;
