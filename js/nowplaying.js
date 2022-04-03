// VARIABLES --------------------------------------------------------------
var socketConnection;
var currentSongInfo;
var addPlaylistSong;
var queueItems = [];
var historyItems = [];

// LOAD PAGE --------------------------------------------------------------
function loadPage() { 

    // Check if signed in
    if (discordID === null) {       // DiscordID is stored locally & retrieved in global.js
        // Redirect to login page
        window.location = './index.html';
        return;
    }

    updateLoader('loading', 'Loading page...');
    setPageDefault();

    // Detect an enter press on the search input
    document.getElementById('input-search').querySelector('input').addEventListener('keyup', function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            searchForSongs();
        }
    });

    // Fetch user information
    fetch(serverDomain + 'user-info/?discordID=' + discordID)
    .then(response => {
        if (response.status === 400 || response.status === 404) { window.location = './index.html'; return; }
        
        return response.json();
    }).then(userInfo => {
        if (!userInfo) { return; }

        console.log(userInfo);

        // Update avatar
        document.getElementById('avatar-square').style.backgroundImage = 'url(' + userInfo.avatar + ')';
    });

    // Fetch the queue
    fetch(serverDomain + 'queue/?discordID=' + discordID)
    .then(response => { 
        console.log(response);

        // Clear the history & queue
        const queueList = document.getElementById('queue-list');
        const historyList = document.getElementById('history-list');

        queueList.innerHTML = '';
        historyList.innerHTML = '';

        // Check for errors
        if (response.status !== 200) { 
            updateLoader('error', 'An error occurred when loading the queue (error ' + response.status + ').');

            // Disable the queue/history selector
            document.getElementById('queue-history-selector').style.display = 'none';

            // Show an error message
            document.getElementById('queue-duration').querySelector('p').innerHTML = 'Something went wrong.. Try reloading this page, but if the issue persists let @zaccomode know.';

            return;
        }

        return response.json();
    }).then(queueInfo => {
        if (!queueInfo) { return; }
        console.log(queueInfo);

        updateLoader('loading', 'Loading the queue...');

        // Update the loop button
        if (queueInfo.isQueueLooping) { 
            document.getElementById('loop-button').querySelector('span').innerHTML = 'repeat_on';
        }

        // Remove the first queue item (it's currently playing)
        queueItems = queueInfo.queue.slice();
        historyItems = queueInfo.history.slice();
        queueInfo.queue.shift();

        let totalQueueLength = 0
        if (queueItems[0]) { totalQueueLength += parseInt(queueItems[0].duration); }

        // Add items to the queue
        for (item of queueInfo.queue) { 
            totalQueueLength += parseInt(item.duration);
            createQueueItem(item, false); 
        }

        // Update the queue duration
        document.getElementById('queue-duration').querySelector('p').innerHTML = (queueInfo.queue.length + 1) + ' items, ' + normaliseMinutes(totalQueueLength);

        // Add items to the history
        let totalHistoryLength = 0;
        for (item of queueInfo.history) { 
            totalHistoryLength += parseInt(item.duration);
            createQueueItem(item, true); 
        }

        // Update the history duration
        document.getElementById('history-duration').querySelector('p').innerHTML = queueInfo.history.length + ' items, ' + normaliseMinutes(totalHistoryLength);

        updateLoader('done', 'Page loaded!');
    })

    // Establish a websocket connection
    let url = socketServerDomain + 'websocket/?discordID=' + discordID

    try { socketConnection = new WebSocket(url); }
    catch (err) { 
        updateLoader('error', 'Unable to establish a websocket connection. Please try again.');
        console.log(err);
        return;
    }

    // Handoff
    socketConnected();
}



// PAGE FUNCTIONS ---------------------------------------------------------
/** Creates a queue item with the given Song object
 * @param {Object} itemInfo Song object info
 * @param {Boolean} isHistoryItem Whether to append this to the queue or history
 */
