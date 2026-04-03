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
  .catch(err => console.log(err));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
