const Book = require('../models/Book');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ajouter un livre avec conversion de l'image en .avif
exports.addBook = async (req, res) => {
    console.log("Requête reçue pour ajouter un livre:", req.body);

    const bookData = JSON.parse(req.body.book);
    const { title, author, year, genre } = bookData;
    
    try {
        // Convertir l'image en .avif si elle est présente
        let imageUrl = '';
        if (req.file) {
            const avifFilePath = path.join('uploads', `${Date.now()}-converted.avif`);
            await sharp(req.file.path)
                .avif({ quality: 50 }) // Convertir en .avif avec 50% de qualité
                .toFile(avifFilePath);
            
            // Supprimer l'image originale après conversion
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error("Erreur lors de la suppression de l'image originale:", err);
                } else {
                    console.log("Image originale supprimée après conversion");
                }
            });
            
            imageUrl = avifFilePath; // Utiliser le chemin de l'image .avif
        }

        // Créer un nouveau livre
        const newBook = new Book({
            userId: req.user.userId,
            title,
            author,
            imageUrl,
            year,
            genre,
            ratings: [],
            averageRating: 0,
        });

        const book = await newBook.save();
        console.log("Livre créé avec succès:", book);
        res.json({ message: "Livre ajouté avec succès", book });
    } catch (err) {
        console.error("Erreur lors de l'ajout du livre:", err);
        res.status(500).send("Erreur serveur");
    }
};

// Mettre à jour un livre avec conversion de l'image en .avif
exports.updateBook = async (req, res) => {
    try {
        console.log(`Mise à jour du livre avec l'ID: ${req.params.id}`);

        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Livre non trouvé" });

        if (book.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Non autorisé à modifier ce livre" });
        }

        let imageUrl = book.imageUrl; // Conserver l'ancienne image si aucune nouvelle n'est fournie

        // Si une nouvelle image est uploadée, la convertir en .avif et supprimer l'ancienne
        if (req.file) {
            // Convertir l'image uploadée en format .avif avec qualité 50%
            const avifFilePath = path.join('uploads', `${Date.now()}-converted.avif`);
            await sharp(req.file.path)
                .avif({ quality: 50 })
                .toFile(avifFilePath);

            // Supprimer l'image originale après conversion
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error("Erreur lors de la suppression de l'image originale:", err);
                } else {
                    console.log("Image originale supprimée après conversion");
                }
            });

            // Supprimer l'ancienne image si elle existe
            if (book.imageUrl) {
                const oldImagePath = path.join(__dirname, "..", book.imageUrl);
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error("Erreur lors de la suppression de l'ancienne image:", err);
                    } else {
                        console.log("Ancienne image supprimée avec succès");
                    }
                });
            }

            // Mettre à jour le chemin de la nouvelle image
            imageUrl = avifFilePath;
        }

        // Mettre à jour les autres champs du livre si fournis
        if (req.body.book) {
            const bookData = JSON.parse(req.body.book);
            book.title = bookData.title || book.title;
            book.author = bookData.author || book.author;
            book.year = bookData.year || book.year;
            book.genre = bookData.genre || book.genre;
        } else {
            book.title = req.body.title || book.title;
            book.author = req.body.author || book.author;
            book.year = req.body.year || book.year;
            book.genre = req.body.genre || book.genre;
        }

        // Mettre à jour l'URL de l'image dans le livre
        book.imageUrl = imageUrl;

        // Sauvegarder les modifications
        const updatedBook = await book.save();

        console.log("Livre mis à jour avec succès:", updatedBook);
        res.json({ message: "Livre mis à jour avec succès", book: updatedBook });
    } catch (err) {
        console.error("Erreur lors de la mise à jour du livre:", err);
        res.status(500).send("Erreur serveur");
    }
};


// Récupérer tous les livres
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();
        if (!books || books.length === 0) {
            return res.status(404).json({ message: "Aucun livre trouvé" });
        }

        const booksWithFullImageUrl = books.map((book) => ({
            ...book._doc,
            imageUrl: `http://localhost:5000/${book.imageUrl}`,
        }));

        res.json(booksWithFullImageUrl);
    } catch (err) {
        console.error("Erreur lors de la récupération des livres:", err);
        res.status(500).send("Erreur serveur");
    }
};

// Récupérer les meilleurs livres
exports.getBestRatedBooks = async (req, res) => {
    try {
        const bestRatedBooks = await Book.find().sort({ averageRating: -1 }).limit(3);
        if (!bestRatedBooks || bestRatedBooks.length === 0) {
            return res.status(404).json({ message: "Aucun livre trouvé" });
        }

        const booksWithFullImageUrl = bestRatedBooks.map((book) => ({
            ...book._doc,
            imageUrl: `http://localhost:5000/${book.imageUrl}`,
        }));

        res.json(booksWithFullImageUrl);
    } catch (err) {
        console.error("Erreur lors de la récupération des meilleurs livres:", err);
        res.status(500).send("Erreur serveur");
    }
};

// Récupérer un livre par ID
exports.getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Livre non trouvé" });

        const bookWithFullImageUrl = {
            ...book._doc,
            imageUrl: `http://localhost:5000/${book.imageUrl}`,
        };

        res.json(bookWithFullImageUrl);
    } catch (err) {
        console.error("Erreur lors de la récupération du livre:", err);
        res.status(500).send("Erreur serveur");
    }
};

// Supprimer un livre
exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Livre non trouvé" });

        if (book.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Non autorisé à supprimer ce livre" });
        }

        if (book.imageUrl) {
            const imagePath = path.join(__dirname, "..", book.imageUrl);
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error("Erreur lors de la suppression de l'image:", err);
                } else {
                    console.log("Image supprimée avec succès:", imagePath);
                }
            });
        }

        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: "Livre supprimé avec succès" });
    } catch (err) {
        console.error("Erreur lors de la suppression du livre:", err);
        res.status(500).send("Erreur serveur");
    }
};

// Ajouter une note à un livre
exports.addRating = async (req, res) => {
    const { userId, rating } = req.body;
    if (!userId || rating === undefined) {
        return res.status(400).json({ message: "User ID et note sont requis" });
    }

    if (rating < 0 || rating > 5) {
        return res.status(400).json({ message: "La note doit être comprise entre 0 et 5" });
    }

    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Livre non trouvé" });

        const existingRating = book.ratings.find((r) => r.userId === userId);
        if (existingRating) {
            return res.status(400).json({ message: "Vous avez déjà noté ce livre" });
        }

        book.ratings.push({ userId, grade: rating });

        const totalRatings = book.ratings.length;
        const sumOfRatings = book.ratings.reduce((sum, r) => sum + r.grade, 0);
        book.averageRating = sumOfRatings / totalRatings;

        const updatedBook = await book.save();

        const bookWithFullImageUrl = {
            ...updatedBook._doc,
            imageUrl: `http://localhost:5000/${updatedBook.imageUrl}`,
        };

        res.json(bookWithFullImageUrl);
    } catch (err) {
        console.error("Erreur lors de l'ajout de la note:", err);
        res.status(500).send("Erreur serveur");
    }
};
