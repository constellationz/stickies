// Port for the web app
const port = 8080;

const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const path = require('path');

// start express
const app = express();

// use cors
app.use(cors());

// make sure we can decode posts
const jsonParser = bodyParser.json();
const urlParser = bodyParser.urlencoded({ extended: false });

// Notes are stored in a global hash map
let numposts = 0;
let allposts = {};

// Get an unused hash
function getNewHash() {
	var id = '0';
	while (allposts[id] != null)
		id = id = crypto.randomBytes(20).toString('hex');
	return id;
}

// Respond to get request
function getPosts(req, res) {
	let postlist = [];
	for (const posthash in allposts) 
		postlist.push(allposts[posthash])
	console.log("returning list", postlist);
	res.json(postlist);
}
app.get('/getposts/', jsonParser, getPosts);
app.get('/getposts/', urlParser, getPosts);

// Show the client hello world on the website
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Print when listening
app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});

// Respondto post request
function post(req, res) {
	console.log("got request for", req.body);

	// make our note
	const hash = getNewHash();
	const note = {
		message: req.body.message,
		x: req.body.x,
		y: req.body.y,
		colorindex: Math.floor(Math.random() * 100),
		zindex: numposts,
		hash: hash,
	}

	// insert & save
	numposts++;
	allposts[hash] = note;
	res.json(note);
}
app.post('/post', jsonParser, post);
app.post('/post', urlParser, post);

