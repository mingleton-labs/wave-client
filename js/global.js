// GLOBAL VARIABLES ------------------------------------------------------------
// const serverDomain = 'http://localhost:4242/';
// const socketServerDomain = 'ws://localhost:4242/';
// const clientDomain = 'http://localhost:5500/';

const serverDomain = 'https://mingleton-py.herokuapp.com/';
const socketServerDomain = 'ws://mingleton-py.herokuapp.com/';
const clientDomain = 'https://mingleton.isaacshea.com/';

const discordID = localStorage.getItem('discordID');
var loaderTimeout;


// PAGE FUNCTIONS --------------------------------------------------------------
/** Reloads the page */
function reloadPage() {
    window.location.reload();
}

/** Toggles fullscreen mode on supported devices */
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
        document.getElementById('fullscreen-button').innerHTML = '<span class="material-icons-round">fullscreen_exit</span> Exit fullscreen';
    } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }

        // Change span icon
        document.getElementById('fullscreen-button').innerHTML = '<span class="material-icons-round">fullscreen</span> Enter fullscreen';
    }    
}

/** Signs out of the current session, clearing all locally-stored variables */
function signOut() { 
    localStorage.clear();

    window.location = './index.html';
}



// SHOW VIEW -------------------------------------------------------------------
function showView(id) { 

    for (item of document.getElementsByClassName('view')) { 
        item.style.display = 'none';
    }

    document.getElementById(id).style.display = 'flex';
}



// LOADERS ---------------------------------------------------------------------
/** Updates the loader
 * @param {'loading' | 'error' | 'done'} type Type of loader to display
 * @param {String} content Content of the loader
 */
function updateLoader(type, content) {
    clearTimeout(loaderTimeout);

    let loader = document.getElementById('master-loader');
    loader.querySelector('p').innerHTML = content;
    console.log(content);

    loader.style.display = 'flex';
    loader.classList.add('show');

    let spinner = loader.querySelector('span');
    spinner.classList = 'material-icons-round';
    spinner.classList.add(type);

    if (type === 'loading') { spinner.innerHTML = 'hourglass_full'; }
    else if (type === 'error') { 
        spinner.innerHTML = 'warning';
        loaderTimeout = setTimeout(hideLoader, 2000);
    } else if (type === 'done') { 
        spinner.innerHTML = 'download_done';
        loaderTimeout = setTimeout(hideLoader, 2000);
    }
}
function hideLoader() { 
    let loader = document.getElementById('master-loader');
    loader.classList.remove('show');
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



// OPEN DRAWER -----------------------------------------------------------------
function openDrawer() {
    // Create a new mobile drawer
    let drawer = getMobileDrawer(0);
    if (drawer) { drawer.show(); } 
}

function closeDrawer() {
    let drawer = getMobileDrawer(0);
    if (drawer) { drawer.hide(); }
}



// OPEN/CLOSE MODAL -------------------------------------------------------------
function openModal(id) { 
    document.getElementById(id).style.display = 'flex';
    document.getElementById(id).classList.remove('hide');

    // Modal-specific commands
    if (id == 'modal-add-song') { 
        let searchInput = document.getElementById('input-search').querySelector('input');
        searchInput.value = '';
        searchInput.focus();
    }
}

function closeModal(id) { 
    document.getElementById(id).classList.add('hide');
    setTimeout(function() { 
        document.getElementById(id).style.display = 'none';
    }, 500);
}