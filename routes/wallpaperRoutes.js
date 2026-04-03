const express = require('express');
const router = express.Router();
const wallpaperController = require('../controllers/wallpaperController');
const { upload } = require('../config/cloudinary');
const auth = require('../middleware/auth');

// L'upload nécessite d'être connecté ET le middleware Cloudinary
router.post('/upload', auth, upload.single('image'), wallpaperController.uploadWallpaper);

// Battle et Vote
router.get('/battle', wallpaperController.getRandomWallpapers);
router.post('/vote', wallpaperController.voteWallpapers);

// Classement
router.get('/leaderboard', wallpaperController.getLeaderboard);

module.exports = router;
