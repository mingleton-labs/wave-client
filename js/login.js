// LOAD PAGE
function loadPage() { 

    // Get URL parameters
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

    if (!accessToken) { console.log('not yet signed in'); return; }

    fetch('https://discord.com/api/users/@me', {
        headers: {
            'Authorization': `${tokenType} ${accessToken}`
        }
    }).then(res => res.json()).then(res => {

        const discordID = res.id;

        // Send to server for verification
        fetch(serverDomain + 'user-info/?discordID=' + discordID)
        .then(res => {
            if (res.status === 200) {

                // Save to local storage & move to next page
                localStorage.setItem('discordID', discordID);
                window.location = './nowplaying.html';
            } else {
                document.getElementById('info').innerHTML = 'Something went wrong. Please try again. Error code: ' + res.status;
            }
        });
    });
}