const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/authMiddleware');
const {
    addBook,
    updateBook,
    getAllBooks,
    getBestRatedBooks,
    getBookById,
    deleteBook,
    addRating
} = require('../controllers/bookController');

// Configurer multer pour le stockage des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

// Routes pour les livres
router.post("/", auth, upload.single("image"), addBook);
router.put("/:id", auth, upload.single("image"), updateBook);
router.get("/", getAllBooks);
router.get("/bestrating", getBestRatedBooks);
router.get("/:id", getBookById);
router.delete("/:id", auth, deleteBook);
router.post("/:id/rating", auth, addRating);

module.exports = router;