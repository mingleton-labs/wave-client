// VARIABLES --------------------------------------------------------------
var currentPlaylistInfo;
var isEditable = false;
var isShowingAll = false;


// LOAD PAGE --------------------------------------------------------------
function loadPage() { 

    showView('view-empty');

    // Check if signed in
    if (discordID === null) {       // DiscordID is stored locally & retrieved in global.js
        // Redirect to login page
        window.location = './index.html';
        return;
    }

    updateLoader('loading', 'Loading page...');

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

    // Detect an enter press on the search input
    document.getElementById('input-search').querySelector('input').addEventListener('keyup', function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            searchForSongs();
        }
    });

    // Check URL Params
    let urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('id');
    if (id) { showPlaylist(id); }


    // Load the page
    showPlaylistList();
}



// PAGE FUNCTIONS ---------------------------------------------------------
/** Creates a queue item with the given Song object
 * @param {Object} itemInfo Song object info
 */
function createQueueItem(itemInfo) {

    let queueItem = document.createElement('div');
    queueItem.classList.add('queue-item');
    queueItem.id = 'qi-' + itemInfo.itemID;

    let contentVertical = document.createElement('div');
    contentVertical.classList.add('content-vertical');
    queueItem.appendChild(contentVertical);

    let h4 = document.createElement('h4');
    h4.innerHTML = itemInfo.name;
    contentVertical.appendChild(h4);

    let p = document.createElement('p');
    p.innerHTML = itemInfo.artist + ' • ' + normaliseMinutes(itemInfo.duration);
    contentVertical.appendChild(p);

    let addToQueueButton = document.createElement('button');
    addToQueueButton.classList.add('button', 'icon');
    addToQueueButton.innerHTML = '<span class="material-icons-round">playlist_add</span>';
    addToQueueButton.onclick = function() { addToQueue(itemInfo.youtubeUrl); }
    queueItem.appendChild(addToQueueButton);

    let deleteButton = document.createElement('button');
    deleteButton.classList.add('button', 'icon');
    deleteButton.innerHTML = '<span class="material-icons-round">delete</span>';
    deleteButton.onclick = function() { removeFromPlaylist(itemInfo.id); }
    queueItem.appendChild(deleteButton);

    document.getElementById('playlist-queue').appendChild(queueItem);
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
    button.innerHTML = 'Add to playlist';
    let buttonUrl = itemInfo.url
    button.onclick = function() { addToPlaylist(buttonUrl); closeAddSongModal(); }
    contentVertical.appendChild(button);

    document.getElementById('search-results').appendChild(searchResult);
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

/** Checks if a given URL is a valid image link */
const isImgLink = (url) => {
    if (typeof url !== 'string') {
        return false;
    }
    return (url.match(/^http[^\?]*.(jpg|jpeg|gif|png|tiff|bmp)(\?(.*))?$/gmi) !== null);
}



// PLAYLIST LIST ----------------------------------------------------------
/** Get a list of all the playlists, then display them down the right-hand sidebar
 * @param {Boolean} isGetAll whether to get all playlists, or just the user's. Defaults to false.
 */
function showPlaylistList(isGetAll) { 

    updateLoader('loading', 'Finding playlists...');
    let url = serverDomain + 'playlist/?discordID=' + discordID;
    if (isGetAll) { url += '&isGetAll=true'; }

    fetch(url)
    .then(response => { 
        if (response.status !== 200) { updateLoader('error', 'Could not find playlists (error ' + response.status + ').'); return; }

        return response.json();
    }).then(playlistList => { 
        if (!playlistList) { return; }
        console.log(playlistList);

        document.getElementById('playlist-list').innerHTML = '';

        for (item of playlistList) { 
            let button = document.createElement('button');
            button.classList.add('button', 'playlist-list-button');

            let contentVertical = document.createElement('div');
            contentVertical.classList.add('content-vertical');
            button.appendChild(contentVertical);
            const playlistID = item.id;
            button.onclick = function() { showPlaylist(playlistID); }

            let h3 = document.createElement('h3');
            h3.innerHTML = item.name;
            contentVertical.appendChild(h3);

            let p = document.createElement('p');
            p.innerHTML = '@' + item.userDisplayName;
            contentVertical.appendChild(p);

            let icon = document.createElement('span');
            icon.classList.add('material-icons-round');
            icon.innerHTML = 'keyboard_arrow_right';
            button.appendChild(icon);

            document.getElementById('playlist-list').appendChild(button);
        }
        updateLoader('done', 'Found playlists!');
    });
}

/** Toggles between showing all playlists, and just this user's */
function togglePlaylistList() { 
    isShowingAll = !isShowingAll;
    showPlaylistList(isShowingAll);

    let button = document.getElementById('toggle-playlist-list-button');
    if (isShowingAll) { button.innerHTML = 'Show your playlists'; }
    else { button.innerHTML = 'Show all playlists'; }
}



// PLAYLIST ---------------------------------------------------------------
/** Show a playlist with the given ID
 * @param {String} id the server-issued UUID of the playlist to show
 */
function showPlaylist(id) {

    updateLoader('loading', 'Finding playlist...');
    fetch(serverDomain + 'playlist/?discordID=' + discordID + '&playlistID=' + id)
    .then(response => {
        if (response.status !== 200) { 
            updateLoader('error', 'Could not find playlist (error ' + response.status + ').');
            history.pushState({}, null, '/playlist.html');
            return;
        }

        return response.json();
    }).then(playlistInfo => {
        if (!playlistInfo) { return; }

        console.log(playlistInfo);

        let totalMins = playlistInfo.songs.reduce((prev, curr) => prev + curr.duration, 0);

        // Update the playlist info
        document.getElementById('playlist-thumbnail').src = playlistInfo.thumbnailUrl;
        document.getElementById('playlist-name').innerHTML = playlistInfo.name;
        document.getElementById('playlist-subtitle').innerHTML = '@' + playlistInfo.userDisplayName + ' • ' + normaliseNumber(playlistInfo.songs.length, 2) + ' items, ' + normaliseMinutes(totalMins);
        document.getElementById('playlist-description').innerHTML = playlistInfo.description;

        // Check for edit permissions
        let playlistSettingsButton = document.getElementById('playlist-settings-button');
        let playlistAddButton = document.getElementById('playlist-add-button');
        let playlistButtonDivider = document.getElementById('playlist-button-divider');

        if (!playlistInfo.hasEditAccess) {
            playlistSettingsButton.style.display = 'none';
            playlistAddButton.style.display = 'none';
            playlistButtonDivider.style.display = 'none';
        } else {
            playlistSettingsButton.style.display = 'flex';
            playlistAddButton.style.display = 'flex';
            playlistButtonDivider.style.display = 'inline-block';
        }

        // Add items to the queue list
        document.getElementById('playlist-queue').innerHTML = '';
        for (item of playlistInfo.songs) { createQueueItem(item); }
        document.getElementById('playlist-duration').querySelector('p').innerHTML = normaliseNumber(playlistInfo.songs.length, 2) + ' items, ' + normaliseMinutes(totalMins);

        // Update the urlParams
        history.pushState({}, null, '/playlist.html?id=' + playlistInfo.id);
        currentPlaylistInfo = playlistInfo;

        // Show the view
        updateLoader('done', 'Found playlist!');
        showView('view-playlist');
    })
}

/** Search for songs with the input provided. */
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

/** Adds a song to the playlist */
function addToPlaylist(query) {
    if (!query) { return; }

    updateLoader('loading', 'Adding this item...')

    // POST to server
    fetch(serverDomain + 'playlist/item/add/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            discordID: discordID,
            playlistID: currentPlaylistInfo.id,
            songQuery: query
        })
    }).then(response => { 
        if (response.status === 200) { reloadPage(); } 
        else { updateLoader('error', 'Something went wrong (error ' + response.status + ').'); return; }
    })
}

