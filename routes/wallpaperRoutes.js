const express = require('express');
const router = express.Router();
const wallpaperController = require('../controllers/wallpaperController');
const { upload } = require('../config/cloudinary');

// L'upload nécessite le middleware Cloudinary (le champ s'appelle 'image' venant du front)
router.post('/upload', upload.single('image'), wallpaperController.uploadWallpaper);

// Battle et Vote
router.get('/battle', wallpaperController.getRandomWallpapers);
router.post('/vote', wallpaperController.voteWallpapers);

// Classement
router.get('/leaderboard', wallpaperController.getLeaderboard);

module.exports = router;
