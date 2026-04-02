const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Connexion BDD
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wallora')
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.log(err));

// Routes
const wallpaperRoutes = require('./routes/wallpaperRoutes');
app.use('/api/wallpapers', wallpaperRoutes);

app.get('/', (req, res) => {
  res.send('API Wallora 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