function createQueueItem(itemInfo, isHistoryItem) {

    let queueItem = document.createElement('div');
    queueItem.classList.add('queue-item');
    queueItem.id = 'qi-' + itemInfo.itemID;

    // if (!isHistoryItem) {   // Non-history items can be dragged
    //     queueItem.draggable = true;

    //     let dragIndicator = document.createElement('span');
    //     dragIndicator.classList.add('material-icons-round', 'drag-indicator');
    //     dragIndicator.innerHTML = 'drag_indicator';
    //     queueItem.appendChild(dragIndicator);
    // }

    let contentVertical = document.createElement('div');
    contentVertical.classList.add('content-vertical');
    queueItem.appendChild(contentVertical);

    let h4 = document.createElement('h4');
    h4.innerHTML = itemInfo.name;
    contentVertical.appendChild(h4);

    let p = document.createElement('p');
    p.innerHTML = itemInfo.artist + ' • @' + itemInfo.username + ' • ' + normaliseMinutes(itemInfo.duration);
    contentVertical.appendChild(p);

    let addPlaylistButton = document.createElement('button');
    addPlaylistButton.classList.add('button', 'icon');
    addPlaylistButton.innerHTML = '<span class="material-icons-round">queue</span>';
    addPlaylistButton.onclick = function() { 
        addPlaylistSong = itemInfo;
        showAddPlaylistModal();
    }
    queueItem.appendChild(addPlaylistButton);

    if (!isHistoryItem) { 
        let deleteButton = document.createElement('button');
        deleteButton.classList.add('button', 'icon');
        deleteButton.innerHTML = '<span class="material-icons-round">delete</span>';
        deleteButton.onclick = function() { queueRemove(itemInfo.queuePosition); }
        queueItem.appendChild(deleteButton);
    }

    if (isHistoryItem) {
        let queueButton = document.createElement('button');
        queueButton.classList.add('button', 'icon');
        queueButton.innerHTML = '<span class="material-icons-round">playlist_add</span>';
        queueButton.onclick = function() { addToQueue(itemInfo.youtubeUrl); }
        queueItem.appendChild(queueButton);
    }

    if (!isHistoryItem) { 
        document.getElementById('queue-list').appendChild(queueItem);
    } else { 
        document.getElementById('history-list').appendChild(queueItem);
    }
}

/** Creates a search result item with the given Song object */
function createSearchReult(itemInfo) { 

    let searchResult = document.createElement('div');
    searchResult.classList.add('search-result');

    let resultImage = document.createElement('div');
    resultImage.classList.add('search-result-image');
    resultImage.style.backgroundImage = 'url(' + itemInfo.thumbnailUrl + ')';
    searchResult.appendChild(resultImage);

    let contentVertical = document.createElement('content-vertical');
    contentVertical.classList.add('content-vertical');
    searchResult.appendChild(contentVertical);

    let h4 = document.createElement('h4');
    h4.innerHTML = itemInfo.name;
    contentVertical.appendChild(h4);

    let p = document.createElement('p');
    p.innerHTML = itemInfo.artist + ' • ' + normaliseMinutes(itemInfo.duration);
    contentVertical.appendChild(p);

    let button = document.createElement('button');
    button.classList.add('button', 'secondary', 'contained');
    button.innerHTML = 'Add to queue';
    let buttonUrl = itemInfo.url
    button.onclick = function() { addToQueue(buttonUrl); closeAddSongModal(); }
    contentVertical.appendChild(button);

    document.getElementById('search-results').appendChild(searchResult);
}

/** Switches to the queue view */
function switchQueue() { 
    document.getElementById('history-list').style.display = 'none';
    document.getElementById('queue-list').style.display = 'flex';

    document.getElementById('queue-button').classList.add('contained');
    document.getElementById('history-button').classList.remove('contained');

    document.getElementById('history-duration').style.display = 'none';
    document.getElementById('queue-duration').style.display = 'flex';
}

/** Switches to the history view */
function switchHistory() { 
    document.getElementById('history-list').style.display = 'flex';
    document.getElementById('queue-list').style.display = 'none';

    document.getElementById('history-button').classList.add('contained');
    document.getElementById('queue-button').classList.remove('contained');

    document.getElementById('history-duration').style.display = 'flex';
    document.getElementById('queue-duration').style.display = 'none';
}

