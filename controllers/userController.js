const User = require('../models/User');
const Wallpaper = require('../models/Wallpaper');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const wallpapers = await Wallpaper.find({ uploadedBy: req.user.id }).sort({ eloScore: -1 });

    const totalUploads = wallpapers.length;
    const totalPrestige = wallpapers.reduce((acc, wp) => acc + wp.eloScore, 0);
    const votesCast = 1200; // Simulated for now

    res.json({
      user,
      stats: {
        totalUploads,
        totalPrestige: totalPrestige > 0 ? totalPrestige : 2450, // default if empty
        votesCast
      },
      wallpapers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
