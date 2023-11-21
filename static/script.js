if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/service-worker.js')
        .then((reg) => console.log('Service Worker registered', reg))
        .catch((err) => console.log('Service Worker not registered', err));
}

document.addEventListener('DOMContentLoaded', (event) => {
    const cursor = document.createElement('span');
    cursor.textContent = '|';
    cursor.className = 'blink-cursor';

    document.querySelector('.matrix-terminal').appendChild(cursor);
});

// Function to update the stream data on the webpage
function updateStreamData(data) {
    // Clear the existing stream data
    const streamList = document.querySelector('.stream-list');
    streamList.innerHTML = '';

    for (const serverName in data) {
        if (data.hasOwnProperty(serverName)) {
            const streams = data[serverName];
            const serverHeader = document.createElement('h2');
            serverHeader.textContent = serverName + ' (' + streams.length + ')';
            streamList.appendChild(serverHeader);

            const streamUl = document.createElement('ul');
            streams.forEach((stream) => {
                const streamLi = document.createElement('li');
                streamLi.innerHTML = `
                    ${stream.user}
                    ${stream.state === 'playing' ? '<i class="fas fa-play"></i>' : ''}
                    ${stream.state === 'paused' ? '<i class="fas fa-pause"></i>' : ''}
                    <span class="stream-title">${stream.title}</span>
                    [<span class="stream-decision">${stream.transcode_decision}</span>]
                    <div class="progress-bar">
                        <div class="progress" style="width: ${stream.progress_percent}%;"></div>
                        <span class="progress-text">${stream.progress_percent}%</span>
                    </div>
                `;
                streamUl.appendChild(streamLi);
            });

            streamList.appendChild(streamUl);
        }
    }
}

// Function to handle SSE updates
function handleStreamUpdates(event) {
    const data = JSON.parse(event.data);
    
    // Call the function to update the stream data on the webpage
    updateStreamData(data);
}

const streamUpdates = new EventSource('/stream_updates');
streamUpdates.addEventListener('message', handleStreamUpdates);