/** Resets the page to it's default configuration */
function setPageDefault() {
    // Update the player
    document.getElementById('record-image').style.backgroundImage = 'url(./content/images/record-empty-state.png)';
    document.getElementById('record').classList.remove('playing');

    document.getElementById('player-title').innerHTML = 'Nothing is playing!';
    document.getElementById('player-artist').innerHTML = 'Add something to get started';

    document.getElementById('player-timestamp').innerHTML = normaliseMinutes(0);
    document.getElementById('player-length').innerHTML = normaliseMinutes(0);

    let slider = document.getElementById('player-slider');
    slider.max = 100;
    slider.value = 0;

    let playButton = document.getElementById('player-play-button');
    playButton.querySelector('span').innerHTML = 'stop';
    playButton.disabled = true;

    // Remove all items from the queue
    queueItems = [];
    document.getElementById('queue-list').innerHTML = '';
    document.getElementById('queue-duration').querySelector('p').innerHTML = '0 items, ' + normaliseMinutes(0);
}

/** Close the add song modal */
function closeAddSongModal() { 
    closeModal('modal-add-song');

    // Clear search bar
    document.getElementById('input-search').querySelector('input').value = '';

    // Remove the results
    let searchResultsContainer = document.getElementById('search-results');
    searchResultsContainer.innerHTML = '';

    // Add template results
    let i = 1;
    while (i < 10) { 
        let searchResult = document.createElement('div');
        searchResult.classList.add('search-result', 'empty');
        searchResultsContainer.appendChild(searchResult);

        i++;
    }
}



// SOCKET CONNECTION ------------------------------------------------------
function socketConnected() {
    if (socketConnection) { 
        socketConnection.onopen = function (event) { 
            console.log('Opened connection with websocket. Awaiting connection validity response...');
            console.log(event);
        }

        // Handle websocket events
        socketConnection.onmessage = function (event) {
            const data = JSON.parse(event.data);
            console.log(data);

            if (data.event === 'connection') {                  // Connection validity response sent
                if (data.status === 200) { 
                    updateLoader('done', 'Connected to websocket!');
                } else {
                    updateLoader('error', 'Something went wrong while connecting to the websocket.')
                }
            } else if (data.event === 'connections-updated') {  // A connection has been updated
                document.getElementById('connection-count').innerHTML = normaliseNumber(data.content.connectionCount, 2);
            } else if (data.event === 'playback-updated') {     // Playback has been updated

                // Check if is paused or playing
                let playButton = document.getElementById('player-play-button');
                if (!data.content.isPlayerActive) { 
                    playButton.querySelector('span').innerHTML = 'stop';
                    playButton.disabled = true;
                } else { 
                    playButton.disabled = false;
                    if (!data.content.isPaused) { 
                        playButton.querySelector('span').innerHTML = 'pause';
                    } else {
                        playButton.querySelector('span').innerHTML = 'play_arrow';
                    }
                }

                // Update the loop button
                if (data.content.isQueueLooping) { 
                    document.getElementById('loop-button').querySelector('span').innerHTML = 'repeat_on';
                } else { 
                    document.getElementById('loop-button').querySelector('span').innerHTML = 'repeat';
                }

                // Update record
                if (data.content.isPlayerActive && !data.content.isPaused) { 
                    document.getElementById('record').classList.add('playing');
                } else {
                    document.getElementById('record').classList.remove('playing');
                }

                // Find the currently-playing song
                currentSongInfo = queueItems.find(i => i.itemID === data.content.itemID);

                // Check if this item is on the queue list
                let queueItem = document.getElementById('qi-' + data.content.itemID);
                if (queueItem) { 
                    queueItem.parentNode.removeChild(queueItem); 
                }

                if (currentSongInfo) {      // The websocket can connect before the queue is found

                    // Update the now playing section
                    document.getElementById('record-image').style.backgroundImage = 'url(' + currentSongInfo.thumbnailUrl + ')'

                    document.getElementById('player-title').innerHTML = currentSongInfo.name;
                    document.getElementById('player-artist').innerHTML = currentSongInfo.artist + ' • @' + currentSongInfo.username;

                    document.getElementById('player-timestamp').innerHTML = normaliseMinutes(data.content.playbackDuration);
                    document.getElementById('player-length').innerHTML = normaliseMinutes(currentSongInfo.duration);

                    let slider = document.getElementById('player-slider');
                    slider.max = currentSongInfo.duration;
                    slider.value = data.content.playbackDuration;

                    // Update the total length, etc.
                    let totalDuration = 0;
                    for (item of queueItems) { totalDuration += parseInt(item.duration); }
                    document.getElementById('queue-duration').querySelector('p').innerHTML = queueItems.length + ' items, ' + normaliseMinutes(totalDuration);
                }
            } else if (data.event === 'playback-stopped') {     // Playback has completely stopped

                setPageDefault();

            } else if (data.event === 'queue-item-added') {     // An item has been added
                
                // Add to the queue list
                if (!data.content.isHistory) { queueItems.push(data.content.itemInfo); }
                else { historyItems.push(data.content.itemInfo); }

                // Show the item
                if (queueItems.length > 1) {     // The first item added to the queue will always play
                    createQueueItem(data.content.itemInfo, data.content.isHistory);

                    // Update the total length, etc.
                    let totalDuration = 0;
                    if (!data.content.isHistory) { 
                        for (item of queueItems) { totalDuration += parseInt(item.duration); }
                        document.getElementById('queue-duration').querySelector('p').innerHTML = queueItems.length + ' items, ' + normaliseMinutes(totalDuration);
                    } else { 
                        for (item of historyItems) { totalDuration += parseInt(item.duration); }
                        document.getElementById('history-duration').querySelector('p').innerHTML = historyItems.length + ' items, ' + normaliseMinutes(totalDuration);
                    }
                }
            } else if (data.event === 'queue-item-removed') {   // An item has been removed

                // Find the item in the queueItems
                console.log(queueItems);
                let item = queueItems.find(i => i.itemID === data.content.itemID);
                console.log(item);
                if (!item) { return; }
                queueItems.splice(queueItems.indexOf(item), 1);

                // Remove this object from the queue list
                let queueItem = document.getElementById('qi-' + data.content.itemID);
                if (!queueItem) { return; }
                queueItem.parentNode.removeChild(queueItem);

                // Update the total length, etc.
                let totalDuration = 0;
                for (item of queueItems) { totalDuration += parseInt(item.duration); }
                document.getElementById('queue-duration').querySelector('p').innerHTML = queueItems.length + ' items, ' + normaliseMinutes(totalDuration);
            } 

        }
    }
}



