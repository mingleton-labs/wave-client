// VARIABLES --------------------------------------------------------------
var currentPlaylistInfo;
var isEditable = false;
var isShowingAll = false;


// LOAD PAGE --------------------------------------------------------------
function loadPage() { 

    showView('view-empty');

    // Check if signed in
    if (localStorage.getItem('userID') === null) {
        // Redirect to login page
        window.location.href = './index.html';
        return;
    } else {
        // Update avatar image
        document.getElementById('avatar-square').style.backgroundImage = 'url(' + localStorage.getItem('avatarURL') + ')';
    }

    // Request all playlists
    showPlaylistList(false);

    // Check URL Params
    let urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('id');
    if (id) { 
        showPlaylist(id);
    }

    // Detect an enter press on the search input
    document.getElementById('queue-search').querySelector('input').addEventListener('keyup', function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            addToPlaylist();
        }
    });
}


// SHOW PLAYLIST LIST ----------------------------------------------------
function showPlaylistList(isAll) {

    let query = serverDomain + 'playlist/list/';
    if (!isAll) {
        query += '?userID=' + localStorage.getItem('userID')
    }

    fetch(query)
        .then(response => {
            if (response.status == 404) { 
                document.getElementById('playlist-list').innerHTML = '<p>No playlists found.</p>';
            } else {
                return response.json();
            }
        }).then(data => {
            if (!data) { return; }
            console.log(data);

            let playlistListContainer = document.getElementById('playlist-list');
            playlistListContainer.innerHTML = '';

            // [ TODO ] - Create playlist list
            for (item of data) { 

                // Create list buttons 
                let listButton = new Ph_ListButton({
                    title: item.name,
                    subtitle: '@' + item.displayName,
                    parent: playlistListContainer,
                    type: 'outlined'
                });
                let listButtonObject = listButton.instantiate();

                // Add event
                let listItem = item;
                listButtonObject.onclick = function() { 
                    showPlaylist(listItem.id, listItem.userID);
                }
            }
        });
}

function showOtherPlaylists() { 
    isShowingAll = !isShowingAll;
    showPlaylistList(isShowingAll);

    if (!isShowingAll) { 
        document.getElementById('show-playlist-list-button').innerHTML = 'Show all playlists';
    } else { 
        document.getElementById('show-playlist-list-button').innerHTML = 'Show your playlists';
    }
}


// CREATE PLAYLIST --------------------------------------------------------
function showPlaylistModal() { 

    // Create modal
    let modal = new Ph_Modal({
        headerText: 'Create Playlist'
    });
    let modalObject = modal.instantiate();

    // Modify modal content
    let textInput = new Ph_Text({
        placeholder: 'Playlist name...',
        type: 'text',
        parent: modalObject.querySelector('.modal-content')
    });
    let textInputObject = textInput.instantiate();
    textInputObject.id = 'create-playlist-name';

    let createButton = document.createElement('button');
    createButton.classList.add('button', 'secondary', 'contained');
    createButton.innerHTML = 'Create';
    createButton.onclick = function() { createPlaylist(); } 
    modalObject.querySelector('.modal-content').appendChild(createButton);

    let errorMessage = document.createElement('p');
    errorMessage.id = 'create-playlist-error';
    modalObject.querySelector('.modal-content').appendChild(errorMessage);
}

function createPlaylist() {

    // Get playlist name
    let playlistName = '';
    let playlistNameText = document.getElementById('create-playlist-name');
    if (playlistNameText) { playlistName = playlistNameText.querySelector('input').value; }

    // Check if playlist name is valid
    if (!playlistName) {
        document.getElementById('create-playlist-error').style.display = 'block';
        document.getElementById('create-playlist-error').innerHTML = 'Please enter a playlist name.';
        return;
    }

    // Create playlist
    fetch(serverDomain + 'playlist/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: localStorage.getItem('userID'),
                playlistName: playlistName
            })
        }).then(response => {
            if (response.status == 200) {
                // Reload page
                window.location.reload();
            } else {
                document.getElementById('create-playlist-error').style.display = 'block';
                document.getElementById('create-playlist-error').innerHTML = 'Error creating playlist.';
            }
        });
}


