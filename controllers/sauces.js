const Sauce = require("../models/sauce");
const fs = require("fs");

exports.createSauce = (req, res, next) => {
	// const sauces = new Sauce({
	// 	userId: req.body.userId,
	// 	name: req.body.name,
	// 	manufacturer: req.body.manufacturer,
	// 	description: req.body.description,
	// 	mainPepper: req.body.mainPepper,
	// 	imageUrl: req.body.imageUrl,
	// 	heat: req.body.heat
	// });
	const sauceObject = JSON.parse(req.body.sauce);
	// console.log(sauceObject.heat);
	if (sauceObject.heat > 10) {
		res.status(403).json({
			message: "Vous ne pouvez pas ajouter plus de 10 heat!"
		});
		return;
	}

	delete sauceObject._id;
	delete sauceObject._userId;
	const sauces = new Sauce({
		...sauceObject,
		userId: req.auth.userId,
		likes: 0,
		dislikes: 0,
		imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
	});
	sauces
		.save()
		.then(() => {
			res.status(201).json({
				message: "Post saved successfully!"
			});
		})
		.catch(error => {
			res.status(400).json({
				error: error
			});
		});
};

exports.getOneSauce = (req, res, next) => {
	Sauce.findOne({
		_id: req.params.id
	})
		.then(sauce => {
			console.log(sauce);
			res.status(200).json(sauce);
		})
		.catch(error => {
			res.status(404).json({
				error: error
			});
		});
};

exports.modifySauce = (req, res, next) => {
	console.log(req.body.heat);
	if (req.body.sauce.heat > 10) {
		res.status(403).json({
			message: "Vous ne pouvez pas ajouter plus de 10 heat!"
		});
		return;
	}
	const sauceObject = req.file
		? {
				...JSON.parse(req.body.sauce),
				imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
		  }
		: { ...req.body };

	delete sauceObject._userId;
	delete sauceObject.like; // supprimer like et dislike de l'array sauceobjet
	delete sauceObject.dislike;
	Sauce.findOne({ _id: req.params.id })
		.then(sauce => {
			const oldFile = sauce.imageUrl.split("/images/")[1];
			if (req.file) {
				fs.unlink(oldFile, () => {
					console.log("supprimé");
				});
			}
			if (sauce.userId != req.auth.userId) {
				res.status(403).json({ message: "Not authorized" });
			} else {
				Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
					.then(() => res.status(200).json({ message: "Objet modifié!" }))
					.catch(error => res.status(401).json({ error }));
			}
		})
		.catch(error => {
			res.status(400).json({ error: "error " + error });
		});
};

exports.deleteSauce = (req, res, next) => {
	Sauce.findOne({ _id: req.params.id })
		.then(sauce => {
			console.log(sauce);
			if (sauce.userId != req.auth.userId) {
				res.status(403).json({ message: "Not authorized" });
			} else {
				const filename = sauce.imageUrl.split("/images/")[1];
				fs.unlink(`images/${filename}`, () => {
					Sauce.deleteOne({ _id: req.params.id })
						.then(() => {
							res.status(200).json({ message: "Objet supprimé !" });
						})
						.catch(error =>
							res.status(401).json({ message: "Objet non supprimé !" + error })
						);
				});
			}
		})
		.catch(error => {
			res.status(500).json({ message: "Error : " + error });
		});
};

exports.getAllStuff = (req, res, next) => {
	Sauce.find()
		.then(sauces => {
			res.status(200).json(sauces);
		})
		.catch(error => {
			res.status(400).json({
				error: error
			});
		});
};
const checkdislikeifexiste = (sauce, user) => {
	return Sauce.find({
		usersDisliked: { $elemMatch: { $eq: user } }, // in recherche dans un array
		_id: sauce
	});
};

const checklikeifexiste = (sauce, user) => {
	return Sauce.find({
		usersLiked: { $elemMatch: { $eq: user } },
		_id: sauce
	});
};

exports.LikeSauce = async (req, res, next) => {
	console.log(req.body);
	//verifier si le variable like exisrte and === 1 ( like )
	if (req.body.like && req.body.like === 1) {
		console.log(req.body);
		let check = await checklikeifexiste(req.params.id, req.auth.userId); //verifier si user liked sauce
		console.log(check);
		if (check.length === 0) {
			// si user n'esxite pas il va ajouter un like
			let res0 = addlike(req.params.id, req.auth.userId);
			res.status(200).json(res0); // il va executer la fonction addlikeet retourner leur resultat a l'api
		} else {
			console.log("like existe");
			res.status(201).json({ like: "already liked" });
		}
		//verifier si le variable like exisrte and === -1 ( dislike )
	} else if (req.body.like && req.body.like === -1) {
		let check = await checkdislikeifexiste(req.params.id, req.auth.userId);
		if (check.length === 0) {
			res.status(200).json(adddislikelike(req.params.id, req.auth.userId));
		} else {
			console.log("user dislike existe");
			res.status(201).json({ like: "already disliked" });
		}

		//if like/dislike enlever
	} else {
		let checkl = await checklikeifexiste(req.params.id, req.auth.userId);
		if (checkl.length !== 0) {
			let res1 = deletelike(req.params.id, req.auth.userId);
			res.status(200).json(res1);
		}

		let checkd = await checkdislikeifexiste(req.params.id, req.auth.userId);
		if (checkd.length !== 0) {
			let res2 = deletedislike(req.params.id, req.auth.userId);
			res.status(200).json(res2);
		}
	}
};

const addlike = (sauce, user) => {
	Sauce.updateOne(
		{ _id: sauce },
		{
			$push: {
				usersLiked: user
			},
			$inc: {
				likes: 1
			}
		}
	)
		.then(response => {
			return response;
		})
		.catch(error => {
			return false;
		});
};
const adddislikelike = (sauce, user) => {
	Sauce.updateOne(
		{ _id: sauce },
		{
			$push: {
				usersDisliked: user
			},
			$inc: {
				dislikes: 1
			}
		}
	)
		.then(response => {
			return response;
		})
		.catch(error => {
			return false;
		});
};
const deletelike = (sauce, user) => {
	Sauce.updateOne(
		{ _id: sauce },
		{
			$pull: {
				usersLiked: user
			},
			$inc: {
				likes: -1
			}
		}
	)
		.then(response => {
			return response;
		})
		.catch(error => {
			return false;
		});
};
const deletedislike = (sauce, user) => {
	Sauce.updateOne(
		{ _id: sauce },
		{
			$pull: {
				usersDisliked: user
			},
			$inc: {
				dislikes: -1
			}
		}
	)
		.then(response => {
			return response;
		})
		.catch(error => {
			return false;
		});
};
