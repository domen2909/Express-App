var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var answerSchema = new Schema({
	'content' : String,
	'isAccepted' : Boolean,
	'postedBy' : { // 
	   type: Schema.Types.ObjectId,
	   ref: 'user',
	   required: true 
	},
	'question' : { // 
	   type: Schema.Types.ObjectId,
	   ref: 'question',
	   required: true 
	}
  }, { timestamps: true }); // 

module.exports = mongoose.model('answer', answerSchema);
