// LOAD PAGE
function loadPage() { 

    // Get URL parameters
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

    if (!accessToken) { console.log('not yet signed in'); return; }

    fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
            'Authorization': `${tokenType} ${accessToken}`
        }
    }).then(res => res.json()).then(res => {

        // Send to server for verification
        fetch(serverDomain + 'authenticate/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guilds: res
            })
        }).then( res => {
            if (res.status === 200) {

                // Get user info
                fetch('https://discord.com/api/users/@me', {
                    headers: {
                        'Authorization': `${tokenType} ${accessToken}`
                    }
                }).then(res => res.json()).then(res => {

                    // Save to local storage
                    localStorage.setItem('userID', res.id);
                    localStorage.setItem('avatarURL', 'https://cdn.discordapp.com/avatars/' + res.id + '/' + res.avatar + '.png');
                    localStorage.setItem('tokenType', tokenType);
                    localStorage.setItem('accessToken', accessToken);

                    console.log(res);

                    // Load nowplaying page
                    window.location.href = './nowplaying.html';
                });
            } else {
                document.getElementById('info').innerHTML = 'Something went wrong. Please try again. Error code: ' + res.status;
            }
        });
    });
}