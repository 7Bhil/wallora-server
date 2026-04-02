const Wallpaper = require('../models/Wallpaper');

// Upload (Ajouter) un nouveau fond d'écran
exports.uploadWallpaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Acune image fournie.' });
    }

    const newWallpaper = new Wallpaper({
      url: req.file.path,
      publicId: req.file.filename,
    });

    await newWallpaper.save();
    res.status(201).json(newWallpaper);
  } catch (err) {
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
    // Top 50, trié par score Elo décroissant
    const topWallpapers = await Wallpaper.find()
      .sort({ eloScore: -1 })
      .limit(50);
      
    res.json(topWallpapers);
  } catch (err) {
    res.status(500).json({ error: 'Erreur Serveur : ' + err.message });
  }
};