/** Removes a song from the playlist */
function removeFromPlaylist(itemID) { 

    updateLoader('loading', 'Removing this item...')

    // POST to server
    fetch(serverDomain + 'playlist/item/remove/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            discordID: discordID,
            playlistID: currentPlaylistInfo.id,
            songID: itemID
        })
    }).then(response => { 
        if (response.status === 200) { reloadPage(); } 
        else { updateLoader('error', 'Something went wrong (error ' + response.status + ').'); return; }
    })
}

/** Queue the entire current playlist */
function queuePlaylist() {
    if (!currentPlaylistInfo) { return; }

    updateLoader('loading', 'Queueing this playlist...');
    // POST to server
    fetch(serverDomain + 'playlist/queue/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            discordID: discordID,
            playlistID: currentPlaylistInfo.id,
        })
    }).then(response => { 
        if (response.status === 200) { updateLoader('done', 'Queued your playlist!'); } 
        else { updateLoader('error', 'Something went wrong (error ' + response.status + ').'); return; }

        // If it's not playing, try to get it to
        fetch(serverDomain + 'playback/begin/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordID: discordID })
        })
    })
}



// PLAYLIST CREATE/EDIT ---------------------------------------------------
/** Show the playlist create/edit modal */
function showPlaylistOptions(isEditing = false) { 

    let optionsName = document.getElementById('options-name').querySelector('input');
    let optionsThumbnailURL = document.getElementById('options-thumbnail-url').querySelector('input');
    let optionsDescription = document.getElementById('options-description').querySelector('textarea');
    let optionsUpdateButton = document.getElementById('options-update-button');
    let optionsDeleteButton = document.getElementById('options-delete-button');

    if (!isEditing) {
        optionsName.value = '';
        optionsThumbnailURL.value = '';
        optionsDescription.value = '';

        optionsUpdateButton.innerHTML = 'Create playlist';
        optionsDeleteButton.style.display = 'none';

        optionsUpdateButton.onclick = function() { updatePlaylist(false); }
    } else {
        optionsName.value = currentPlaylistInfo.name;
        optionsThumbnailURL.value = currentPlaylistInfo.thumbnailUrl;
        optionsDescription.value = currentPlaylistInfo.description;

        optionsUpdateButton.innerHTML = 'Update playlist';
        optionsDeleteButton.style.display = 'unset';

        optionsUpdateButton.onclick = function() { updatePlaylist(true); }
    }

    openModal('modal-playlist-options');
}

