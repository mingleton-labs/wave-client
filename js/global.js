// GLOBAL VARIABLES ------------------------------------------------------------
const serverDomain = 'http://localhost:4242/';
const clientDomain = 'http://localhost:5500/client/'


// RELOAD PAGE -----------------------------------------------------------------
function reloadPage() {
    window.location.reload();
}



// TOGGLE FULLSCREEN -----------------------------------------------------------
function toggleFullScreen() {
    if ((document.fullScreenElement && document.fullScreenElement !== null) ||
        (!document.mozFullScreen && !document.webkitIsFullScreen)) {
        if (document.documentElement.requestFullScreen) {
            document.documentElement.requestFullScreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullScreen) {
            document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }

        // Change span icon
        document.getElementById('fullscreen-button').querySelector('span').innerHTML = 'fullscreen_exit';
    } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }

        // Change span icon
        document.getElementById('fullscreen-button').querySelector('span').innerHTML = 'fullscreen';
    }    
}



// SHOW VIEW -------------------------------------------------------------------
function showView(id) { 

    for (item of document.getElementsByClassName('view')) { 
        item.style.display = 'none';
    }

    document.getElementById(id).style.display = 'flex';
}



// LOADER ----------------------------------------------------------------------
function updateLoader(content) {
    let loader = document.getElementById('loader');
    loader.style.display = 'flex';
    loader.querySelector('p').innerHTML = content;

    console.log('DEBUG: ' + content);
}
function hideLoader() { 
    let loader = document.getElementById('loader');
    loader.style.display = 'none';
}



// HELPER FUNCTIONS ------------------------------------------------------------
function capitalize(string) { 
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateUUID() {
    // This function will generaete a random temporary UUID that the server detects & overrides.
    // It's categorised by two dashes at the beginning.
    return '--xxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function createLoader(parent) { 
    let loader = document.createElement('div');
    loader.classList.add('loader');

    let span = document.createElement('span');
    span.classList.add('material-icons-round');
    span.innerHTML = 'hourglass_full';

    loader.appendChild(span);
    parent.appendChild(loader);
    return loader;
}

function createAlert(title, message, timeout) { 
    let alert = new Ph_Alert({
        title: title,
        text: message,
        timeout: timeout
    });
    alert.instantiate();
    alertObject = alert;
}

function normaliseNumber(number, digits) { 
    // Make a fixed-length number to the number of digits
    // If a number has less digits, it will be padded with zeros

    let string = number.toString();
    let length = string.length;

    if (length < digits) {
        for (let i = 0; i < digits - length; i++) {
            string = '0' + string;
        }
    }

    return string;
}

function normaliseMinutes(calcSeconds) {
    // Converts seconds to hours, minutes and seconds
    let hours = Math.floor(calcSeconds / 3600);
    let minutes = Math.floor((calcSeconds - (hours * 3600)) / 60);
    let seconds = calcSeconds - (hours * 3600) - (minutes * 60);

    if (hours > 0) {
        return normaliseNumber(hours, 2) + ':' + normaliseNumber(minutes, 2) + ':' + normaliseNumber(seconds, 2);
    } else {
        return normaliseNumber(minutes, 2) + ':' + normaliseNumber(seconds, 2);
    }
}



// [ TABLET & MOBILE ] OPEN DRAWER ---------------------------------------------
function openDrawer() {
    // Create a new mobile drawer
    let drawer = getMobileDrawer(0);
    if (drawer) { drawer.show(); } 
}

function closeDrawer() {
    let drawer = getMobileDrawer(0);
    if (drawer) { drawer.hide(); }
}