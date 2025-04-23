var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var questionSchema = new Schema({
	'title' : String,
	'description' : String,
	'postedBy' : { // 
	   type: Schema.Types.ObjectId,
	   ref: 'user',
	   required: true 
	},
	'views': { 
          type: Number, 
          default: 0 // Privzeta vrednost naj bo 0
      }
  }, { timestamps: true }); // 

module.exports = mongoose.model('question', questionSchema);
