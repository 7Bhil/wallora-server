const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Accès refusé. Aucun token fourni.' });

  try {
    const cleanToken = token.replace('Bearer ', '');
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || 'secret');
    req.user = decoded; // Expose l'objet { id: user._id }
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token invalide.' });
  }
};
