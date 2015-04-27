var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;

// connect to db to get info for page rendering
var mongo = require('mongodb');
var mongoose = require('mongoose');
var ObjectID = mongo.ObjectID;
var Grid = require('gridfs-stream');
var fs = require('fs');
var db;
var gfs;

mongo.MongoClient.connect('mongodb://localhost:27017/gridfs', function(err, database) {
	if (err) throw err;
	db = database;
	gfs = new Grid(db, mongo);
});

passport.serializeUser(function(user, done) {
  done(null, user._id);
});
 
passport.deserializeUser(function(id, done) {
  db.collection('users').findOne({_id: ObjectID(id)}, function(err, user) {
	done(err, user);
  });
});

passport.use('login', new LocalStrategy ({
	usernameField: 'username',
	passwordField: 'password'
},
function(username, password, done) {
	User.isValidUserPassword(username, password, db, done);
}));

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/login');
}

function ensureAdmin(req, res, next) {
	if (req.user.role == 'Admin') { return next(); };
	res.redirect('/');
}

/* GET home page. */
router.get('/', ensureAuthenticated, function(req, res) {
  db.collection('rels').find({},{event: 1, _id: 0 }).toArray(function(err, data) {
	var events = [],
		i;
	for (i = 0; i < data.length; i++) {
		if (events.indexOf(data[i].event) == -1) {
			events.push(data[i].event);
		}
	}
	res.render('index', { title: 'Home', events: events, user_role: req.user.role });
  });
});

//local submission of email and password
router.get('/login', function(req, res) {
	res.render('login', { title: 'Login', message: req.flash('error') });
});
router.post('/login',
	passport.authenticate('login', {failureRedirect: '/', failureFlash: true}),
	function (req, res) {
		res.redirect('/');
	}
);

router.get('/logout', function(req, res){
	req.logout();
	res.redirect('/login');
});

// admin
router.get('/admin', ensureAuthenticated, ensureAdmin, function(req, res) {
  res.render('admin', { title: 'Admin' });
});

// for rel management
router.get('/managerels', ensureAuthenticated, ensureAdmin, function(req, res) {
	db.collection('rels').find().toArray(function(err, data) {
		res.render('managerels', {
			title: 'Manage rels', 
			data: data.reverse()
		});
	});
});
router.post('/managerels/new', ensureAuthenticated, ensureAdmin, function(req, res) {
	db.collection('rels').insert(JSON.parse(req.body.rel), function(err, data) {
		res.redirect('/managerels');
	});
});
router.get('/managerels/del/:id', ensureAuthenticated, ensureAdmin, function(req, res) {
	db.collection('rels').remove({_id: ObjectID(req.params.id)}, function(err, data) {
		res.redirect('/managerels');
	});
});
router.post('/managerels/edit/:id', ensureAuthenticated, ensureAdmin, function(req, res){
	db.collection('rels').update({_id: ObjectID(req.params.id)}, {$set: {date: req.body.date}}, function(err, data) {
		res.redirect('/managerels');
	});
});

// for file management
router.get('/managefiles', ensureAuthenticated, ensureAdmin, function(req, res) {
	db.collection('fs.files').find({}).toArray(function(err, data) {
		res.render('managefiles', {
			title: 'Manage files', 
			data: data.reverse()
		});
	});
});
router.post('/managefiles/new', ensureAuthenticated, ensureAdmin, function(req, res) {
	var r = res,
		writestream = gfs.createWriteStream({filename: req.body.name});
	console.log(req.body.name, req.files.inputFile.path);
	fs.createReadStream(req.files.inputFile.path).on('end', function() {
		setTimeout(function () {
			r.redirect('/managefiles');
		}, 100);
	  }).on('error', function() {
		res.send('ERR');
	  }).pipe(writestream);
});

