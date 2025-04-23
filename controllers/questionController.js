var QuestionModel = require('../models/questionModel.js');
var AnswerModel = require('../models/answerModel.js'); // Added require for AnswerModel
var UserModel = require('../models/userModel.js'); // Dodan model uporabnika

module.exports = {

    // Ta funckija pridobi vsa vprašanja iz baze in jih razvrsti po datumu
    list: function (req, res, next) { 
        // Poiščimo vsa vpršanja in jih razvrstimo po datumu
        QuestionModel.find() 
            .populate('postedBy')
            .sort({ createdAt: -1 }) 
            .exec(function (err, questions) {
                if (err) {
                    console.error("Napaka pri pridobivanju vprašanj:", err);
                    return next(err); 
                }
                // Renderiraj view in pošlji pridobljena vprašanja v pogled list
                res.render('question/list', { questions: questions });
            });
    },


    // Ta funckija pridobi eno vprašanje in vse odogovore na to vprašanje sprejeti odgovor se prikaže prvi
    show: function (req, res, next) { 
        // Dobimo id vprašanja iz URL-ja
        var id = req.params.id;

        // Poiščemo vprašanje po id-ju
        QuestionModel.findOne({_id: id})
            .populate('postedBy') 
            .exec(function (err, question) {
                if (err) {
                    console.error("Napaka pri iskanju vprašanja:", err);
                    return next(err); 
                }
                if (!question) {
                    const notFoundErr = new Error('Vprašanje ni najdeno');
                    notFoundErr.status = 404;
                    return next(notFoundErr);
                }

                // Povečaj števec ogledov (ne čakamo na rezultat, lahko teče v ozadju)
                QuestionModel.updateOne({ _id: id }, { $inc: { views: 1 } }).exec();

                // Ko imamo vprašanje poiščemo še odgovore na to vprašanje
                AnswerModel.find({ question: id })
                    .populate('postedBy') 
                    .sort({ isAccepted: -1, createdAt: 1 })
                    .exec(function (errAnswers, answers) {
                        if (errAnswers) {
                            console.error("Napaka pri iskanju odgovorov:", errAnswers);
                            return next(errAnswers); 
                        }
                        
                        // Preveri, ali je prijavljeni uporabnik avtor vprašanja
                        let isQuestionAuthor = false; 
                        if (req.session.userId && question.postedBy) { // Dodatno preveri, če question.postedBy obstaja
                            isQuestionAuthor = req.session.userId.toString() === question.postedBy._id.toString();
                        }

                        // Renderiramo predlogo 'question/show' in ji posredujemo vprašanje in odgovore
                        res.render('question/show', { 
                            question: question, 
                            answers: answers,
                            isQuestionAuthor: isQuestionAuthor
                        });
                    });
            });
    },

    /**
     * questionController.showNewForm() - Nova funkcija za prikaz obrazca
     */
    showNewForm: function(req, res, next) {
      // Render the view for the new question form
      res.render('question/new');
    },

    // Metoda ki ustvari novo vprašanje in ga shrani v bazo
    create: function (req, res, next) { 

        // Ustvarimo novo vprašanje z uporabo podatkov iz obrazca
        var question = new QuestionModel({
			title : req.body.title,
			description : req.body.description,
            postedBy: req.session.userId
        });

        // Shranimo vprašanje v bazo MongoDB
        question.save(function (err, savedQuestion) { 
            if (err) {
                console.error("Napaka pri shranjevanju vprašanja:", err);
                return next(err); 
            }
            
            // Povečaj števec vprašanj za uporabnika (inc je povečanje za 1)
            UserModel.findByIdAndUpdate(req.session.userId, { $inc: { questionsCount: 1 } }).exec();
            
            // Če je vse vredu preusmerimo uporabnika na seznam vprašanj
            return res.redirect('/questions');
        });
    },


    /**
     * questionController.listHot() - Nova funkcija za vroča vprašanja
     */
    listHot: function (req, res, next) {
        // zraven Pridobimo vsa vprašanja iz baze in avtorje
        QuestionModel.find()
            .populate('postedBy')
            .exec(function (err, questions) {
                if (err) {
                    console.error("Napaka pri pridobivanju vprašanj:", err);
                    return next(err);
                }

                // Iz vseh vprašanj naredimo seznam ID-jev da jih uporabimo za iskanje odgovorov
                const questionIds = questions.map(q => q._id);
                
                // Aggregacija: za vsako vprašanje preštej število odgovorov
                AnswerModel.aggregate([
                    { $match: { question: { $in: questionIds } } },
                    { $group: { _id: "$question", count: { $sum: 1 } } }
                ]).exec(function(errCount, answerCounts) {
                    if (errCount) {
                        console.error("Napaka pri štetju odgovorov:", errCount);
                        return next(errCount);
                    }

                    // Naredimo slovar (mapo) kjer je ključ ID vprašanja in vrednost število odgovorov
                    const answerCountMap = {};
                    answerCounts.forEach(item => {
                        answerCountMap[item._id] = item.count;
                    });

                    // Izračunamo hottnes za vsako vprašanje
                    const enhancedQuestions = questions.map(question => {
                        const q = question.toObject();
                        // Vzemi število odgovorov iz mape ali 0, če ni odgovorov
                        q.answerCount = answerCountMap[q._id] || 0;
                        // Formula : število ogledov + 5 * število odgovorov
                        q.hotness = (q.views || 0) + (5 * q.answerCount);
                        return q;
                    });

                    // Razvrsti vprašanja po hotness (najbolj vroča naprej)
                    enhancedQuestions.sort((a, b) => b.hotness - a.hotness);

                    // Renderiramo pogled za vroča vprašanja
                    res.render('question/hot', { questions: enhancedQuestions });
                });
            });
    }
};
