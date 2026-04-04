const Wallpaper = require('../models/Wallpaper');
const User = require('../models/User');

// Upload (Ajouter) un nouveau fond d'écran
exports.uploadWallpaper = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // Limite de 5 uploads pour les utilisateurs (non-admins)
    if (user.role !== 'admin') {
      const count = await Wallpaper.countDocuments({ uploadedBy: req.user.id });
      if (count >= 5) {
        return res.status(403).json({ error: 'Limite d\'upload atteinte (max 5 images). Devenez curateur Premium pour plus !' });
      }
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie.' });
    }

    const newWallpaper = new Wallpaper({
      url: req.file.path,
      publicId: req.file.filename,
      uploadedBy: req.user.id,
    });

    await newWallpaper.save();
    res.status(201).json(newWallpaper);
  } catch (err) {
    // If the request was aborted midway, don't try to send a second response
    if (res.headersSent) return;
    console.error('Erreur upload:', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'upload : ' + err.message });
  }
};

// Récupérer deux fonds d'écran aléatoires pour une battle
exports.getRandomWallpapers = async (req, res) => {
  try {
    const randomWallpapers = await Wallpaper.aggregate([
      { $sample: { size: 2 } }
    ]);
    
    if (randomWallpapers.length < 2) {
      return res.status(400).json({ error: 'Pas assez de fonds d\'écran pour une battle.' });
    }

    res.json(randomWallpapers);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
};

// Enregistrer le vote (Mise à jour des scores Elo)
exports.voteWallpapers = async (req, res) => {
  const { winnerId, loserId } = req.body;
  if (!winnerId || !loserId) {
    return res.status(400).json({ error: 'Les IDs du gagnant et du perdant sont requis.' });
  }

  try {
    const winner = await Wallpaper.findById(winnerId);
    const loser = await Wallpaper.findById(loserId);

    if (!winner || !loser) {
      return res.status(404).json({ error: 'L\'un des fonds d\'écran n\'a pas pu être trouvé.' });
    }

    // Formule Elo Simple (K-factor = 32)
    const K = 32;
    // Espérance de victoire (E)
    // E_A = 1 / (1 + 10 ^ ((R_B - R_A)/400))
    const expectedWinner = 1 / (1 + Math.pow(10, (loser.eloScore - winner.eloScore) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winner.eloScore - loser.eloScore) / 400));

    // Nouveaux scores (Winner = score réel 1, Loser = score réel 0)
    winner.eloScore = Math.round(winner.eloScore + K * (1 - expectedWinner));
    loser.eloScore = Math.round(loser.eloScore + K * (0 - expectedLoser));

    winner.matches += 1;
    winner.wins += 1;
    loser.matches += 1;

    await winner.save();
    await loser.save();

    res.json({ message: 'Votes et scores Elo mis à jour.', winnerScore: winner.eloScore, loserScore: loser.eloScore });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du vote : ' + err.message });
  }
};

// Récupérer le classement (Leaderboard)
exports.getLeaderboard = async (req, res) => {
  try {
    const topWallpapers = await Wallpaper.find()
      .sort({ eloScore: -1 })
      .limit(50);
    res.json(topWallpapers);
  } catch (err) {
    res.status(500).json({ error: 'Erreur Serveur : ' + err.message });
  }
};

// Supprimer un wallpaper (uniquement par son propriétaire)
exports.deleteWallpaper = async (req, res) => {
  try {
    const wallpaper = await Wallpaper.findById(req.params.id);
    if (!wallpaper) return res.status(404).json({ error: 'Wallpaper introuvable.' });

    // Vérification du propriétaire
    if (wallpaper.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    // Suppression de Cloudinary si on a le publicId
    if (wallpaper.publicId) {
      const { cloudinary } = require('../config/cloudinary');
      await cloudinary.uploader.destroy(wallpaper.publicId);
    }

    await wallpaper.deleteOne();
    res.json({ message: 'Wallpaper supprimé avec succès.' });
  } catch (err) {
    if (res.headersSent) return;
    res.status(500).json({ error: 'Erreur suppression : ' + err.message });
  }
};
