const express = require("express");
const bodyParser = require("body-Parser");
const path = require("path");
const mongoose = require("mongoose");

const userRoutes = require("./routes/user");
const sauceRoutes = require("./routes/sauces");

mongoose
	.connect(
		"mongodb+srv://salmaabidi:RSsalma89@cluster0.pv547ru.mongodb.net/?retryWrites=true&w=majority",
		{ useNewUrlParser: true, useUnifiedTopology: true }
	)
	.then(() => console.log("Connexion à MongoDB réussie !"))
	.catch(() => console.log("Connexion à MongoDB échouée !"));

const app = express();
app.use(express.json());
app.use(bodyParser.json());
//ajoutez le middleware suivant avant la route d'API
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*"); //d'accéder à notre API depuis n'importe quelle origine (
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content, Accept, Content-Type, Authorization" //d'ajouter les headers mentionnés aux requêtes envoyées vers notre API
	);
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS"); //d'envoyer des requêtes avec les méthodes mentionnées
	next();
});
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api/auth", userRoutes);
app.use("/api/sauces", sauceRoutes);

module.exports = app;