// SHOW PLAYLIST ----------------------------------------------------------
function showPlaylist(id) {

    showView('view-empty');
    updateLoader('Loading playlist...');

    // Get playlist information
    fetch(serverDomain + 'playlist/?playlistID=' + id + '&userID=' + localStorage.getItem('userID'))
    .then(response => {
        if (response.status == 404) { 
            hideLoader();
            createAlert('No playlist found');
        } else {
            return response.json();
        }
    }).then(data => {
        if (!data) { return; }

        currentPlaylistInfo = data;
        console.log(data);

        window.history.pushState("", "", clientDomain + 'playlist.html?id=' + id);

        // Check if is editable
        isEditable = data.isEditable;

        // Update UI
        if (!isEditable) { document.getElementById('queue-search-box').style.display = 'none'; }
        else { document.getElementById('queue-search-box').style.display = 'flex'; }

        // Update title
        document.getElementById('playlist-name').innerText = data.name;

        // Update items
        let playlistQueue = document.getElementById('playlist-queue');
        playlistQueue.innerHTML = '';

        if (data.items.length == 0) { 
            playlistQueue.innerHTML = '<p>No items in playlist yet.</p>';

            // Update playlist duration
            document.getElementById('playlist-duration').querySelector('p').innerHTML = '0 items, 00:00mins.';
        } else {

            // Fill out playlist queue
            let totalDuration = 0;
            for (item of data.items) { 
                totalDuration += item.songDuration;

                let queueItem = document.createElement('div');
                queueItem.classList.add('queue-item');

                let contentVertical = document.createElement('div');
                contentVertical.classList.add('content-vertical');
                queueItem.appendChild(contentVertical);

                let h4 = document.createElement('h4');
                h4.innerHTML = item.songName;
                contentVertical.appendChild(h4);

                let p = document.createElement('p');
                p.innerHTML = item.songArtist;
                contentVertical.appendChild(p);

                let sep1 = document.createElement('div');
                sep1.classList.add('sep', 'vertical');
                queueItem.appendChild(sep1);

                let p2 = document.createElement('p');
                p2.innerHTML = normaliseMinutes(item.songDuration);
                queueItem.appendChild(p2);

                if (isEditable) { 
                    let binButton = document.createElement('button');
                    binButton.classList.add('button', 'icon', 'secondary', 'editable-only');
                    binButton.innerHTML = '<span class="material-icons-round">delete</span>';
                    let itemIndex = item.index;
                    binButton.onclick = function() {
                        removeFromPlaylist(itemIndex);
                    };
                    queueItem.appendChild(binButton);
                }

                playlistQueue.appendChild(queueItem);
            }

            // Update playlist duration
            document.getElementById('playlist-duration').querySelector('p').innerHTML = data.items.length + ' items, ' + normaliseMinutes(totalDuration) + 'mins.';
        }

        hideLoader();
        showView('view-playlist');
    });
}

function showPlaylistInfo() { 

    // Create a modal
    let modal = new Ph_Modal({
        headerText: 'Playlist Info'
    });
    let modalObject = modal.instantiate();
    let modalContent = modalObject.querySelector('.modal-content');

    let textInputContainer = document.createElement('div');
    textInputContainer.classList.add('content-vertical', 'content-input');
    modalContent.appendChild(textInputContainer);

    // If this playlist is editable...
    if (isEditable) {
        // Add name input
        let textInput = new Ph_Text({
            placeholder: 'Playlist name...',
            type: 'text',
            value: currentPlaylistInfo.name,
            parent: textInputContainer
        });
        let textInputObject = textInput.instantiate();
        textInputObject.id = 'edit-playlist-name';

        let textInputPrompt = document.createElement('p');
        textInputPrompt.classList.add('label');
        textInputPrompt.innerHTML = 'The name of the playlist.';
        textInputContainer.appendChild(textInputPrompt);

        // Create save button
        let saveButton = document.createElement('button');
        saveButton.classList.add('button', 'secondary', 'contained');
        saveButton.innerHTML = 'Save Playlist';
        saveButton.onclick = function() { savePlaylist(); } 
        modalContent.appendChild(saveButton);

        let errorMessage = document.createElement('p');
        errorMessage.id = 'edit-playlist-error';
        modalContent.appendChild(errorMessage);
    } else { 

        // Create static information elements
        let playlistText = document.createElement('p');
        playlistText.classList.add('playlist-text');
        playlistText.innerHTML = '<b>Name:</b> ' + currentPlaylistInfo.name + '<br><b>Created by: </b>@' + currentPlaylistInfo.userName;
        modalContent.appendChild(playlistText);
        console.log(playlistText, modalContent);
    }
}

