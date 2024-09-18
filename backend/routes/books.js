const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/authMiddleware");
const Book = require("../models/Book");
const path = require("path");
const fs = require("fs");

// Configurer multer pour le stockage des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Dossier où les fichiers seront stockés
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname); // Nom unique pour éviter les doublons
    },
});

// Initialiser multer avec cette configuration
const upload = multer({ storage: storage });

// Route POST pour ajouter un livre
router.post("/", auth, upload.single("image"), async (req, res) => {
    // Log pour voir le contenu de la requête
    console.log("Requête reçue pour ajouter un livre:", req.body);

    // Extraire et parser la chaîne JSON du champ 'book'
    const bookData = JSON.parse(req.body.book); // Parse les données du livre

    // Extraire les champs du livre à partir de la chaîne JSON parsée
    const { title, author, year, genre } = bookData;

    // Capture du chemin de l'image uploadée (si présente)
    const imageUrl = req.file ? req.file.path : "";

    try {
        // Créer un nouveau livre avec les données extraites
        const newBook = new Book({
            userId: req.user.userId, // L'utilisateur connecté
            title, // Titre du livre
            author, // Auteur du livre
            imageUrl, // URL de l'image
            year, // Année de publication
            genre, // Genre du livre
            ratings: [], // Tableau vide pour les notes
            averageRating: 0, // Note moyenne initialisée à 0
        });

        // Sauvegarder le nouveau livre dans la base de données
        const book = await newBook.save();

        console.log("Livre créé avec succès:", book); // Log du livre créé
        res.json({ message: "Livre ajouté avec succès", book }); // Réponse avec le livre créé
    } catch (err) {
        console.error("Erreur lors de l'ajout du livre:", err); // Log de l'erreur si l'enregistrement échoue
        res.status(500).send("Erreur serveur");
    }
});

// Route PUT pour mettre à jour un livre (avec ou sans fichier)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
    try {
        // Log pour voir l'ID du livre
        console.log(`Mise à jour du livre avec l'ID: ${req.params.id}`);

        // Récupérer le livre existant
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: "Livre non trouvé" });
        }

        // Vérifier si l'utilisateur qui effectue la requête est celui qui a créé le livre
        if (book.userId.toString() !== req.user.userId) {
            return res
                .status(403)
                .json({ message: "Non autorisé à modifier ce livre" });
        }

        // Si un fichier est présent dans la requête (mise à jour de l'image)
        let imageUrl = book.imageUrl; // Garder l'image actuelle si aucune nouvelle image n'est uploadée
        if (req.file) {
            imageUrl = req.file.path; // Mettre à jour l'image si une nouvelle image est uploadée
        }

        // Si la requête contient un champ 'book' sous forme de chaîne de caractères (cas où une image est envoyée)
        if (req.body.book) {
            const bookData = JSON.parse(req.body.book); // Parse les données JSON du livre
            book.title = bookData.title || book.title;
            book.author = bookData.author || book.author;
            book.year = bookData.year || book.year;
            book.genre = bookData.genre || book.genre;
        } else {
            // Sinon, récupérer les champs directement dans le body
            book.title = req.body.title || book.title;
            book.author = req.body.author || book.author;
            book.year = req.body.year || book.year;
            book.genre = req.body.genre || book.genre;
        }

        // Mettre à jour l'URL de l'image
        book.imageUrl = imageUrl;

        // Sauvegarder le livre mis à jour dans la base de données
        const updatedBook = await book.save();

        console.log("Livre mis à jour avec succès:", updatedBook);
        res.json({
            message: "Livre mis à jour avec succès",
            book: updatedBook,
        });
    } catch (err) {
        console.error("Erreur lors de la mise à jour du livre:", err);
        res.status(500).send("Erreur serveur");
    }
});

// Route GET pour récupérer tous les livres sans authentification
router.get("/", async (req, res) => {
    try {
        // Récupérer tous les livres de la base de données
        const books = await Book.find();

        // Vérifier si des livres existent
        if (!books || books.length === 0) {
            return res.status(404).json({ message: "Aucun livre trouvé" });
        }

        // Compléter l'URL de l'image pour chaque livre
        const booksWithFullImageUrl = books.map((book) => {
            return {
                ...book._doc, // Récupérer les autres champs du livre
                imageUrl: `http://localhost:5000/${book.imageUrl}`, // Compléter l'URL de l'image
            };
        });

        // Envoyer la liste des livres avec les URLs complètes
        res.json(booksWithFullImageUrl);
    } catch (err) {
        console.error("Erreur lors de la récupération des livres:", err);
        res.status(500).send("Erreur serveur");
    }
});

