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

// connects to db
mongo.MongoClient.connect('mongodb://localhost:27017/gridfs', function(err, database) {
	if (err) throw err;
	db = database;
	gfs = new Grid(db, mongo);
});

// ues for handling sessions
// passport.serializeUser(function(user, done) {
//   done(null, user._id);
// });
// passport.deserializeUser(function(id, done) {
//   db.collection('users').findOne({_id: ObjectID(id)}, function(err, user) {
// 	done(err, user);
//   });
// });
// passport.use('login', new LocalStrategy ({
// 	usernameField: 'username',
// 	passwordField: 'password'
// },
// function(username, password, done) {
// 	//User.isValidUserPassword(username, password, db, done);
// }));

// use to make sure logged in
function ensureAuthenticated(req, res, next) {
	///* if (req.isAuthenticated()) {*/  /*}*/
	return next();
	//res.redirect('/login');
}

// use to check if admin or not
function ensureAdmin(req, res, next) {
	if (true/*req.user.role == 'Admin'*/) { return next(); };
	res.redirect('/');
}

// get home page and list events
router.get('/', ensureAuthenticated, function(req, res) {
  db.collection('rels').find({},{event: 1, _id: 0 }).toArray(function(err, data) {
	var events = [],
		i;
	for (i = 0; i < data.length; i++) {
		if (events.indexOf(data[i].event) == -1) {
			events.push(data[i].event);
		}
	}
	res.render('index', { title: 'Home', events: events, user_role: 'Admin' /*'req.user.role'*/ });
  });
});

// local submission of email and password
router.get('/login', function(req, res) {
	res.render('login', { title: 'Login', message: req.flash('error') });
});
router.post('/login',
	passport.authenticate('login', {failureRedirect: '/', failureFlash: true}),
	function (req, res) {
		res.redirect('/');
	}
);

// log out
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
	var updateobj = {
		event: req.body.event,
		date: req.body.date,
		type: req.body.type,
		countries: JSON.parse(req.body.countries),
		tags: JSON.parse(req.body.tags),
		video_id: req.body.videoid,
		video_start: JSON.parse(req.body.videostart),
		video_end: JSON.parse(req.body.videoend),
		screencap_id: req.body.screencapid
	}
	db.collection('rels').update({_id: ObjectID(req.params.id)}, {$set: updateobj}, function(err, data) {
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
	fs.createReadStream(req.files.inputFile.path).on('end', function() {
		setTimeout(function () {
			r.redirect('/managefiles');
		}, 100);
	  }).on('error', function() {
		res.send('ERR');
	  }).pipe(writestream);
});
router.get('/managefiles/del/:id', ensureAuthenticated, ensureAdmin, function(req, res) {
	gfs.remove({_id: ObjectID(req.params.id)}, function(err, data) {
		res.redirect('/managefiles');
	});
});
router.post('/managefiles/edit/:id', ensureAuthenticated, ensureAdmin, function(req, res){
	var updateobj = {
		filename: req.body.name
	};
	db.collection('fs.files').update({_id: ObjectID(req.params.id)}, {$set: updateobj}, function(err, data) {
		res.redirect('/managefiles');
	});
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

	// make params for query of specific countries rather than all countries
	if (req.params.countries != 'all') {
		countries = req.params.countries.split(',');
		params.countries = { $in: countries };
	}
	// param for event query
	params.event = req.params.event;

	// query for info
	db.collection('rels').find(params).sort({ type: 1 }).toArray(function(err, data) {
		// first find out what 'all' countries are if dealing with all
		if (req.params.countries == 'all') {
			for (i = 0; i < data.length; i++) {
				for (j = 0; j < data[i].countries.length; j++) {
					// tracking which countries
					if (countries.indexOf(data[i].countries[j]) == -1) {
						countries.push(data[i].countries[j]);
					}
				}
			}
		}

		// go through each rel and create timeline object for it
		for (i = 0; i < data.length; i++) {
			// need only one object for each date, so we must track all of the dates
			index = dates.indexOf(data[i].date);
			// if the date hasn't been seen yet, create a new object
			if (index == -1) {
				// track the date
				dates.push(data[i].date);
				dateCounts.push([0,0,0]);	// tracks [commons,diffs,commons + diffs]
				index = dates.indexOf(data[i].date);
				//initialize the object
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
				// if we are looking for specific countries only we go through this rels countries array
				// and get rid of the countries we do not want from it
				if (req.params.countries != 'all') {
					temp = [];
					for (j = 0; j < data[i].countries.length; j++) {
						if (countries.indexOf(data[i].countries[j]) != -1) {
							temp.push(data[i].countries[j]);
						}
					}
					data[i].countries = temp;
				}
				// if there is more than 1 country, it belongs to the 'Shared' tag and is rendered as a large
				// image on the timeline, otherwise it belongs to a specific coutnry
				if (data[i].countries.length != 1) {
					timelinedate.tag = "Shared"
				} else {
					timelinedate.tag = data[i].countries[0].toString();
				}
				// push this date object to the full timeline object
				timeline.date.push(timelinedate);
			// otherwise the date has been seen, we will extend the previously created object
			} else {
				// if the previous object was not common, override some attributes
				if (data[i].countries.length != 1 && timeline.date[index].tag != "Shared") {
					timeline.date[index].tag = "Shared";
					timeline.date[index].asset.thumbnail = "../../../images/" + data[i].screencap_id;
					timeline.date[index].headline = "<img src='../../../images/" + data[i].screencap_id + "'>";
				}
			}
			// track what number commonality or difference it is
			if (data[i].type == 'common') {
				dateCounts[index][0] += 1;
				data[i].type = 'Common ' + dateCounts[index][0];
			} else {
				dateCounts[index][1] += 1;
				data[i].type = 'Diff ' + dateCounts[index][1];
			}
		}

		// prettify tags for each rel and add html to text
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

		// send json object
		res.json({timeline: timeline});
	});
});