// for account management
router.get('/manageusers', ensureAuthenticated, ensureAdmin, function(req, res) {
	db.collection('users').find().toArray(function(err, data) {
		res.render('manageusers', {
			title: 'Manage users', 
			data: data.reverse()
		});
	});
});
router.post('/manageusers/new', ensureAuthenticated, ensureAdmin, function(req, res, next) {
	User.hashPassword(req.body.password, function(err, data) {
		if(err) throw err;
		data.username = req.body.username;
		data.role = req.body.role;
		db.collection('users').insert(data, function(err, data) { 
			res.redirect('/manageusers');
		});
	});
});
router.get('/manageusers/del/:id', ensureAuthenticated, ensureAdmin, function(req, res) {
	db.collection('users').remove({_id: ObjectID(req.params.id)}, function(err, data) {
		res.redirect('/manageusers');
	});
});

// get timeline json data to display
router.get('/timelinedata/:event/:date/:countries', ensureAuthenticated, function(req, res) {
	var timeline = {
		headline: "Video comparisons for '" + req.params.event + "'",
		type: "default",
		text: "<p>Any information about video sources/whatever</p>",
		asset: {
			credit: "",
			caption: ""
		},
		date: [],
		era: []
	}, 
	countries = [],
	dates = [],
	dateCounts = [],
	params = {},
	tags,
	timelinedate,
	index;
	if (req.params.countries != 'all') {
		countries = req.params.countries.split(',');
		params.countries = { $in: countries };
	}
	params.event = req.params.event;

	// query for info
	db.collection('rels').find(params).sort({ type: 1 }).toArray(function(err, data) {
		// make timeline obj
		for (i = 0; i < data.length; i++) {
			index = dates.indexOf(data[i].date);
			if (index == -1) {
				 timelinedate = {
					startDate: data[i].date,
					endDate: data[i].date,
					headline: "<img src='../../../images/" + data[i].screencap_id + "'>" + [].concat.apply([], data[i].tags).join(' '),
					text: "<div class='row clipInfo NoDisplay'>Clip Info</div><div class='row others NoDisplay'>Others</div><div class='row videoDifferences'>",
					tag: "",
					classname: data[i].date,
					asset: {
						thumbnail: "../../../images/" + data[i].screencap_id
					}
				}
				if (req.params.countries != 'all') {
					temp = [];
					for (j = 0; j < data[i].countries.length; j++) {
						if (countries.indexOf(data[i].countries[j]) != -1) {
							temp.push(data[i].countries[j]);
						}
					}
					data[i].countries = temp;
				}
				if (data[i].countries.length != 1) {
					timelinedate.tag = "Shared"
				} else {
					timelinedate.tag = data[i].countries[0].toString();
				}
				dates.push(data[i].date);
				dateCounts.push([0,0,0]);
				timeline.date.push(timelinedate);
				index = dates.indexOf(data[i].date);
			} else {
				// if the previous one was not common, override some attributes
				if (data[i].countries.length != 1 && timeline.date[index].tag != "Shared") {
					timeline.date[index].tag = "Shared";
					timeline.date[index].asset.thumbnail = "../../../images/" + data[i].screencap_id;
					timeline.date[index].headline = "<img src='../../../images/" + data[i].screencap_id + "'>";
				}
			}
			for (j = 0; j < data[i].countries.length; j++) {
				// tracking which countries
				if (countries.indexOf(data[i].countries[j]) == -1) {
					countries.push(data[i].countries[j]);
				}
			}
			if (data[i].type == 'common') {
				dateCounts[index][0] += 1;
				data[i].type = 'Common ' + dateCounts[index][0];
			} else {
				dateCounts[index][1] += 1;
				data[i].type = 'Diff ' + dateCounts[index][1];
			}
		}
		// prettify tags for each rel and add to text
		for (i = 0; i < data.length; i++) {
			index = dates.indexOf(data[i].date);
			if (dateCounts[index][2] % 4 == 0) {
				timeline.date[index].text += "<div class='col-md-1 labels'><div class='row'>";
				for (j = 0; j < countries.length; j++) {
					timeline.date[index].text += "<div class='col-md-12 tags'><h5>" + countries[j] + "</h5></div>";
				}
				timeline.date[index].text += "</div></div>";
			}
			timeline.date[index].text += "<div class='col-md-2 rel'><div class='row'><div class='col-md-12'><h4>" + data[i].type + "</h4></div><div class='col-md-12'><img class='videoTrigger' data-toggle='modal' data-target='.video-modal' video-type='" + data[i].type + "' video-src='" + data[i].video_id + "' video-period='#t=" + data[i].video_start + "," + data[i].video_end + "' src='../../../images/" + data[i].screencap_id + "'></div>";
			tags = [];
			for (j = 0; j < countries.length; j++) {
				tag = { country: countries[j] };
				index = data[i].countries.indexOf(countries[j]);
				if (index == -1) {
					tag.tags = '-';
				} else {
					tag.tags = data[i].tags[index].join(' ');
					if (tag.tags == '') {
						tag.tags = 'No tags detected';
					}
				}
				index = dates.indexOf(data[i].date);
				timeline.date[index].text += "<div class='col-md-12 tags'><h5>" + tag.tags + "</h5></div>";
				tags.push(tag);
			}
			timeline.date[index].text += "</div></div>";
			dateCounts[index][2]++;
			if (dateCounts[index][2] % 4 == 0) {
				timeline.date[index].text += "<div class='clearfix'></div>"
			}
			data[i].tags = tags;
			data[i].countries = data[i].countries.join(', ');
		}
		// close div tags
		for (i = 0; i < timeline.date.length; i++) {
			timeline.date[i].text += "</div>";
		}
		res.json({timeline: timeline});
	});
});