// PLAYBACK FUNCTIONS -----------------------------------------------------
/** Pause/resume the playback */
function playbackTogglePause() { 

    // POST to server
    fetch(serverDomain + 'playback/toggle-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordID: discordID })
    }).then(response => {
        if (response.status === 404) { updateLoader('error', 'Nothing is playing.'); }
        else if (response.status === 400) { updateLoader('error', 'You are not in the same voice channel as @Wave.'); }
    });
}

/** Skip the current song */
function playbackSkip() { 

    // POST to server
    fetch(serverDomain + 'playback/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordID: discordID })
    }).then(response => {
        if (response.status === 404) { updateLoader('error', 'Nothing is playing.'); }
        else if (response.status === 400) { updateLoader('error', 'You are not in the same voice channel as @Wave.'); }
        else if (response.status === 500) { updateLoader('error', 'Unable to skip; something went wrong (error 500).'); }
    });
}

/** Removes an item from the queue */
function queueRemove(queueIndex) { 

    // POST to server
    fetch(serverDomain + 'queue/remove/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            discordID: discordID,
            queueIndex: queueIndex
        })
    }).then(response => {
        if (response.status === 401) { updateLoader('error', 'You are not in the same voice channel as @Wave.'); return; }
        else if (response.status != 200) { updateLoader('error', 'An error occurred (error ' + response.status + ').'); return; }

        updateLoader('done', 'Removed item from the queue!');
    })
}

/** Toggles playback looping */
function toggleLoop() { 

    // POST to server
    fetch(serverDomain + 'queue/toggle-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordID: discordID })
    }).then(response => {
        if (response.status === 401) { updateLoader('error', 'You are not in the same voice channel as @Wave.'); }
        else if (response.status !== 200) { updateLoader('error', 'An error occurred (error ' + response.status + ').'); }
    });
}

/** Stops the bot */
function stopBot() {

    // POST to server
    fetch(serverDomain + 'playback/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordID: discordID })
    }).then(response => {
        if (response.status === 404) { updateLoader('error', 'Nothing is playing.'); }
        else if (response.status === 400) { updateLoader('error', 'You are not in the same voice channel as @Wave.'); }
        else if (response.status !== 200) { updateLoader('error', 'An error occurred (error ' + response.status + ').'); }
        else { 
            updateLoader('done', 'Stopped playback.');
        }
    });
}

