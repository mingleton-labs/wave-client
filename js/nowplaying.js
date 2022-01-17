let currentSong = null;

// LOAD PAGE --------------------------------------------------------------
function loadPage() { 

    // Check if signed in
    if (localStorage.getItem('userID') === null) {
        // Add a 'signed-out' tag to the page
        document.getElementsByTagName('body')[0].classList.add('signed-out');
    } else {
        // Update avatar image
        document.getElementById('avatar-square').style.backgroundImage = 'url(' + localStorage.getItem('avatarURL') + ')';
    }

    updatePage();

    // Detect an enter press on the search input
    document.getElementById('queue-search').querySelector('input').addEventListener('keyup', function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            addToQueue();
        }
    });

    // Set a timeout to get now playing info every second
    setInterval(updatePage, 1000);
}

function updatePage() {

    // Get the queue
    fetch(serverDomain + 'queue')
        .then(response => response.json())
        .then(queue => {

            // Use the first item on the queue to fill out the now playing section
            let currentItem = queue.queue[0];
            if (currentItem) { 
                currentSong = currentItem.id;
                document.getElementById('record-image').style.backgroundImage = 'url(' + currentItem.thumbnail_url + ')';

                // Update the now playing section
                document.getElementById('player-title').innerHTML = currentItem.name;
                document.getElementById('player-artist').innerHTML = currentItem.artist + ' • @' + currentItem.user;
                document.getElementById('player-length').innerHTML = normaliseMinutes(currentItem.duration);

                let slider = document.getElementById('player-slider');
                slider.max = currentItem.duration;
            }

            if (queue.isPlaying && !queue.isPaused) { 
                document.getElementById('record').classList.add('playing');

                // Update the play/pause button
                document.getElementById('player-play-button').querySelector('span').innerHTML = 'pause';
            }

            // Update the queue section
            if (queue.isLooping) { 
                document.getElementById('loop-button').querySelector('span').innerHTML = 'repeat_on';
            }

            // Update the queue list
            let queueList = document.getElementById('queue-list');
            queueList.innerHTML = '';

            // Remove first item
            queue.queue.shift();

            if (queue.queue.length == 0) { 
                queueList.innerHTML = '<p>No songs in queue</p>';

                // Update queue duration
                document.getElementById('queue-duration').querySelector('p').innerHTML = '0 items, 00:00mins.';
            } else {

                let i = 1;
                let totalDuration = 0;
                for (item of queue.queue) { 
                    totalDuration += item.duration;

                    let queueItem = document.createElement('div');
                    queueItem.classList.add('queue-item');

                    let contentVertical = document.createElement('div');
                    contentVertical.classList.add('content-vertical');
                    queueItem.appendChild(contentVertical);

                    let h4 = document.createElement('h4');
                    h4.innerHTML = item.name;
                    contentVertical.appendChild(h4);

                    let p = document.createElement('p');
                    p.innerHTML = item.artist + ' • @' + item.user;
                    contentVertical.appendChild(p);

                    let sep1 = document.createElement('div');
                    sep1.classList.add('sep', 'vertical');
                    queueItem.appendChild(sep1);

                    let p2 = document.createElement('p');
                    p2.innerHTML = normaliseMinutes(item.duration);
                    queueItem.appendChild(p2);

                    let binButton = document.createElement('button');
                    binButton.classList.add('button', 'icon', 'secondary', 'signed-in-only');
                    binButton.innerHTML = '<span class="material-icons-round">delete</span>';
                    let binButtonID = i;
                    binButton.onclick = function() {
                        removeFromQueue(binButtonID);
                    };
                    queueItem.appendChild(binButton);

                    queueList.appendChild(queueItem);
                    i++;
                }

                // Update queue duration
                document.getElementById('queue-duration').querySelector('p').innerHTML = queue.queue.length + ' items, ' + normaliseMinutes(totalDuration) + 'mins.';
            }

            // Update the history section
            let historyList = document.getElementById('history-list');
            historyList.innerHTML = '';

            if (queue.history.length == 0) {
                historyList.innerHTML = '<p>No songs in history</p>';

                // Update queue duration
                document.getElementById('history-duration').querySelector('p').innerHTML = '0 items, 00:00mins.';
            } else {

                let totalDuration = 0;
                for (item of queue.history) {
                    totalDuration += item.duration;

                    let queueItem = document.createElement('div');
                    queueItem.classList.add('queue-item');

                    let contentVertical = document.createElement('div');
                    contentVertical.classList.add('content-vertical');
                    queueItem.appendChild(contentVertical);

                    let h4 = document.createElement('h4');
                    h4.innerHTML = item.name;
                    contentVertical.appendChild(h4);

                    let p = document.createElement('p');
                    p.innerHTML = item.artist + ' • @' + item.user;
                    contentVertical.appendChild(p);

                    let sep1 = document.createElement('div');
                    sep1.classList.add('sep', 'vertical');
                    queueItem.appendChild(sep1);

                    let p2 = document.createElement('p');
                    p2.innerHTML = normaliseMinutes(item.duration);
                    queueItem.appendChild(p2);

                    let binButton = document.createElement('button');
                    binButton.classList.add('button', 'icon', 'secondary', 'signed-in-only');
                    binButton.innerHTML = '<span class="material-icons-round">playlist_add</span>';
                    let binButtonID = item.id;
                    binButton.onclick = function() {
                        addToQueue(binButtonID);
                    };
                    queueItem.appendChild(binButton);

                    historyList.appendChild(queueItem);
                }

                // Update queue duration
                document.getElementById('history-duration').querySelector('p').innerHTML = queue.history.length + ' items, ' + normaliseMinutes(totalDuration) + 'mins.';
            }
        });

    // Get now playing from server
    fetch(serverDomain + 'nowPlaying')
        .then(response => response.json())
        .then(nowPlaying => {

            // Update the now playing section
            if (nowPlaying.song && nowPlaying.song.id != currentSong) { reloadPage(); return }

            // Update slider
            document.getElementById('player-slider').value = nowPlaying.durationTime;
            document.getElementById('player-timestamp').innerHTML = normaliseMinutes(nowPlaying.durationTime);

            // Update play/pause button
            if (nowPlaying.isPlaying && !nowPlaying.isPaused) {
                document.getElementById('record').classList.add('playing');
                document.getElementById('player-play-button').querySelector('span').innerHTML = 'pause';
            } else {
                document.getElementById('record').classList.remove('playing');
                document.getElementById('player-play-button').querySelector('span').innerHTML = 'play_arrow';
            }
        });

}



