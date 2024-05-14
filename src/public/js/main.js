const colors = [
    ["#FF7EB9", "white"],
    ["#FF65A3", "white"],
    ["#7AFCFF", "black"],
    ["#FEFF9C", "black"],
    ["#FFF740", "black"],
];

const canvasx = 1000;
const canvasy = 1000;
const maxmessagelen = 3000;
const textinput = document.getElementById("input");
const preview = document.getElementById("preview");
const button = document.getElementById("submit");
const starty = textinput.getBoundingClientRect().bottom;
const defaulttext = textinput.placeholder;
const numboxes = 10;
let biggestz = 1;
let sendingmessage = false;

// Set the title!!
document.title = 'notary';

textinput.addEventListener("keyup", function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
        submit();
        return false;
    }
})
button.addEventListener("click", function(event) {
    event.preventDefault();
    submit();
})

initTextInput();
moveRandomly(preview);
textinput.addEventListener('input', handleinput);
textinput.addEventListener('propertychange', handleinput);
handleinput(textinput);
drag(preview);

// load notes
jQuery.get('/getposts/', (posts) => {
    console.log('got posts');
    for (let i = 0; i < posts.length; i++) {
        const note = addNote(posts[i]);
        drag(note, postmove)
        raise(preview);
    }
})

/**
 * Post a move to the server
 * @param {Element} note 
 * @param {number} x 
 * @param {number} y 
 */
function postmove(note, x, y) {
    let hash = note.getAttribute('hash');
    fetch('/move/', {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({
            x: x,
            y: y,
            hash: hash,
        })
    })
}

/**
 * 
 * @param {string} message 
 * @param {number} x 
 * @param {number} y 
 * @param {elementCallback} callback 
 */
function post(message, x, y, callback) {
    fetch('/post/', {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({
            x: x,
            y: y,
            message: message,
        })
    })
    .then(res => res.json())
    .then(data => callback(data))
}

function initTextInput() {
    textinput.value = "";
}

function random(bottom, range) {
    return Math.floor(Math.random() * range + bottom);
}

function moveRandomly(note) {
    note.style.top = random(starty + 50, 100) + 'px';
    note.style.left = random(50, 100) + 'px';
}

function getDragPosition() {
    const rect = preview.getBoundingClientRect();
    const x = rect.left;
    const y = rect.top;
    return [x, y];
}

function getTextInput() {
    return textinput.value;
}

function submit() {
    // Make sure the message is valid
    let message = getTextInput();
    if (message.length < 1) {
        alert("Can't post an empty message");
        return;
    }
    if (message.length > maxmessagelen) {
        alert(`Can't post a message of length ${maxmessagelen} or more`);
        return;
    }
    let dragpos = getDragPosition();
    post(message, dragpos[0], dragpos[1], (res) => {
        let newnote = addNote(res);
        drag(newnote, postmove);
        raise(newnote);
        raise(preview);
        const rect = newnote.getBoundingClientRect();
        preview.style.top = rect.top + newnote.clientHeight + 'px';
        preview.style.left = rect.left;
        initTextInput();
    })
}

// Whenever the user enters input update the preview box
function handleinput(e) {
    raise(preview);
    text = getTextInput() === "" ? defaulttext : textinput.value;
    preview.innerHTML = text;
}

function drag(element, endcallback) {
    let x0 = 0; y0 = 0;

    element.onmousedown = dragMouseDown
    element.ontouchstart = dragMouseDown

    function dragMouseDown(e) {
        e.preventDefault();
        e = e || window.event;
        x0 = element.clientX;
        y0 = element.clientY;
        raise(element);
        document.onmouseup = closeDragElement;
        document.onmousemove = mousedrag;
        document.ontouchmove = touchdrag;
        document.ontouchcancel = closeDragElement;
        document.ontouchend = closeDragElement;
        document.ontouchforcechange = closeDragElement;
    }

    function moveto(x, y) {
        const finalX = x0 - x;
        const finalY = y0 - y;
        x0 = x;
        y0 = y;
        element.style.left = (element.offsetLeft - finalX) + "px";
        element.style.top = (element.offsetTop - finalY) + "px";
    }

    function touchdrag(e) {
        touch = e.changedTouches[0];
        moveto(touch.clientX, touch.clientY);
    }

    function mousedrag(e) {
        e.preventDefault();
        moveto(e.clientX, e.clientY);
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchmove = null;
        document.ontouchcancel = null;
        document.ontouchend = null;
        document.ontouchforcechange = null;
        if (endcallback) {
            endcallback(element, element.offsetLeft, element.offsetTop);
        }
    }
}

function raise(element) {
    biggestz++;
    element.style["z-index"] = biggestz;
}

function randInt(lower, upper) {
    let min = Math.ceil(lower);
    let max = Math.floor(upper);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addNote(note) {
    console.log("Adding note", note);

    // Here are the values
    const message = note.message;
    const x = note.x;
    const y = note.y;
    const hash = note.hash
    const zindex = note.zindex;
    const colorindex = note.colorindex;

    // Get colors
    const mod = colorindex % colors.length;
    const background = colors[mod][0];
    const color = colors[mod][1];

    // Make sticky
    const box = document.createElement("note");
    box.id = "note" + hash;
    box.style.top = Math.max(starty, y) + 'px';
    box.style.left = x + 'px';
    box.style["z-index"] = zindex;
    box.style.color = color;
    box.style.background = background;
    box.setAttribute("hash", hash);
    box.setAttribute("drag", 1);
    box.setAttribute("note", 1);
    box.setAttribute("textDisplay", 1);

    // Add the text
    const textnode = document.createTextNode(message);
    box.appendChild(textnode);

    // Put in boxes
    const boxes = document.getElementById("boxes");
    boxes.appendChild(box);

    return box;
}