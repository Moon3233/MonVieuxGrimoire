const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.header('Authorization');
    
    console.log('Authorization Header:', token); // Log du header Authorization

    if (!token) {
        console.log('Pas de token, autorisation refusée'); // Log si aucun token n'est trouvé
        return res.status(401).json({ msg: 'Pas de token, autorisation refusée' });
    }

    let actualToken = token;
    if (token.startsWith('Bearer ')) {
        actualToken = token.split(' ')[1]; // Retire "Bearer " du token
        console.log('Token après Bearer extraction:', actualToken); // Log du token après extraction du "Bearer "
    }

    try {
        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
        console.log('Token décodé:', decoded); // Log du contenu décodé du token
        req.user = decoded;
        next();
    } catch (err) {
        console.log('Erreur de vérification du token:', err); // Log de l'erreur si le token n'est pas valide
        res.status(401).json({ msg: 'Token non valide' });
    }
};
