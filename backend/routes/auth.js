const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Inscription d'un utilisateur
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Vérifier si l'utilisateur existe déjà
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'Utilisateur déjà existant' });

        // Créer un nouvel utilisateur
        user = new User({
            email,
            password,
        });

        // Hacher le mot de passe
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Enregistrer l'utilisateur
        await user.save();

        // Créer et envoyer le token
        const payload = { userId: user.id };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error('Erreur lors de l\'inscription:', err); // Log de l'erreur pour mieux la diagnostiquer
        res.status(500).send('Erreur serveur');
    }
});


// Connexion d'un utilisateur
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Vérifier l'utilisateur
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Identifiants invalides' });

        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Identifiants invalides' });

        // Créer et envoyer le token
        const payload = { userId: user.id };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;
