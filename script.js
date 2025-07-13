let map;
let points = [];
let markers = [];
let polylines = [];
let addingPoint = false;
let selectedPointIndex = null;

const statPoints = document.getElementById('stat-points');
const statDistance = document.getElementById('stat-distance');
let directionsService, directionsRenderer;

// Initialize the map
function initMap() {
    loadRouteData();

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ 
        map: map,
        suppressMarkers: true
    });

    map.addListener("click", (e) => {
        if (!addingPoint) return;
        addPoint(e.latLng);
        addingPoint = false;
    });

    drawMap();
    updateStats();
    showRouteSteps();
}

// Add a new point to the map
function addPoint(latLng) {
    points.push({ x: latLng.lat(), y: latLng.lng() });
    drawMap();
    updateStats();
    saveRouteData();
    showRouteSteps();
}

// Draw all points and routes on the map
function drawMap() {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    // Clear existing polylines
    polylines.forEach(line => line.setMap(null));
    polylines = [];

    // Add markers for all points
    points.forEach((pt, idx) => {
        const marker = new google.maps.Marker({
            position: { lat: pt.x, lng: pt.y },
            map: map,
            label: `${idx + 1}`,
            zIndex: idx
        });

        marker.addListener('click', function() {
            selectedPointIndex = idx;
            markers.forEach(m => m.setIcon(null));
            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
        });
        markers.push(marker);
    });

    // Draw route if we have at least 2 points
    if (points.length >= 2) {
        const waypoints = points.slice(1, -1).map(pt => ({
            location: { lat: pt.x, lng: pt.y },
            stopover: true
        }));

        directionsService.route({
            origin: { lat: points[0].x, lng: points[0].y },
            destination: { lat: points[points.length-1].x, lng: points[points.length-1].y },
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false
        }, (response, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
            } else {
                // Fallback to straight lines if Directions API fails
                for (let i = 1; i < points.length; i++) {
                    const line = new google.maps.Polyline({
                        path: [
                            { lat: points[i-1].x, lng: points[i-1].y },
                            { lat: points[i].x, lng: points[i].y }
                        ],
                        geodesic: true,
                        strokeColor: "#22c55e",
                        strokeOpacity: 1.0,
                        strokeWeight: 3,
                        map: map
                    });
                    polylines.push(line);
                }
            }
        });
    }
}

// Update statistics display
function updateStats() {
    statPoints.textContent = `Collection Points: ${points.length}`;
    
    let totalDist = 0;
    for (let i = 1; i < points.length; i++) {
        totalDist += haversine(points[i-1], points[i]);
    }
    
    statDistance.textContent = `Total Route Length: ${totalDist.toFixed(2)} km`;
    sessionStorage.setItem('sgb_points', points.length);
    sessionStorage.setItem('sgb_length', totalDist.toFixed(2));
    recordRouteHistory(totalDist.toFixed(2));
}