function savePlaylist() { 
    // Get playlist name
    let playlistName = '';
    let playlistNameText = document.getElementById('edit-playlist-name');
    if (playlistNameText) { playlistName = playlistNameText.querySelector('input').value; }

    // Check if playlist name is valid
    if (!playlistName) {
        document.getElementById('create-playlist-error').style.display = 'block';
        document.getElementById('create-playlist-error').innerHTML = 'Please enter a playlist name.';
        return;
    }

    // Create playlist
    fetch(serverDomain + 'playlist/edit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userID: localStorage.getItem('userID'),
                playlistID: currentPlaylistInfo.id,
                newPlaylistName: playlistName
            })
        }).then(response => {
            if (response.status == 200) {
                // Reload page
                window.location.reload();
            } else {
                document.getElementById('edit-playlist-error').style.display = 'block';
                document.getElementById('edit-playlist-error').innerHTML = 'Error editing playlist.';
            }
        });
}


// ADD TO PLAYLIST ---------------------------------------------------------
function addToPlaylist() {

    // Get input value
    let song = document.getElementById('queue-search').querySelector('input').value;
    if (!song) { 
        createAlert('No song name provided');
        return; 
    }
    document.getElementById('queue-search').querySelector('input').value = '';

    updateLoader('Adding song to playlist...');

    // Send to server
    fetch(serverDomain + 'playlist/song/add/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            playlistID: currentPlaylistInfo.id,
            userID: localStorage.getItem('userID'),
            song: song
        })
    }).then(response => {
        hideLoader();
        if (response.status == 404) {
            createAlert('Unable to add to playlist', 'An error occurred.');
        } else if (response.status == 401) { 
            createAlert('Unable to add to playlist', 'This is not your playlist.');
        } else if (response.status == 200) {
            createAlert('success', 'Added to playlist!');

            // Get playlist info again
            showPlaylist(currentPlaylistInfo.id, localStorage.getItem('userID'));
        }
    })
}


// REMOVE FROM PLAYLIST ----------------------------------------------------
function removeFromPlaylist(index) { 
    
    updateLoader('Removing song from playlist...');

    // Send to server
    fetch(serverDomain + 'playlist/song/remove/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            playlistID: currentPlaylistInfo.id,
            userID: localStorage.getItem('userID'),
            songIndex: index
        })
    }).then(response => {
        hideLoader();
        if (response.status == 404 || response.status == 500) {
            createAlert('Unable to remove from playlist', 'An error occurred.');
        } else if (response.status == 200) {
            createAlert('success', 'Removed song from playlist!');

            // Get playlist info again
            showPlaylist(currentPlaylistInfo.id, localStorage.getItem('userID'));
        }
    })
}


// ADD TO QUEUE ------------------------------------------------------------
function addToQueue() { 

    updateLoader('Adding playlist to queue...');

    // Send request to server
    fetch(serverDomain + 'playlist/addToQueue/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            playlistID: currentPlaylistInfo.id,
            userID: localStorage.getItem('userID')
        })
    }).then(response => {
        hideLoader();
        if (response.status == 500 || response.status == 404) {
            createAlert('Unable to add to queue', 'An error occurred.');
        } else if (response.status == 401) { 
            createAlert('Unable to add to queue', 'There are no items on the playlist.');
        } else if (response.status == 404) { 
            createAlert('Unable to add to queue', 'This playlist doesn\'t exist');
        } else if (response.status == 200) {
            createAlert('success', 'Added to queue!');
        }
    });
}