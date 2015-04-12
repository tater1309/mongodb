var http = require("http"),
	express = require("express"),
	bodyParser = require("body-parser"),
	mongodb = require("mongodb"),
	app, mongodbClient;

//create a 4 digit shortened URL
function getShortURL () {
	//base 36 characters
	var alphanumeric = ['0','1','2','3','4','5','6','7','8','9','A','B',
						'C','D','E','F','G','H','I','J','K','L','M','N',
						'O','P','Q','R','S','T','U','V','W','X','Y','Z'];
	var urlString = "http://localhost:3000/";
	for (i = 0; i < 4; i++) {
		var num = randomNum(0,35);
		urlString = urlString + alphanumeric[num];
	}

	return urlString;
}

//get random number
function randomNum (low, high) {
	return Math.floor(Math.random() * (high - low + 1) + low);
}

//redirect inputted short url
function redirectURL (collection, url, res) { 
	console.log(url);

	collection.findOne({short : url}, function(err, item) {
		if(!err) {
			if (item !== null) {
				collection.update({short : url}, {$inc: {  count: 1} });
				res.redirect(item.long);
			}
			else {
				res.redirect("http://localhost:3000/");
			}
		}
	});
}

//make connection to db
function connectDB(process, url, res) {
	var mongourl = "mongodb://localhost/shorturl";
	mongodbClient.connect(mongourl, function(err, db) {
		if(err) {
			return console.dir(err);
		}
		var collection = db.collection('urls');
		process(collection, url, res);
	});
}

//insert long/short url into db
var insertURL = function(collection, longurl, res) { 
	var shorturl, doc;

	shorturl = getShortURL();	
	doc = {long: longurl, short: shorturl, count: 0};

	collection.insert(doc, {w:1}, function(err, result) {
		if(!err) {
			res.json({"returnURL":shorturl});
		}
	}); 
};

//search for item in db
var findURL = function(collection, url, res) {
	//see if passed url is a shortened url
	if (url.indexOf("http://localhost:3000/") > -1) {
		collection.findOne({short : url}, function(err, item) {
			if(!err) {
				if (item !== null) {
					//return found long url
					res.json({"returnURL":item.long});
				}
				else {
					//return that short URL not found
					res.json({"returnURL":"Shortened URL not found"});
				}
			}
		});
	}
	else {
		collection.findOne({long : url}, function(err, item) {
			if(!err) {
				if (item !== null) {
					//return found short url
					res.json({"returnURL":item.short});
				}
				else {
					//insert long/short url and return short url
					connectDB(insertURL, url, res);
				}
			}
		});
	}
};

var getTopTen = function(collection, url, res) {
	collection.aggregate([
		//sort
		{$sort: {count: -1}},

		//get top ten
		{$limit: 10}
	], function(err, topten) {
		if (topten !== null) {
			//return top ten
			res.json(topten);
		}
	});
};

//create mongodb client
mongodbClient = mongodb.MongoClient;

app = express();
http.createServer(app).listen(3000);

app.use(express.static(__dirname + "/client"));
app.use(bodyParser.urlencoded({extended: false}));

app.get("/*", function (req, res) {
	if (req.param(0) === "displayTopTen") {
		connectDB(getTopTen, 0, res);
	}
	else {
		var sendtourl = "http://localhost:3000/" + req.param(0);
		connectDB(redirectURL, sendtourl, res);
	}
	
});

app.post("/geturl", function (req, res) {
	var urlinfo = req.body;
	connectDB(findURL, urlinfo.url, res);
});

console.log("Server is listening at http://localhost:3000/");