// Calculate distance between two points using Haversine formula
function haversine(p1, p2) {
    const R = 6371; // Earth radius in km
    const dLat = (p2.x - p1.x) * Math.PI / 180;
    const dLng = (p2.y - p1.y) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1.x * Math.PI / 180) * Math.cos(p2.x * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Show the route steps in the UI
function showRouteSteps() {
    const container = document.getElementById('routeStepsContainer');
    const stepsContainer = document.getElementById('routeSteps');
    
    if (points.length < 2) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    stepsContainer.innerHTML = '';
    
    points.forEach((point, index) => {
        const step = document.createElement('div');
        step.className = 'route-step';
        step.innerHTML = `
            <div class="route-step-number">${index + 1}</div>
            <div class="route-step-content">
                <div class="font-semibold text-green-300">Point ${index + 1}</div>
                <div class="text-sm text-green-400">Lat: ${point.x.toFixed(6)}, Lng: ${point.y.toFixed(6)}</div>
            </div>
        `;
        stepsContainer.appendChild(step);
    });
}

// Show the route steps in the UI (for optimized points)
function showOptimizedRouteSteps(orderedPoints) {
    const container = document.getElementById('routeStepsContainer');
    const stepsContainer = document.getElementById('routeSteps');
    if (!orderedPoints || orderedPoints.length < 2) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';
    stepsContainer.innerHTML = '';
    orderedPoints.forEach((point, index) => {
        const step = document.createElement('div');
        step.className = 'route-step';
        step.innerHTML = `
            <div class="route-step-number">${index + 1}</div>
            <div class="route-step-content">
                <div class="font-semibold text-green-300">Point ${index + 1}</div>
                <div class="text-sm text-green-400">Lat: ${parseFloat(point.x).toFixed(6)}, Lng: ${parseFloat(point.y).toFixed(6)}</div>
            </div>
        `;
        stepsContainer.appendChild(step);
    });
}

// Save route data to localStorage
function saveRouteData() {
    localStorage.setItem('sgb_points', JSON.stringify(points));
}

// Load route data from localStorage
function loadRouteData() {
    const storedPoints = localStorage.getItem('sgb_points');
    if (storedPoints) points = JSON.parse(storedPoints);
}

// Record route history
function recordRouteHistory(length) {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('sgb_route_history') || "[]");
    } catch(e) {}
    
    if (!history.length || history[history.length-1].length !== parseFloat(length)) {
        // Estimate fuel savings: distance (km) / 10 (km/liter)
        const fuelSaved = parseFloat(length) * 0.1; // liters
        // Estimate CO2 emissions saved: 2.68 kg CO2 per liter of diesel
        const co2Saved = fuelSaved * 2.68; // kg
        history.push({ 
            date: new Date().toLocaleDateString(), 
            length: parseFloat(length),
            points: points.length,
            co2Saved: co2Saved
        });
        localStorage.setItem('sgb_route_history', JSON.stringify(history));
    }
}

// Apply optimized order to points
function applyOptimizedOrder(optimizedOrder) {
    points = optimizedOrder.map(idx => points[idx]);
    drawMap();
    updateStats();
    saveRouteData();
    showRouteSteps();
}

// Event Listeners
document.getElementById('add-point-btn').addEventListener('click', () => {
    addingPoint = true;
});

document.getElementById('delete-point-btn').addEventListener('click', function() {
    if (selectedPointIndex === null || selectedPointIndex < 0 || selectedPointIndex >= points.length) {
        alert('Please select a point to delete.');
        return;
    }
    points.splice(selectedPointIndex, 1);
    selectedPointIndex = null;
    drawMap();
    updateStats();
    showRouteSteps();
    saveRouteData();
});

document.getElementById('reset-btn').addEventListener('click', function() {
    points = [];
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    polylines.forEach(line => line.setMap(null));
    polylines = [];
    if (directionsRenderer) directionsRenderer.set('directions', null);
    document.getElementById('routeStepsContainer').style.display = 'none';
    sessionStorage.removeItem('sgb_points');
    sessionStorage.removeItem('sgb_length');
    localStorage.removeItem('sgb_route_history');
    updateStats();
});

// Update optimize button event to use backend response
const optimizeBtn = document.getElementById('optimize-btn');
if (optimizeBtn) {
    optimizeBtn.addEventListener('click', function() {
        if (points.length < 2) {
            alert('Please add at least 2 points to optimize.');
            return;
        }
        // Use API_BASE from api.js
        fetch(typeof API_BASE !== 'undefined' ? `${API_BASE}/optimize` : '/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points: points })
        })
        .then(response => response.json())
        .then(data => {
            if (data.optimizedOrder && data.orderedPoints && typeof data.totalLength === 'number') {
                // Use the ordered points from backend
                points = data.orderedPoints;
                drawMap();
                // Update stats with backend length
                statPoints.textContent = `Collection Points: ${points.length}`;
                statDistance.textContent = `Total Route Length: ${data.totalLength.toFixed(2)} km`;
                sessionStorage.setItem('sgb_points', points.length);
                sessionStorage.setItem('sgb_length', data.totalLength.toFixed(2));
                saveRouteData();
                // Show route steps
                showOptimizedRouteSteps(points);
            } else {
                alert('Optimization failed: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(e => {
            console.error('Optimization error:', e);
            alert('Error during optimization. See console for details.');
        });
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    if (typeof statPoints !== "undefined" && typeof statDistance !== "undefined") {
        const pointsCount = sessionStorage.getItem('sgb_points') || '0';
        const routeLength = sessionStorage.getItem('sgb_length') || '0';
        statPoints.textContent = `Collection Points: ${pointsCount}`;
        statDistance.textContent = `Total Route Length: ${routeLength} km`;
    }
});

window.initMap = initMap;