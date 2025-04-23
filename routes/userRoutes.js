var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');
var multer = require('multer');
var path = require('path');
var fs = require('fs');

// Ustvarimo mapo za avatarje, če še ne obstaja
const avatarsPath = path.join(__dirname, '..', 'public', 'images', 'avatars');
if (!fs.existsSync(avatarsPath)) {
  fs.mkdirSync(avatarsPath, { recursive: true });
  console.log('Ustvarjena mapa za avatarje: ' + avatarsPath);
}

// Nastavi destinacijo in poimenovanje datotek
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/avatars'); // Mapa za shranjevanje avatarjev
  },
  filename: function (req, file, cb) {
    // Uporabi ID uporabnika in originalno končnico za unikatno ime
    const uniqueSuffix = req.session.userId + '-' + Date.now(); 
    const extension = file.mimetype.split('/')[1];
    cb(null, uniqueSuffix + '.' + extension);
  }
});

// Filter za dovoljene tipe datotek (samo slike)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Naložite lahko samo slike!'), false);
  }
};

var upload = multer({ storage: storage, fileFilter: fileFilter });

// Middleware za preverjanje prijave (če še ne obstaja)
function requiresLogin(req, res, next){
    if(req.session && req.session.userId){
        return next();
    } else{
        var err = new Error("You must be logged in to perform this action.");
        err.status = 401;
        return next(err);
    }
}

router.get('/register', userController.showRegister);
router.get('/login', userController.showLogin);
router.get('/profile', userController.profile);
router.get('/logout', userController.logout);
router.get('/view/:id', userController.showPublicProfile); // Dodana nova pot za javni profil

router.post('/', userController.create);
router.post('/login', userController.login);

// Dodaj novo pot za nalaganje profilne slike (pred /:id)
router.post('/profile/picture', requiresLogin, upload.single('profileImage'), userController.updateProfilePicture);


module.exports = router;
