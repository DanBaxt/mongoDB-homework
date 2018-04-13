var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var db = require("./models/index.js");

app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static('public'));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);


app.get('/', function (req, res) {
    res.send(index.html);
});
app.get('/scrape', function (req, res) {
    request('http://www.echojs.com/', function (error, response, html) {
        console.log(html);
        var $ = cheerio.load(html);
        $('article h2').each(function (i, element) {

            var result = {};

            result.title = $(this).children('a').text();
            result.link = $(this).children('a').attr('href');

            var entry = new db.Article(result);

            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    return res.json(err);

                });
        });
    });
    res.send("Scrape Complete");
});

app.get('/articles', function (req, res) {
    db.Article.find({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});


app.get('/articles/:id', function (req, res) {
    db.Article.findOne({ '_id': req.params.id })
        .populate('note')
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.json(doc);
            }
        });
});


app.post('/articles/:id', function (req, res) {
    var newNote = new Note(req.body);

    newNote.save(function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            db.Article.findOneAndUpdate({ '_id': req.params.id }, { 'note': doc._id })
                .exec(function (err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send(doc);
                    }
                });

        }
    });
});








app.listen(3000, function () {
    console.log('App running on port 3000!');
});