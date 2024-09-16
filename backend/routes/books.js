const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/authMiddleware');
const Book = require('../models/Book');

// Configurer multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Dossier où les fichiers seront stockés
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Nom unique pour éviter les doublons
  }
});

// Initialiser multer avec cette configuration
const upload = multer({ storage: storage });

// Route POST pour ajouter un livre
router.post('/', auth, upload.single('image'), async (req, res) => {
    // Log pour voir le contenu de la requête
    console.log('Requête reçue pour ajouter un livre:', req.body);

    // Extraire et parser la chaîne JSON du champ 'book'
    const bookData = JSON.parse(req.body.book); // Parse les données du livre

    // Extraire les champs du livre à partir de la chaîne JSON parsée
    const { title, author, year, genre, ratings, averageRating } = bookData;

    // Capture du chemin de l'image uploadée (si présente)
    const imageUrl = req.file ? req.file.path : '';

    try {
        // Créer un nouveau livre avec les données extraites
        const newBook = new Book({
            userId: req.user.userId, // L'utilisateur connecté
            title,                   // Titre du livre
            author,                  // Auteur du livre
            imageUrl,                // URL de l'image
            year,                    // Année de publication
            genre,                   // Genre du livre
            ratings: ratings || [],  // Note initiale (vide par défaut)
            averageRating: averageRating || 0 // Note moyenne (0 par défaut)
        });

        // Sauvegarder le nouveau livre dans la base de données
        const book = await newBook.save();

        console.log('Livre créé avec succès:', book); // Log du livre créé
        res.json(book);  // Réponse avec le livre créé
    } catch (err) {
        console.error('Erreur lors de l\'ajout du livre:', err); // Log de l'erreur si l'enregistrement échoue
        res.status(500).send('Erreur serveur');
    }
});


module.exports = router;
