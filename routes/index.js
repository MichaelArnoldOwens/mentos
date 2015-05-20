var express = require('express');
var router = express.Router();
var GoogleSpreadsheet = require("google-spreadsheet");
var _ = require('underscore');
var moment = require('moment');
var http = require('http');
var curl = require('node-curl');



var allTrackSlotsPage = 7;
var trackSlotPage = 6;
var engPage = 5;
var growthPage = 4;
var salesPage = 3;
var pdPage = 2;
var allTrackPage = 1;

//the google sheet we're using
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var my_sheet = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

my_sheet.setAuth(process.env.EMAIL, process.env.GOOGLE_PASSWORD, function() {});	

/* GET pages. */
router.get('/mentors/eng', ensureAuthenticated, function(req, res, next) {
		// spreadsheet key is the long id in the sheets URL 
		my_sheet.getRows(trackSlotPage, function(err, allSlots) {
			getAllSlots(err, allSlots, engPage, res, "eng");

		});
});

router.get('/mentors/pd', ensureAuthenticated, function(req, res, next) {
		// spreadsheet key is the long id in the sheets URL 
		my_sheet.getRows(trackSlotPage, function(err, allSlots) {
			getAllSlots(err, allSlots, pdPage, res, "pd");

		});
});

router.get('/mentors/sales', ensureAuthenticated, function(req, res, next) {
		// spreadsheet key is the long id in the sheets URL 
		my_sheet.getRows(trackSlotPage, function(err, allSlots) {
			getAllSlots(err, allSlots, salesPage, res, "sales");

		});
});

router.get('/mentors/growth', ensureAuthenticated, function(req, res, next) {
		// spreadsheet key is the long id in the sheets URL 
		my_sheet.getRows(trackSlotPage, function(err, allSlots) {
			getAllSlots(err, allSlots, growthPage, res, "growth");

		});
});

router.get('/mentors/', ensureAuthenticated, function(req, res, next) {
		// spreadsheet key is the long id in the sheets URL 
		my_sheet.getRows(allTrackSlotsPage, function(err, allSlots) {
			//debugging
			// console.log("ALL SLOTS")
			// console.log(allSlots)
			getAllSlots(err, allSlots, allTrackPage, res, "all");
		});
});

//calendar event creation

router.get('/mentors/add_event', ensureAuthenticated, function(req, res, next) {
	//old code to post automatically [not working]
	// var calendarId = 'test'
	// console.log('this is add_event');
	// var options = {
 //  host: 'www.googleapis.com',
 //  path: '/calendar/v3/calendars/' + calendarId + '/events',
 //  port: '80',
 //  rejectUnauthorized: false,
 //  requestCert: true,
 //  secureOptions: require('constants').SSL_OP_NO_TLSv1_2,
 //  agent: false,
 //  //This is the only line that is new. `headers` is an object with the headers to request
 //  method: 'POST'
	// };
	// callback = function(response){
		
	//   var str = ''
	//   response.on('data', function (chunk) {
	//     str += chunk;
	//   });

	//   response.on('end', function () {
	//     console.log(str);
	//   });
	// }

	// var req = http.request(options, callback);
	// req.on('error', function(e) {
	// 	console.log(e.message);
	// });
	// req.end();

	// new code redirects to google calendar invite




});

///////authentication routes////////////

//login page
router.get('/login', function(req, res, next) {
  res.send('Welcome! <a href="/auth/google"> Login with Google </a>')
});

//login fail route
router.get('/login_fail', function(req, res){
  res.send('login failed! please <a href="/auth/google">log in using your tradecrafted email</a>');
});


//logout
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/logged_out');
});

router.get('/logged_out', function(req, res){ 
	res.send('Logged out!');
});

function ensureAuthenticated(req, res, next) {  
    if (req.isAuthenticated() && req.user['_json'].domain == "tradecrafted.com") { return next(); }
    res.redirect('/auth/google');
}

//////////////////////////////////////////////////////////////

function getAllSlots(err, allSlots, responsePage, res){
		var trackTimeSlots = [];

		//grab all the date/time slots from the original spreadsheet
		for ( var i = 0; i < allSlots.length; i++){
			var time = new Date(allSlots[i]['datetime']);
			if (new Date() < time) {
				trackTimeSlots.push(moment(time).format('llll'));
			}
		}

		var options = {
			orderby: "datetime"
		}

		my_sheet.getRows(responsePage, options, function(err, allMentors){
			//debugging
			// console.log("$$$$$$$$$$GETTING ROWS \n \n\n")
			// console.log(allMentors)
			getMentorSlotObject(trackTimeSlots, allMentors, res);
		});
}

function getMentorSlotObject(trackTimeSlots, allMentors, res){

		//ordered list of mentors

		var pastMentors = [];
		var upcoming = [];

		for(var i = 0; i < allMentors.length; i++){
			var mentorTime = new Date(allMentors[i]['datetime']);

			//reformat date to be prettier
			allMentors[i]['datetime'] = moment(mentorTime).format("lll");
			allMentors[i]['datetimeCalendar'] = moment(mentorTime).format("YYYYMMDDTHHMMSS") + "Z/" + moment(mentorTime).add(1, 'hours').format("YYYYMMDDTHHMMSS")
			//debug code
			// console.log('$$$$$$$$$$$$$$$$$$$$$')
			// console.log(mentorTime)
			// console.log(allMentors[i]['datetimeCalendar'])
			// console.log('%%%%%%%%%%%%%%%%%%%%%')
			// console.log(allMentors[i]['datetime'])
			
			var slotIndex = trackTimeSlots.indexOf(mentorTime.toString());

			//separate mentors by past and upcoming
			if (mentorTime > new Date()) {
				upcoming.push(allMentors[i]);
			}
			else {
				pastMentors.push(allMentors[i]);
			}

			//remove taken slots from list of slots
			if (slotIndex > -1){
			 	trackTimeSlots.splice(slotIndex, 1);
			}
		}

		res.render('index', { title: 'Mentos' , upcoming: upcoming, slots: trackTimeSlots.reverse(), past: pastMentors.reverse()});
}

module.exports = router;