router.get('/timeline/:event_name/:date/:countries', ensureAuthenticated, function(req, res) {
	var datereq = req.params.date.replace('-', '/').replace('-', '/'),
		slide = 0,
		dates = [];
	db.collection('rels').find({event: req.params.event_name}).sort({ date: 1 }).toArray(function(err, data) {
		// figure out what slide to start on
		for (i = 0; i < data.length; i++) {
			if (dates.indexOf(data[i].date) == -1) {
				if (datereq == data[i].date) {
					slide = i + 1;
					break;
				}
				dates.push(data[i].date);
			}
		}
		if (slide == 0) {
			console.log('no matching date');
			console.log(dates, datereq);
		}
		res.render('timeline', {
			title: 'Timeline', 
			event: req.params.event_name,
			date: req.params.date,
			countries: req.params.countries,
			slide: slide
		});
	});
});

// for displaying image
router.get('/images/:id', ensureAuthenticated, function(req, res) {
	var readstream;
	res.writeHead(200, {
		'Content-Type': 'image/jpg'
	});
	readstream = gfs.createReadStream({_id: req.params.id});
	readstream.pipe(res);
});

// for streaming video
router.get('/videos/:id', ensureAuthenticated, function(req, res) {
	db.collection('fs.files').findOne(new ObjectID(req.params.id), function(err, data) {
		var range = req.headers.range;
		var parts = range.replace(/bytes=/, "").split("-");
		var partialstart = parts[0];
		var partialend = parts[1];
		var start = parseInt(partialstart, 10);
		var end = partialend ? parseInt(partialend, 10) : data.length - 1;
		var chunksize = (end-start) + 1;
		var readstream = gfs.createReadStream({_id: req.params.id, range: {startPos: start, endPos: end }});
		res.openstream = readstream;
		res.writeHead(206, {
			'Content-Type': 'video/mp4',
			'X-Content-Type-Options': 'nosniff',
			'Accept-Ranges': 'bytes',
			'Content-Length': data.length,
			'Content-Range': 'bytes ' + start + '-' + end + '/' + data.length
		});
		readstream.pipe(res);
	});
});

module.exports = router;
