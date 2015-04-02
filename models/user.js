var hash = require('../hash');
var mongoose = require('mongoose');

//Database schema models
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var User = new Schema( {
    username: { type: String, default: '' }
  , salt: { type: String, default: ''}
  , hash: { type: String, default: ''}
  , role: { type: String, default: ''}
});

User.statics.hashPassword = function(password, done){
	var User = this;
	hash(password, function(err, salt, hash){
		if(err) throw err;
		done(null, {salt: salt, hash: hash});
	});
}

User.statics.isValidUserPassword = function(username, password, db, done) {
	db.collection('users').findOne({username: username}, function(err, user){
		if(err) return done(err);
		if(!user) return done(null, false, { message : 'Incorrect username.' });
		hash(password, user.salt, function(err, hash){
			if(err) return done(err);
			if(hash == user.hash) return done(null, user);
			return done(null, false, {
				message : 'Incorrect password'
			});
		});
	});
};

var User = mongoose.model('User', User);
module.exports = User;