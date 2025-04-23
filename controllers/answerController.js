var AnswerModel = require('../models/answerModel.js');
var UserModel = require('../models/userModel.js'); // Dodan model uporabnika

module.exports = {

    // Ta funckija shrani odgovor na obstoječe vprašanje
    create: function (req, res, next) { 
        // Ustvarimo nov objekt tipa AnswerModel
        var answer = new AnswerModel({
			content : req.body.content,
            question: req.body.questionId, 
            postedBy: req.session.userId,  
			isAccepted : false
        });

        // Shrani odgovor v bazo
        answer.save(function (err, savedAnswer) { 
            if (err) {
                console.error("Napaka pri shranjevanju odgovora:", err);
                return next(err); 
            }
            
            // Povečaj števec odgovorov za uporabnika
            UserModel.findByIdAndUpdate(req.session.userId, { $inc: { answersCount: 1 } }).exec();
            
            // Preusmerimo nazaj na prikaz vprašanj
            return res.redirect('/questions/' + req.body.questionId); 
        });
    },

    // Ta funckija označi odgovor kot sprejet od avtorja vprašanja
    acceptAnswer: function(req, res, next) {
        // Preberemo ID odgovora iz URL-ja (/answers/:id/accept)
        const answerId = req.params.id;
        const userId = req.session.userId;

        // Poiščemo odogovor po ID-ju in zraven napolnimo vprašanje
        AnswerModel.findById(answerId)
            .populate('question') 
            .exec(function(err, answer) {
                if (err) { return next(err); }
                if (!answer) {
                    const notFoundErr = new Error('Odgovor ni najden');
                    notFoundErr.status = 404;
                    return next(notFoundErr);
                }

                // Preverimo ali je prijavljen uporabnik dejasnko avtor vprašanja
                if (!answer.question || !userId || answer.question.postedBy.toString() !== userId.toString()) {
                    const forbiddenErr = new Error('Nimate dovoljenja za sprejem tega odgovora.');
                    forbiddenErr.status = 403; 
                    return next(forbiddenErr);
                }
                
                // Če je odogovor že označen kot sprejet ne naredimo nič
                if (answer.isAccepted) {
                    return res.redirect('/questions/' + answer.question._id);
                }

                // Poiščemo obstoječi sprejeti odgovor in ga nastavimo na false
                AnswerModel.findOneAndUpdate(
                    { question: answer.question._id, isAccepted: true }, 
                    { $set: { isAccepted: false } }, 
                    { new: false } 
                ).exec(function(errUpdateOld, oldAnswer) {
                    if (errUpdateOld) { 
                        console.error("Error resetting old accepted answer:", errUpdateOld);
                    }
                    
                    // Označimo trenutni odgovor kot sprejet
                    answer.isAccepted = true;
                    answer.save(function(errSave, savedAnswer) {
                        if (errSave) { return next(errSave); }
                        
                        // Vse ok preusmerimo nazaj na vprašanje
                        res.redirect('/questions/' + answer.question._id);
                    });
                });
            });
    }
};