// PLAYER FUNCTIONS -------------------------------------------------------
function playPause() {
    fetch(serverDomain + 'playpause', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userID: localStorage.getItem('userID'),
        })
    }).then(response => {
        if (response.status == 404) {
            createAlert('Unable to play/pause', 'An error occurred.');
        } else if (response.status == 401) { 
            createAlert('Unable to play/pause', 'You must be signed in & in a voice channel.');
        }
    });
}

function skip() {
    fetch(serverDomain + 'skip', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userID: localStorage.getItem('userID'),
        })
    }).then(response => {
        if (response.status == 404) {
            createAlert('Unable to skip', 'An error occurred.');
        } else if (response.status == 401) { 
            createAlert('Unable to skip', 'You must be signed in & in a voice channel.');
        }
    });
}

function rewind() { 
    fetch(serverDomain + 'rewind', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userID: localStorage.getItem('userID'),
        })
    }).then(response => {
        if (response.status == 404) {
            createAlert('Unable to rewind', 'An error occurred.');
        } else if (response.status == 401) { 
            createAlert('Unable to rewind', 'You must be signed in & in a voice channel.');
        }
    });
}

function shuffleQueue() { 
    fetch(serverDomain + 'shuffle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userID: localStorage.getItem('userID'),
        })
    }).then(response => {
        if (response.status == 404) {
            createAlert('Unable to shuffle queue', 'An error occurred.');
        } else if (response.status == 401) { 
            createAlert('Unable to shuffle queue', 'You must be signed in & in a voice channel.');
        } else if (response.status == 200) {
            createAlert('Shuffled queue');
        }
    });
}

function toggleLoop() { 
    fetch(serverDomain + 'loop/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userID: localStorage.getItem('userID'),
        })
    }).then(response => {
        if (response.status == 404) {
            createAlert('Unable to loop', 'An error occurred.');
        } else if (response.status == 401) { 
            createAlert('Unable to loop', 'You must be signed in & in a voice channel.');
        } else if (response.status == 200) {
            reloadPage();
        }
    });
}

function addToQueue(itemName) { 

    updateLoader('Adding song to queue...');

    // Get inputs 
    let name = document.getElementById('queue-search').querySelector('input').value || itemName;

    if (!name) { console.log ('nothing to send'); return; }

    document.getElementById('queue-search').querySelector('input').value = '';

    // Send request
    fetch(serverDomain + 'play/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            term: name,
            userID: localStorage.getItem('userID')
        })
    }).then(response => {
        hideLoader();

        if (response.status == 404) {
            createAlert('Unable to add to queue', 'An error occurred.');
        } else if (response.status == 401) { 
            createAlert('Unable to add to queue', 'You must be signed in & in a voice channel.');
        } else if (response.status == 200) {
            createAlert('success', 'Added to queue!');
        }
    });
}

function removeFromQueue(itemID) { 

    updateLoader('Removing from playlist...');

    fetch(serverDomain + 'removeFromQueue/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            index: itemID,
            userID: localStorage.getItem('userID')
        })
    }).then(response => {
        hideLoader();

        if (response.status == 404) {
            createAlert('Unable to remove from queue', 'An error occurred.');
        } else if (response.status == 401) { 
            createAlert('Unable to remove from queue', 'You must be signed in & in a voice channel.');
        } else if (response.status == 200) {
            createAlert('success', 'Removed from queue!');
        }
    });
}

function stopPlaying() { 
    fetch(serverDomain + 'stopPlaying', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userID: localStorage.getItem('userID')
        })
    }).then(response => {
        if (response.status == 404) {
            createAlert('Unable to stop playing', 'An error occurred.');
        } else if (response.status == 401) { 
            createAlert('Unable to stop playing', 'You must be signed in & in a voice channel.');
        } else if (response.status == 200) {
            createAlert('success', 'Stopped playing!');
        }
    });
}



// QUEUE / HISTORY FUNCTIONS ----------------------------------------------
function switchQueue() { 
    document.getElementById('history-list').style.display = 'none';
    document.getElementById('queue-list').style.display = 'flex';

    document.getElementById('queue-button').classList.add('contained');
    document.getElementById('history-button').classList.remove('contained');

    document.getElementById('history-duration').style.display = 'none';
    document.getElementById('queue-duration').style.display = 'flex';
}

function switchHistory() { 
    document.getElementById('history-list').style.display = 'flex';
    document.getElementById('queue-list').style.display = 'none';

    document.getElementById('history-button').classList.add('contained');
    document.getElementById('queue-button').classList.remove('contained');

    document.getElementById('history-duration').style.display = 'flex';
    document.getElementById('queue-duration').style.display = 'none';
}