const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Veuillez remplir tous les champs.' });

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ error: 'Cet email est déjà utilisé.' });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ error: 'Ce nom d\'utilisateur est pris.' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    
    await newUser.save();
    
    // Auto-login upon registration
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: newUser._id, username: newUser.username, email: newUser.email }, message: 'Compte créé avec succès !' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création : ' + err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ error: 'Identifiants invalides.' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: 'Identifiants invalides.' });

    // Génération du token JWT
    const token = jwt.sign(
        { id: user._id }, 
        process.env.JWT_SECRET || 'secret', 
        { expiresIn: '30d' }
    );
    
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
};

exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Token manquant.' });

  try {
    let googleId, email, name, picture;

    if (idToken.startsWith('ya29.')) {
      // Cas de l'Access Token (souvent envoyé par le bouton Web personnalisé)
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_description || 'Invalid Access Token');
      
      googleId = data.sub;
      email = data.email;
      name = data.name || data.given_name;
      picture = data.picture;
    } else {
      // Cas de l'ID Token (JWT classique)
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    if (!email) return res.status(400).json({ error: 'Impossible de récupérer l\'email Google.' });

    let user = await User.findOne({ email });

    if (!user) {
      // Nouvel utilisateur via Google
      user = new User({
        username: name.replace(/\s+/g, '_').toLowerCase() + Math.floor(Math.random() * 1000),
        email,
        googleId,
        avatarUrl: picture,
      });
      await user.save();
    } else if (!user.googleId) {
      // Lier Google à un compte existant
      user.googleId = googleId;
      if (!user.avatarUrl) user.avatarUrl = picture;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ 
      token, 
      user: { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl, role: user.role } 
    });
  } catch (err) {
    res.status(400).json({ error: 'Authentification Google échouée : ' + err.message });
  }
};
