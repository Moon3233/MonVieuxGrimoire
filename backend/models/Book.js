// models/Book.js
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    grade: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
    },
});

const bookSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        maxlength: 200, // Limite de caractères pour le titre
    },
    author: {
        type: String,
        required: true,
        maxlength: 100, // Limite de caractères pour l'auteur
    },
    imageUrl: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
        min: 0, // Année minimale possible
    },
    genre: {
        type: String,
        required: true,
        maxlength: 50, // Limite de caractères pour le genre
    },
    ratings: [ratingSchema], // Tableau de notes
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
});


module.exports = mongoose.model('Book', bookSchema);
