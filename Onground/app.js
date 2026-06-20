// Initialize Map centered on Germany
const map = L.map('map', {
    zoomControl: false // Hide default zoom control for cleaner UI
}).setView([51.1657, 10.4515], 6); // Center of Germany, zoomed out

// Add Esri World Imagery (Satellite)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
}).addTo(map);

// Add custom zoom control to top right
L.control.zoom({
    position: 'topright'
}).addTo(map);

// Create Custom Marker Icon
const balloonIcon = L.divIcon({
    className: 'custom-balloon-marker',
    html: `
        <div class="marker-ring"></div>
        <div class="marker-core"></div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

// Initial balloon position (e.g., launch site near Frankfurt)
let currentLat = 50.1109;
let currentLng = 8.6821;
let currentAlt = 0;
let currentSpeed = 0;

// Add marker to map
const marker = L.marker([currentLat, currentLng], { icon: balloonIcon }).addTo(map);

// Flight path polyline
let pathPolyline = L.polyline([], {
    color: '#38bdf8',
    weight: 4,
    opacity: 0.8,
    dashArray: '5, 10'
}).addTo(map);

// UI Elements
const latEl = document.getElementById('lat-val');
const lngEl = document.getElementById('lng-val');
const altEl = document.getElementById('alt-val');
const timeEl = document.getElementById('time-val');
const pulseInd = document.querySelector('.pulse-indicator');
const btnSimulate = document.getElementById('btn-simulate');
const btnReset = document.getElementById('btn-reset');

// Tab Selection Elements
const tabSim = document.getElementById('tab-sim');
const tabLive = document.getElementById('tab-live');
const panelSim = document.getElementById('panel-sim');
const panelLive = document.getElementById('panel-live');

// SPOT Elements
const spotFeedInput = document.getElementById('spot-feed-id');
const btnConnectSpot = document.getElementById('btn-connect-spot');
const spotStatus = document.getElementById('spot-status');

// Track the mode
let currentMode = 'simulation'; // 'simulation' or 'live'

// Function to update UI and Map
function updatePosition(lat, lng, alt, timeString) {
    // The CSS transition on .leaflet-marker-icon makes this movement smooth!
    marker.setLatLng([lat, lng]);
    
    // Optional: pan map smoothly if marker gets close to edge
    if (!map.getBounds().contains([lat, lng])) {
        map.panTo([lat, lng]);
    }

    // Update UI text
    latEl.textContent = lat.toFixed(4) + '°';
    lngEl.textContent = lng.toFixed(4) + '°';
    altEl.textContent = alt > 0 ? Math.round(alt).toLocaleString() + ' m' : '--';
    timeEl.textContent = timeString;

    // Flash the indicator
    pulseInd.classList.add('active');
    setTimeout(() => {
        if (!simulationInterval && !spotPollInterval) pulseInd.classList.remove('active');
    }, 200);
}

// Initial UI Update
updatePosition(currentLat, currentLng, currentAlt, '--:--:--');

// --- Tab Switching Logic ---
tabSim.addEventListener('click', () => {
    if (currentMode === 'simulation') return;
    currentMode = 'simulation';
    tabSim.classList.add('active');
    tabLive.classList.remove('active');
    panelSim.classList.remove('hidden');
    panelLive.classList.add('hidden');
    
    // Stop live updates and clear track
    stopSpotPolling();
    pathPolyline.setLatLngs([]);
    resetSimulation();
});

tabLive.addEventListener('click', () => {
    if (currentMode === 'live') return;
    currentMode = 'live';
    tabLive.classList.add('active');
    tabSim.classList.remove('active');
    panelLive.classList.remove('hidden');
    panelSim.classList.add('hidden');
    
    // Stop simulation and clear track
    stopSimulation();
    pathPolyline.setLatLngs([]);
    
    latEl.textContent = '--.----';
    lngEl.textContent = '--.----';
    altEl.textContent = '--';
    timeEl.textContent = '--:--:--';
});


// --- Simulation Logic ---
let simulationInterval = null;
let isSimulating = false;
let simulationPath = [];

// Flight path parameters
const targetAlt = 30000; // 30km
let flightPhase = 'ascent'; // ascent, float, descent

function simulateFlightTick() {
    // Wind drift simulation (drifting East/North-East over Germany)
    const driftLat = (Math.random() * 0.005) + 0.001;
    const driftLng = (Math.random() * 0.01) + 0.005;

    currentLat += driftLat;
    currentLng += driftLng;

    // Altitude simulation
    if (flightPhase === 'ascent') {
        currentAlt += (Math.random() * 50) + 20; // Ascend 20-70m per tick
        if (currentAlt >= targetAlt) {
            flightPhase = 'burst'; // Balloon pops
        }
    } else if (flightPhase === 'burst') {
        flightPhase = 'descent';
    } else if (flightPhase === 'descent') {
        currentAlt -= (Math.random() * 100) + 50; // Fast descent
        if (currentAlt <= 0) {
            currentAlt = 0;
            stopSimulation();
        }
    }

    // Add point to path polyline
    simulationPath.push([currentLat, currentLng]);
    pathPolyline.setLatLngs(simulationPath);

    // Every few ticks, center the map to follow the balloon
    map.panTo([currentLat, currentLng], { animate: true, duration: 1 });

    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];

    updatePosition(currentLat, currentLng, currentAlt, timeString);
}

function startSimulation() {
    if (isSimulating) return;
    
    // Reset path
    simulationPath = [[currentLat, currentLng]];
    pathPolyline.setLatLngs(simulationPath);

    // Zoom in on the launch site smoothly
    map.flyTo([currentLat, currentLng], 11, {
        duration: 2
    });

    // Start sending simulated GPS updates every 1 second
    setTimeout(() => {
        isSimulating = true;
        pulseInd.classList.add('active');
        btnSimulate.textContent = 'Stop Simulation';
        btnSimulate.style.background = 'var(--danger)';
        simulationInterval = setInterval(simulateFlightTick, 1000);
    }, 2000);
}

function stopSimulation() {
    isSimulating = false;
    pulseInd.classList.remove('active');
    btnSimulate.textContent = 'Simulate Flight';
    btnSimulate.style.background = 'var(--accent)';
    clearInterval(simulationInterval);
    simulationInterval = null;
}

function resetSimulation() {
    stopSimulation();
    currentLat = 50.1109;
    currentLng = 8.6821;
    currentAlt = 0;
    flightPhase = 'ascent';
    simulationPath = [];
    pathPolyline.setLatLngs([]);
    updatePosition(currentLat, currentLng, currentAlt, '--:--:--');
    map.flyTo([currentLat, currentLng], 6, { duration: 1.5 });
}

btnSimulate.addEventListener('click', () => {
    if (isSimulating) {
        stopSimulation();
    } else {
        startSimulation();
    }
});

btnReset.addEventListener('click', resetSimulation);


// --- SPOT Tracker API Integration ---
let spotPollInterval = null;

async function fetchSpotData() {
    const feedId = spotFeedInput.value.trim();
    if (!feedId) {
        spotStatus.textContent = 'Please enter a valid Feed ID.';
        spotStatus.style.color = 'var(--danger)';
        return;
    }

    spotStatus.textContent = 'Fetching live data from SPOT satellites...';
    spotStatus.style.color = 'var(--text-muted)';
    pulseInd.classList.add('active');

    const url = `https://api.findmespot.com/spot-main-web/consumer/rest-api/2.0/public/feed/${feedId}/message.json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API returned HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle error responses from SPOT API
        if (data.response && data.response.errors) {
            const errorObj = data.response.errors.error;
            const errMsg = Array.isArray(errorObj) ? errorObj[0].text : errorObj.text;
            throw new Error(errMsg);
        }

        const msgList = data.response.feedMessageResponse.messages.message;
        if (!msgList || msgList.length === 0) {
            spotStatus.textContent = 'Connected! No GPS tracking points found in the last 7 days.';
            spotStatus.style.color = '#eab308'; // Warning yellow
            return;
        }

        // Sort messages: oldest first, so we can draw the path in correct order
        // Note: single message is returned as object, multiple as array. Normalise to array.
        const messages = Array.isArray(msgList) ? msgList : [msgList];
        messages.sort((a, b) => a.unixTime - b.unixTime);

        // Map messages to Leaflet LatLng points
        const points = messages.map(msg => [msg.latitude, msg.longitude]);
        pathPolyline.setLatLngs(points);

        // Get the latest point
        const latestMsg = messages[messages.length - 1];
        const latestLat = latestMsg.latitude;
        const latestLng = latestMsg.longitude;
        
        // SPOT messages do not contain altitude by default, 
        // but we extract time and update marker
        const messageTime = new Date(latestMsg.unixTime * 1000);
        const timeString = messageTime.toTimeString().split(' ')[0];

        // Update the marker position and UI
        updatePosition(latestLat, latestLng, 0, timeString); // Altitude set to 0 as SPOT lacks it

        // Zoom/Center map to the latest position on initial load
        if (map.getZoom() < 10) {
            map.flyTo([latestLat, latestLng], 12, { duration: 1.5 });
        } else {
            map.panTo([latestLat, latestLng]);
        }

        spotStatus.textContent = `Live tracking active. Connected to Feed: "${data.response.feedMessageResponse.feed.name}".`;
        spotStatus.style.color = '#10b981'; // Green success

    } catch (error) {
        console.error('SPOT API Error:', error);
        spotStatus.textContent = `Error: ${error.message}. Double-check Feed ID or verify it is a public feed.`;
        spotStatus.style.color = 'var(--danger)';
        stopSpotPolling();
    }
}

function startSpotPolling() {
    stopSpotPolling(); // Prevent duplicate timers
    fetchSpotData();
    // Poll the API every 2.5 minutes (150,000 ms)
    spotPollInterval = setInterval(fetchSpotData, 150000);
}

function stopSpotPolling() {
    if (spotPollInterval) {
        clearInterval(spotPollInterval);
        spotPollInterval = null;
    }
    pulseInd.classList.remove('active');
}

btnConnectSpot.addEventListener('click', startSpotPolling);
