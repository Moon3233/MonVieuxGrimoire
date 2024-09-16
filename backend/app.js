const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Rendre le dossier "uploads" accessible publiquement
app.use('/uploads', express.static('uploads'));

// Connexion à MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connecté"))
    .catch((err) => console.log(err));

// Importer les routes
const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");

// Utiliser les routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

// Route de base
app.get("/", (req, res) => {
    res.send("Le backend fonctionne");
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Le serveur tourne sur le port ${PORT}`);
});
