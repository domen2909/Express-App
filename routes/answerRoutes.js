var express = require('express');
var router = express.Router();
var answerController = require('../controllers/answerController.js');

// Middleware function to check if user is logged in
// (Copied from questionRoutes.js or define it centrally and import)
function requiresLogin(req, res, next){
    if(req.session && req.session.userId){
        return next();
    } else{
        var err = new Error("You must be logged in to perform this action.");
        err.status = 401; // Unauthorized
        return next(err);
    }
}

router.post('/', requiresLogin, answerController.create);

router.post('/:id/accept', requiresLogin, answerController.acceptAnswer);

module.exports = router;
