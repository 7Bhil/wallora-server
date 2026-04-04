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

exports.updateProfile = async (req, res) => {
  const { username, email } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    if (username) user.username = username;
    if (email) user.email = email;

    // Gestion de l'avatar si présent dans req.file
    if (req.file) {
      // Suppression de l'ancien avatar si présent sur Cloudinary
      if (user.avatarPublicId) {
        const { cloudinary } = require('../config/cloudinary');
        await cloudinary.uploader.destroy(user.avatarPublicId);
      }
      user.avatarUrl = req.file.path;
      user.avatarPublicId = req.file.filename;
    }

    await user.save();
    res.json({ message: 'Profil mis à jour avec succès', user: { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Wallpaper.aggregate([
      {
        $group: {
          _id: '$uploadedBy',
          totalPrestige: { $sum: '$eloScore' },
          wallpapersCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          username: '$user.username',
          totalPrestige: 1,
          wallpapersCount: 1
        }
      },
      { $sort: { totalPrestige: -1 } },
      { $limit: 100 }
    ]);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