// get actual timeline page and figures out which slide to start on if date is specified
router.get('/timeline/:event_name/:date/:countries', ensureAuthenticated, function(req, res) {
	var datereq = req.params.date.replace('-', '/').replace('-', '/'),
		slide = 0,
		dates = [];
	if (req.params.date != 'all') {
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
			res.render('timeline', {
				title: 'Timeline',
				event: req.params.event_name,
				date: req.params.date,
				countries: req.params.countries,
				slide: slide
			});
		});
	} else {
		res.render('timeline', {
			title: 'Timeline',
			event: req.params.event_name,
			date: req.params.date,
			countries: req.params.countries,
			slide: slide
		});
	}
});

// for serving images
router.get('/images/:id', ensureAuthenticated, function(req, res) {
	var readstream;
	res.writeHead(200, {
		'Content-Type': 'image/jpg'
	});
	readstream = gfs.createReadStream({_id: req.params.id});
	readstream.pipe(res);
});

// for serving the coclustering data
router.get('/display', ensureAuthenticated, function(req, res) {
	res.render('display', {
		title: 'Coclustering data',
	});
});

router.get('/cocluster/vivagraph', ensureAuthenticated, function(req, res) {
	res.render('v_vivagraph');
});

router.get('/cocluster/highchart', ensureAuthenticated, function(req, res) {
	res.render('v_highchart');
});

router.get('/cocluster/histogram', ensureAuthenticated, function(req, res) {
	res.render('v_histogram');
});

// for serving the coclustering data
router.get('/vivatest', ensureAuthenticated, function(req, res) {
	res.render('vivatest', {
		title: 'Vivagraph data',
	});
});

// for streaming video
router.get('/videos/:id', ensureAuthenticated, function(req, res) {
	db.collection('fs.files').findOne(new ObjectID(req.params.id), function(err, data) {
		var range = req.headers.range,
			parts = range.replace(/bytes=/, "").split("-"),
			partialstart = parts[0],
			partialend = parts[1],
			start = parseInt(partialstart, 10),
			end = partialend ? parseInt(partialend, 10) : data.length - 1,
			chunksize = (end-start) + 1,
			readstream = gfs.createReadStream({_id: req.params.id, range: {startPos: start, endPos: end }});
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
