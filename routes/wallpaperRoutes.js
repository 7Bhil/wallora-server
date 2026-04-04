const express = require('express');
const router = express.Router();
const wallpaperController = require('../controllers/wallpaperController');
const { upload } = require('../config/cloudinary');
const auth = require('../middleware/auth');

// Upload — authentification requise
router.post('/upload', auth, upload.single('image'), wallpaperController.uploadWallpaper);

// Battle et Vote
router.get('/battle', wallpaperController.getRandomWallpapers);
router.post('/vote', wallpaperController.voteWallpapers);

// Classement
router.get('/leaderboard', wallpaperController.getLeaderboard);

// Suppression — authentification + vérification propriétaire dans le contrôleur
router.delete('/:id', auth, wallpaperController.deleteWallpaper);

module.exports = router;
