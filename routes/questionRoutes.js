var express = require('express');
var router = express.Router();
var questionController = require('../controllers/questionController.js');

// Middleware function to check if user is logged in
function requiresLogin(req, res, next){
    if(req.session && req.session.userId){
        return next();
    } else{
        var err = new Error("You must be logged in to view this page");
        err.status = 401;
        return next(err);
    }
}

router.get('/', questionController.list);
// GET route for showing the new question form - MUST be before /:id
router.get('/new', requiresLogin, questionController.showNewForm);
// GET route for hot questions - MUST be before /:id
router.get('/hot', questionController.listHot);
// GET route for showing a specific question
router.get('/:id', questionController.show);

router.post('/', requiresLogin, questionController.create);



module.exports = router;