// Route GET pour récupérer les 3 livres ayant la meilleure note moyenne
router.get("/bestrating", async (req, res) => {
    try {
        // Récupérer les livres triés par la meilleure note moyenne, limités à 3
        const bestRatedBooks = await Book.find()
            .sort({ averageRating: -1 })
            .limit(3);

        // Si aucun livre n'est trouvé, renvoyer une erreur 404
        if (!bestRatedBooks || bestRatedBooks.length === 0) {
            return res.status(404).json({ message: "Aucun livre trouvé" });
        }

        // Compléter l'URL de l'image pour chaque livre
        const booksWithFullImageUrl = bestRatedBooks.map((book) => {
            return {
                ...book._doc, // Récupérer les autres champs du livre
                imageUrl: `http://localhost:5000/${book.imageUrl}`, // Compléter l'URL de l'image
            };
        });

        // Envoyer les livres triés avec les URLs complètes
        res.json(booksWithFullImageUrl);
    } catch (err) {
        console.error(
            "Erreur lors de la récupération des meilleurs livres:",
            err
        );
        res.status(500).send("Erreur serveur");
    }
});

// Route GET pour récupérer un livre spécifique par son ID
router.get("/:id", async (req, res) => {
    try {
        // Log de l'ID du livre demandé
        console.log(`Récupération du livre avec l'ID: ${req.params.id}`);

        const book = await Book.findById(req.params.id);

        // Vérifier si le livre existe
        if (!book) {
            console.log(`Livre non trouvé pour l'ID: ${req.params.id}`);
            return res.status(404).json({ message: "Livre non trouvé" });
        }

        // Log de l'ID de l'utilisateur qui a créé le livre
        console.log(`ID de l'utilisateur ayant créé le livre: ${book.userId}`);

        const bookWithFullImageUrl = {
            ...book._doc,
            imageUrl: `http://localhost:5000/${book.imageUrl}`,
        };

        // Log de l'objet livre avec l'image complète
        console.log("Données du livre renvoyées:", bookWithFullImageUrl);

        // Renvoyer le livre avec l'URL complète de l'image
        res.json(bookWithFullImageUrl);
    } catch (err) {
        console.error("Erreur lors de la récupération du livre:", err);
        res.status(500).send("Erreur serveur");
    }
});

// Route DELETE pour supprimer un livre et l'image associée
router.delete("/:id", auth, async (req, res) => {
    try {
        // Récupérer le livre par ID
        const book = await Book.findById(req.params.id);

        // Vérifier si le livre existe
        if (!book) {
            return res.status(404).json({ message: "Livre non trouvé" });
        }

        // Vérifier si l'utilisateur connecté est bien celui qui a créé le livre
        if (book.userId.toString() !== req.user.userId) {
            return res
                .status(403)
                .json({ message: "Non autorisé à supprimer ce livre" });
        }

        // Log du chemin de l'image à supprimer
        console.log("Image à supprimer:", book.imageUrl);

        // Supprimer l'image associée si elle existe
        if (book.imageUrl) {
            const imagePath = path.join(__dirname, "..", book.imageUrl);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error(
                        "Erreur lors de la suppression de l'image:",
                        err
                    );
                } else {
                    console.log("Image supprimée avec succès:", imagePath);
                }
            });
        }

        // Supprimer le livre de la base de données
        await Book.findByIdAndDelete(req.params.id);

        // Réponse de succès
        res.json({ message: "Livre supprimé avec succès" });
    } catch (err) {
        console.error("Erreur lors de la suppression du livre:", err);
        res.status(500).send("Erreur serveur");
    }
});

// POST /api/books/:id/rating
router.post("/:id/rating", auth, async (req, res) => {
  const { userId, rating } = req.body; // Récupérer les données envoyées dans le body de la requête
  if (!userId || rating === undefined) {
      return res.status(400).json({ message: "User ID et note sont requis" });
  }

  if (rating < 0 || rating > 5) {
      return res.status(400).json({ message: "La note doit être comprise entre 0 et 5" });
  }

  try {
      // Récupérer le livre par son ID
      const book = await Book.findById(req.params.id);

      if (!book) {
          return res.status(404).json({ message: "Livre non trouvé" });
      }

      // Vérifier si l'utilisateur a déjà noté le livre
      const existingRating = book.ratings.find((r) => r.userId === userId);
      if (existingRating) {
          return res.status(400).json({ message: "Vous avez déjà noté ce livre" });
      }

      // Ajouter la nouvelle note dans le tableau ratings
      book.ratings.push({ userId, grade: rating });

      // Calculer la nouvelle moyenne des notes
      const totalRatings = book.ratings.length;
      const sumOfRatings = book.ratings.reduce((sum, r) => sum + r.grade, 0);
      book.averageRating = sumOfRatings / totalRatings;

      // Sauvegarder les modifications dans la base de données
      const updatedBook = await book.save();

      // Retourner le livre mis à jour
      res.json(updatedBook);
  } catch (err) {
      console.error("Erreur lors de l'ajout de la note:", err);
      res.status(500).send("Erreur serveur");
  }
});


module.exports = router;
