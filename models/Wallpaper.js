const mongoose = require('mongoose');

const wallpaperSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true, // Utile pour supprimer l'image de Cloudinary si besoin
  },
  eloScore: {
    type: Number,
    default: 1200, // Score de base par défaut pour le système Elo
  },
  matches: {
    type: Number,
    default: 0,
  },
  wins: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('Wallpaper', wallpaperSchema);
