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

// UI Elements
const latEl = document.getElementById('lat-val');
const lngEl = document.getElementById('lng-val');
const altEl = document.getElementById('alt-val');
const speedEl = document.getElementById('speed-val');
const pulseInd = document.querySelector('.pulse-indicator');
const btnSimulate = document.getElementById('btn-simulate');
const btnReset = document.getElementById('btn-reset');

// Function to update UI and Map
function updatePosition(lat, lng, alt, speed) {
    // The CSS transition on .leaflet-marker-icon makes this movement smooth!
    marker.setLatLng([lat, lng]);
    
    // Optional: pan map smoothly if marker gets close to edge
    if (!map.getBounds().contains([lat, lng])) {
        map.panTo([lat, lng]);
    }

    // Update UI text
    latEl.textContent = lat.toFixed(4) + '°';
    lngEl.textContent = lng.toFixed(4) + '°';
    altEl.textContent = Math.round(alt).toLocaleString() + ' m';
    speedEl.textContent = Math.round(speed) + ' km/h';

    // Flash the indicator
    pulseInd.classList.add('active');
    setTimeout(() => {
        if (!simulationInterval) pulseInd.classList.remove('active');
    }, 200);
}

// Initial UI Update
updatePosition(currentLat, currentLng, currentAlt, currentSpeed);

// --- Simulation Logic ---
let simulationInterval = null;
let isSimulating = false;

// Flight path parameters
const targetAlt = 30000; // 30km
let flightPhase = 'ascent'; // ascent, float, descent

function simulateFlightTick() {
    // Wind drift simulation (drifting East/North-East over Germany)
    const driftLat = (Math.random() * 0.005) + 0.001;
    const driftLng = (Math.random() * 0.01) + 0.005;

    currentLat += driftLat;
    currentLng += driftLng;

    // Altitude and Speed simulation
    if (flightPhase === 'ascent') {
        currentAlt += (Math.random() * 50) + 20; // Ascend 20-70m per tick
        currentSpeed = (Math.random() * 20) + 40; // 40-60 km/h wind speed
        if (currentAlt >= targetAlt) {
            flightPhase = 'burst'; // Balloon pops
        }
    } else if (flightPhase === 'burst') {
        flightPhase = 'descent';
    } else if (flightPhase === 'descent') {
        currentAlt -= (Math.random() * 100) + 50; // Fast descent
        currentSpeed = (Math.random() * 10) + 20;
        if (currentAlt <= 0) {
            currentAlt = 0;
            currentSpeed = 0;
            stopSimulation();
        }
    }

    // Every few ticks, center the map to follow the balloon
    map.panTo([currentLat, currentLng], { animate: true, duration: 1 });

    updatePosition(currentLat, currentLng, currentAlt, currentSpeed);
}

function startSimulation() {
    if (isSimulating) return;
    
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

btnSimulate.addEventListener('click', () => {
    if (isSimulating) {
        stopSimulation();
    } else {
        startSimulation();
    }
});

btnReset.addEventListener('click', () => {
    stopSimulation();
    currentLat = 50.1109;
    currentLng = 8.6821;
    currentAlt = 0;
    currentSpeed = 0;
    flightPhase = 'ascent';
    updatePosition(currentLat, currentLng, currentAlt, currentSpeed);
    map.flyTo([currentLat, currentLng], 6, { duration: 1.5 });
});
