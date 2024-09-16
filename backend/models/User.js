// models/User.js
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Assure que l'email est unique
        match: [/.+@.+\..+/, "Veuillez entrer une adresse e-mail valide"], // Validation du format de l'email
    },
    password: {
        type: String,
        required: true,
    },
});

// Plugin pour gérer les erreurs de champ unique
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
