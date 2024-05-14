// index.js
// Backend for notary

// Port for the web app
const PORT = process.env.npm_config_port;
if (PORT === undefined) {
	console.log("The server requires a port to be hosted on. Pass the command-line argument --port=8000 to host on port 8000.");
	return -1;
}

const bodyParser = require("body-parser");
const { assert } = require("console");
const cors = require("cors");
const crypto = require('crypto');
const express = require('express');
const path = require('path');

// For decoding posts of various types
const jsonParser = bodyParser.json();
const urlParser = bodyParser.urlencoded({ extended: false });

// Notes are stored in a hash map
let numposts = 0;
let allposts = {};

const app = express();
app.use(cors());
app.use('/static', express.static(path.join(__dirname, '../public')));

// Show the webpage
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Print when listening
app.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});

// Respond to get request
function getPosts(req, res) {
	let postlist = [];
	for (const posthash in allposts) 
		postlist.push(allposts[posthash])
	res.json(postlist);
}
app.get('/getposts/', jsonParser, getPosts);
app.get('/getposts/', urlParser, getPosts);

// Respond to move posts 
function move(req, res) {
	console.log("moved note", req.body);

	// Get request values
	const hash = req.body.hash;
	const x = req.body.x;
	const y = req.body.y;

	// Let users move the note if the hash exists
	if (allposts[hash]) {
		const note = allposts[hash];
		note.x = x;
		note.y = y;
	}

}
app.post('/move', jsonParser, move);
app.post('/move', urlParser, move);

function getNewNoteHash() {
	var id = '0';
	while (allposts[id] != null)
		id = crypto.randomBytes(20).toString('hex');
	return id;
}

// Respond to message posts
function post(req, res) {
	console.log("got request for", req.body);

	// Make our note
	const hash = getNewNoteHash();
	const note = {
		message: req.body.message,
		x: req.body.x,
		y: req.body.y,
		colorindex: Math.floor(Math.random() * 100),
		zindex: numposts,
		hash: hash,
	}

	// Insert & save
	numposts++;
	allposts[hash] = note;
	res.json(note);
}
app.post('/post', jsonParser, post);
app.post('/post', urlParser, post);