/** Update/create the playlist */
function updatePlaylist(isEditing = false) { 

    // Collect payload
    let payload = {
        discordID: discordID,
        name: getText('options-name').html.querySelector('input').value,
        description: getTextArea('options-description').html.querySelector('textarea').value,
        thumbnailUrl: getText('options-thumbnail-url').html.querySelector('input').value
    }
    if (isEditing) { payload.playlistID = currentPlaylistInfo.id; }

    // Check required values
    if (!payload.name || !payload.description || !payload.thumbnailUrl) { updateLoader('error', 'Please fill out all fields.'); return; }

    // Check thumbnail URL
    if (!isImgLink(payload.thumbnailUrl)) { updateLoader('error', 'Please enter a valid thumbnail URL.'); return; }

    // Send to server
    let url = serverDomain + 'playlist/';
    if (isEditing) { url += 'edit/'; } else { url += 'create/'; }
    console.log(payload);
    updateLoader('loading', 'Sending to server...');
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(response => { 
        if (response.status !== 200) { updateLoader('error', 'Something went wrong (error ' + response.status + ').'); }
        else { reloadPage(); }
    })
}

/** Delete the playlist */
function deletePlaylist() { 

    closeModal('modal-playlist-options');
    updateLoader('loading', 'Deleting your playlist...');
    fetch(serverDomain + 'playlist/delete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordID: discordID, playlistID: currentPlaylistInfo.id })
    }).then(response => { 
        if (response.status !== 200) { updateLoader('error', 'Something went wrong (error ' + response.status + ').'); }
        else { reloadPage(); }
    })
}



// QUEUE ADD --------------------------------------------------------------
/** Adds a song to the queue */
function addToQueue(query) {

    if (!query) { return; }

    updateLoader('loading', 'Adding item to the queue...')

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
        })
    })
}