/** Queues the currently-playing song, if applicable */
function queueCurrentSong() { 
    if (!currentSongInfo) { return; }
    addToQueue(currentSongInfo.youtubeUrl);
}



// QUEUE ADD FUNCTIONS ----------------------------------------------------
function searchForSongs() {

    // Get input values
    let searchQuery = getText('input-search').html.querySelector('input').value;
    if (!searchQuery) { return; }

    // Update loader
    let searchButton = document.getElementById('search-button');
    searchButton.classList.add('loader');
    searchButton.querySelector('span').innerHTML = 'hourglass_full';

    // Fetch from server
    fetch(serverDomain + 'song/search/?discordID=' + discordID + '&searchQuery=' + searchQuery)
    .then(response => { 
        if (response.status != 200) { updateLoader('error', 'An internal error occurred (error ' + response.status + ').'); return; }

        return response.json();
    }).then(searchResults => { 
        console.log(searchResults);

        // Update loader
        searchButton.classList.remove('loader');
        searchButton.querySelector('span').innerHTML = 'search';

        // Clear the search results
        let searchResultsContainer = document.getElementById('search-results');
        searchResultsContainer.innerHTML = '';

        if (searchResults.length === 0) { 
            let p = document.createElement('p');
            p.innerHTML = 'Nothing was found. Perhaps try this with broader terms?';
            searchResultsContainer.appendChild(p); 
            return;
        }

        // Create the search results
        for (item of searchResults) { createSearchReult(item); }
    })
}

function addToQueue(query) {

    query = query || getText('input-search').html.querySelector('input').value;
    if (!query) { return; }

    closeModal('modal-add-song');
    updateLoader('loading', 'Adding item to the queue...');

    // POST to server
    fetch(serverDomain + 'queue/add/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            discordID: discordID,
            searchQuery: query
        })
    }).then(response => { 
        if (response.status === 200) { updateLoader('done', 'Added item to the queue!'); }
        else if(response.status === 401) {
            updateLoader('error', 'You\'re not connected to the same voice channel as @Wave'); return
        } else { updateLoader('error', 'Something went wrong (error ' + response.status + ').'); return; }

        // If it's not playing, try to get it to
        fetch(serverDomain + 'playback/begin/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordID: discordID })
        });
    })
}



// PLAYLIST ADD FUNCTIONS ------------------------------------------------
function addCurrentItemPlaylist() { 
    if (!currentSongInfo) { return; }
    addPlaylistSong = currentSongInfo;
    showAddPlaylistModal();
}

function showAddPlaylistModal() {
    if (!addPlaylistSong) { return; }

    // Request all user's playlists
    updateLoader('loading', 'Finding your playlists...');
    fetch(serverDomain + 'playlist/?discordID=' + discordID)
    .then(response => { 
        if (response.status !== 200) { updateLoader('error', 'You have no playlists.'); return; }
        
        return response.json();
    }).then(playlistList => { 
        console.log(playlistList);
        updateLoader('done', 'Found your playlists!');

        document.getElementById('add-playlist-content').innerHTML = '';

        // Create dropdown
        let dropdownOptions = [];
        for (item of playlistList) {
            dropdownOptions.push(new Ph_SelectOption({ value: item.id, content: item.name }));
        }

        let dropdown = new Ph_Select({
            placeholder: 'Choose a playlist...',
            options: dropdownOptions,
            parent: document.getElementById('add-playlist-content')
        });
        let dropdownObject = dropdown.instantiate();
        dropdownObject.id = 'add-playlist-dropdown';

        openModal('modal-add-playlist');
    })
}

function addToPlaylist() { 
    if (!addPlaylistSong) { return; }

    // Get selection 
    let selection = getSelect('add-playlist-dropdown').html.querySelector('.selected');
    console.log(selection);
    if (!selection) { updateLoader('error', 'Choose a playlist'); return; }

    const payload = {
        discordID: discordID,
        songQuery: addPlaylistSong.youtubeUrl,
        playlistID: selection.dataset.value
    }
    console.log(payload);

    // Send to server
    updateLoader('loading', 'Adding to your playlist');
    fetch(serverDomain + 'playlist/item/add/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(response => { 
        if (response.status !== 200) { updateLoader('error', 'An error occurred (error ' + response.status + ').'); return; }
        else { updateLoader('done', 'Added to your playlist!'); closeModal('modal-add-playlist'); }
    })

}