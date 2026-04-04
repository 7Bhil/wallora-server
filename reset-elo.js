require('dotenv').config();
const mongoose = require('mongoose');
const Wallpaper = require('./models/Wallpaper');

const resetElo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB...');

    const result = await Wallpaper.updateMany({}, { 
      $set: { 
        eloScore: 1000, 
        matches: 0, 
        wins: 0 
      } 
    });

    console.log(`Succès ! ${result.modifiedCount} images ont été remises à 1000 ELO.`);
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
};

resetElo();
