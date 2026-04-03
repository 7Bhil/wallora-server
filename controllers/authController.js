const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
};
