const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Connexion BDD
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wallora')
  .then(async () => {
    console.log('MongoDB connecté');
    
    // Création du compte Admin par défaut
    try {
      const adminEmail = '7bhilal.chitou7@gmail.com';
      const adminExists = await User.findOne({ email: adminEmail });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = new User({
          username: 'admin',
          email: adminEmail,
          password: hashedPassword
        });
        await adminUser.save();
        console.log('Compte admin par défaut créé avec succès !');
      }
    } catch (err) {
      console.error('Erreur lors de la création de l\'admin:', err);
    }
  })
  .catch(err => console.error('Erreur connexion MongoDB:', err.message));

// Routes
const wallpaperRoutes = require('./routes/wallpaperRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/wallpapers', wallpaperRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API Wallora 🚀');
});

// Global error handler — catches multer Request aborted + autres erreurs Express
app.use((err, req, res, next) => {
  if (err.code === 'ECONNRESET' || err.message === 'Request aborted') {
    console.warn('Upload annulé par le client (connexion coupée)');
    return res.status(499).json({ error: 'Upload annulé. Réessayez.' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fichier trop lourd. Maximum autorisé : 10 Mo.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Champ de fichier inattendu. Utilisez le champ "image".' });
  }
  console.error('Erreur serveur:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur interne.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
