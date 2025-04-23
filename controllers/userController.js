var UserModel = require('../models/userModel.js');

module.exports = {


    /**
     * userController.create()
     */
    create: function (req, res) {
        var user = new UserModel({
			username : req.body.username,
			password : req.body.password,
			email : req.body.email
        });

        user.save(function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating user',
                    error: err
                });
            }

            //return res.status(201).json(user);
            return res.redirect('/users/login');
        });
    },


    showRegister: function(req, res){
        res.render('user/register');
    },

    showLogin: function(req, res){
        res.render('user/login');
    },

    login: function(req, res, next){
        UserModel.authenticate(req.body.username, req.body.password, function(err, user){
            if(err || !user){
                var err = new Error('Wrong username or paassword');
                err.status = 401;
                return next(err);
            }
            req.session.userId = user._id;
            res.redirect('/users/profile');
        });
    },

    // Ta metoda prikaže osebni profil trenutno prijavljenega uporabnika
    profile: function(req, res,next){
        // Iz seje pridobimo id uporabnika
        UserModel.findById(req.session.userId)
        .exec(function(error, user){
            if(error){
                return next(error);
            } else{
                if(user===null){
                    var err = new Error('Not authorized, go back!');
                    err.status = 400;
                    return next(err);
                } else{
                    return res.render('user/profile', user);
                }
            }
        });  
    },

    logout: function(req, res, next){
        if(req.session){
            req.session.destroy(function(err){
                if(err){
                    return next(err);
                } else{
                    return res.redirect('/');
                }
            });
        }
    },

    // Ta metoda omogoča uporabniku da posodobi svojo profilno sliko
    // Uporablja multer za nalaganje slik
    updateProfilePicture: function(req, res, next) {
        // Preverimo ali je bila slika dejansko poslana
        if (!req.file) {
            const err = new Error('Napaka pri nalaganju slike ali napačen format.');
            err.status = 400;
            return next(err);
        }

        // Pridobimo ID uporabnika iz seje
        const userId = req.session.userId;
        // Sestavimo pot do slike (ki se bo shranila v bazo)
        const imagePath = '/images/avatars/' + req.file.filename; 

        // Posodobimo uporabnikov profil z novo sliko
        UserModel.findByIdAndUpdate(userId, { profilePicturePath: imagePath }, { new: true })
            .exec(function(err, updatedUser) {
                if (err) { return next(err); }
                if (!updatedUser) {
                    const notFoundErr = new Error('Uporabnik ni najden');
                    notFoundErr.status = 404;
                    return next(notFoundErr);
                }
                // Uspešno posodobljeno, preusmeri nazaj na profil
                res.redirect('/users/profile');
            });
    },

    // Ta metoda ti omogoča da prikažemo javni profil drugega uporabnika
    showPublicProfile: function(req, res, next) {
        // Pridobimo ID uporabnika iz URL-ja
        const userId = req.params.id;

        // Poiščemo uporabnika po ID-ju
        UserModel.findById(userId)
            .exec(function(err, user) {
                if (err) { return next(err); }
                if (!user) {
                     const notFoundErr = new Error('Uporabnik ni najden');
                     notFoundErr.status = 404;
                     return next(notFoundErr);
                }
                // Če je vse ok renderiramo pogled z imenom 'publicProfile'
                res.render('user/publicProfile', { profileUser: user }); // Uporabi drugačno ime spremenljivke
            });
    }
};
