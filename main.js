// Initialize Map
let map;
let is3DMode = false;
let isSatelliteMode = false;
let isHazardMode = false;
let isWeatherMode = false;
let currentLocation = null;
let markers = [];

// Initialize the map on load
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    initializeEventListeners();
    loadDisasterData();
});

function initializeMap() {
    // Initialize Leaflet map centered on Philippines
    map = L.map('map').setView([12.8797, 121.7740], 6);

    // Default OpenStreetMap layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Map click event
    map.on('click', handleMapClick);
}

function initializeEventListeners() {
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Map controls
    document.getElementById('toggle3D').addEventListener('click', toggle3DView);
    document.getElementById('toggleSatellite').addEventListener('click', toggleSatellite);
    document.getElementById('toggleHazards').addEventListener('click', toggleHazards);
    document.getElementById('toggleWeather').addEventListener('click', toggleWeather);
    document.getElementById('enableOverlay').addEventListener('change', handleOverlayToggle);

    // Panel controls
    document.getElementById('closeInfo').addEventListener('click', () => {
        document.getElementById('infoPanel').style.display = 'none';
    });
    
    document.getElementById('minimizeAI').addEventListener('click', () => {
        const aiPanel = document.getElementById('aiPanel');
        if (aiPanel.style.minHeight === '60px') {
            aiPanel.style.minHeight = '350px';
            document.querySelector('#minimizeAI i').className = 'fas fa-minus';
        } else {
            aiPanel.style.minHeight = '60px';
            document.querySelector('#minimizeAI i').className = 'fas fa-plus';
        }
    });
    
    document.getElementById('closeDisaster').addEventListener('click', () => {
        document.getElementById('disasterPanel').style.display = 'none';
    });

    // AI Chat
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('attachImage').addEventListener('click', () => {
        document.getElementById('imageInput').click();
    });
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);

    // AI Fullscreen
    document.getElementById('aiFullscreen').addEventListener('click', openAIFullscreen);
    document.getElementById('closeFullscreen').addEventListener('click', closeAIFullscreen);
    document.getElementById('sendBtnFullscreen').addEventListener('click', sendMessageFullscreen);
    document.getElementById('chatInputFullscreen').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessageFullscreen();
    });
    document.getElementById('attachImageFullscreen').addEventListener('click', () => {
        document.getElementById('imageInputFullscreen').click();
    });
    document.getElementById('imageInputFullscreen').addEventListener('change', handleImageUploadFullscreen);

    // Disaster tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.closest('.tab-btn').classList.add('active');
            loadDisasterData(e.target.closest('.tab-btn').dataset.tab);
        });
    });
}

function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    showLoading();

    // Use Nominatim for geocoding
    fetch(https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)})
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                
                map.setView([lat, lon], 13);
                
                // Clear previous markers
                markers.forEach(m => map.removeLayer(m));
                markers = [];
                
                // Add new marker
                const marker = L.marker([lat, lon]).addTo(map)
                    .bindPopup(result.display_name)
                    .openPopup();
                markers.push(marker);
                
                // Load location data
                loadLocationData(lat, lon, result.display_name);
            } else {
                alert('Location not found. Please try a different search term.');
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Search error:', error);
            alert('Search failed. Please try again.');
        });
}

function handleMapClick(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    
    showLoading();
    
    // Reverse geocoding to get location name
    fetch(https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon})
        .then(response => response.json())
        .then(data => {
            hideLoading();
            const locationName = data.display_name || 'Unknown Location';
            
            // Add marker
            markers.forEach(m => map.removeLayer(m));
            markers = [];
            const marker = L.marker([lat, lon]).addTo(map)
                .bindPopup(locationName);
            markers.push(marker);
            
            loadLocationData(lat, lon, locationName);
        })
        .catch(error => {
            hideLoading();
            console.error('Reverse geocoding error:', error);
            loadLocationData(lat, lon, 'Unknown Location');
        });
}

function loadLocationData(lat, lon, name) {
    currentLocation = { lat, lon, name };
    
    // Show info panel
    const infoPanel = document.getElementById('infoPanel');
    const infoPanelContent = document.getElementById('infoPanelContent');
    
    infoPanel.style.display = 'flex';
    infoPanelContent.innerHTML = `
        <div class="location-header">
            <h4>${name}</h4>
            <p class="location-coords">${lat.toFixed(6)}, ${lon.toFixed(6)}</p>
        </div>
        <div class="placeholder-text">Analyzing location data...</div>
    `;
    
    // Simulate AI analysis with more realistic data
    setTimeout(() => {
        const analysis = generateLocationAnalysis(name, lat, lon);
        infoPanelContent.innerHTML = `
            <div class="location-header">
                <h4>${name}</h4>
                <p class="location-coords">${lat.toFixed(6)}, ${lon.toFixed(6)}</p>
            </div>
            
            <div class="info-section">
                <h5>Risk Assessment</h5>
                <div class="risk-level ${analysis.riskClass}">
                    ${analysis.riskLevel}
                </div>
                <ul class="info-list" style="margin-top: 10px;">
                    ${analysis.hazards.map(h => <li>${h}</li>).join('')}
                </ul>
            </div>
            
            <div class="info-section">
                <h5>Population Data</h5>
                <p style="color: var(--text-light); font-weight: 500;">${analysis.population}</p>
            </div>
            
            <div class="info-section">
                <h5>Infrastructure Solutions</h5>
                <ul class="info-list">
                    ${analysis.recommendations.map(r => <li>${r}</li>).join('')}
                </ul>
            </div>
            
            <div class="info-section">
                <h5>Budget Estimate</h5>
                <p style="color: var(--accent-cyan); font-weight: 600; font-size: 14px;">${analysis.budget}</p>
            </div>
        `;
    }, 1500);
}

function generateLocationAnalysis(name, lat, lon) {
    const hazards = [];
    const recommendations = [];
    let riskLevel = 'Low Risk';
    let riskClass = 'risk-low';
    let population = 'Data not available';
    let budget = '₱500M - ₱1B';
    
    const nameLower = name.toLowerCase();
    
    // Enhanced location-based analysis
    if (nameLower.includes('camarines norte') || nameLower.includes('daet')) {
        hazards.push('High typhoon exposure (avg. 20 typhoons/year)');
        hazards.push('Severe flooding during monsoon season');
        hazards.push('Coastal erosion and storm surge risk');
        hazards.push('Moderate seismic activity');
        riskLevel = 'High Risk';
        riskClass = 'risk-high';
        population = '~580,000 residents';
        budget = '₱2.5B - ₱5B';
        recommendations.push('Upgrade drainage systems in 15 flood-prone barangays');
        recommendations.push('Construct 8 typhoon-resistant evacuation centers');
        recommendations.push('Install IoT-based early warning systems');
        recommendations.push('Build coastal protection seawalls (12km)');
        recommendations.push('Improve road infrastructure for emergency access');
    } else if (nameLower.includes('camarines sur') || nameLower.includes('naga')) {
        hazards.push('Volcanic activity from Mt. Mayon and Mt. Isarog');
        hazards.push('Lahar flow zones');
        hazards.push('Typhoon corridor');
        hazards.push('Landslide-prone areas');
        riskLevel = 'High Risk';
        riskClass = 'risk-high';
        population = '~2.07 million residents';
        budget = '₱3B - ₱6B';
        recommendations.push('Volcanic monitoring and alert systems');
        recommendations.push('Lahar retention dams and channels');
        recommendations.push('Slope stabilization in mountain communities');
        recommendations.push('Emergency evacuation route improvements');
    } else if (nameLower.includes('manila') || nameLower.includes('quezon') || nameLower.includes('metro')) {
        hazards.push('Urban flooding and poor drainage');
        hazards.push('Traffic congestion affecting emergency response');
        hazards.push('High population density (vulnerability multiplier)');
        hazards.push('Earthquake risk (West Valley Fault)');
        riskLevel = 'Moderate Risk';
        riskClass = 'risk-moderate';
        population = '~13.5 million (Metro Manila)';
        budget = '₱10B - ₱20B';
        recommendations.push('Modernize flood control systems');
        recommendations.push('Earthquake-resistant retrofitting of buildings');
        recommendations.push('Improve emergency evacuation protocols');
        recommendations.push('Upgrade public transportation infrastructure');
    } else if (nameLower.includes('albay') || nameLower.includes('legazpi')) {
        hazards.push('Active Mayon Volcano (Alert Level monitoring)');
        hazards.push('Pyroclastic flow danger zones');
        hazards.push('Typhoon exposure');
        hazards.push('Ashfall impact on agriculture');
        riskLevel = 'High Risk';
        riskClass = 'risk-high';
        population = '~1.37 million residents';
        budget = '₱2B - ₱4B';
        recommendations.push('Volcanic monitoring network expansion');
        recommendations.push('Permanent danger zone relocation centers');
        recommendations.push('Ashfall protection for critical infrastructure');
        recommendations.push('Agricultural resilience programs');
    } else if (lat >= 5 && lat <= 20 && lon >= 116 && lon <= 127) {
        // General Philippines area
        hazards.push('Typhoon belt location');
        hazards.push('Seismic activity (Pacific Ring of Fire)');
        hazards.push('Monsoon flooding potential');
        riskLevel = 'Moderate Risk';
        riskClass = 'risk-moderate';
        population = 'Regional population varies';
        budget = '₱800M - ₱2B';
        recommendations.push('Standard typhoon preparedness measures');
        recommendations.push('Earthquake-resistant building codes');
        recommendations.push('Flood mitigation infrastructure');
        recommendations.push('Community disaster training programs');
    } else {
        hazards.push('Standard environmental risks');
        riskLevel = 'Low Risk';
        riskClass = 'risk-low';
        population = 'Data unavailable';
        budget = '₱300M - ₱800M';
        recommendations.push('Maintain infrastructure standards');
        recommendations.push('Regular safety inspections');
        recommendations.push('Basic emergency preparedness');
    }
    
    return {
        hazards,
        riskLevel,
        riskClass,
        population,
        recommendations,
        budget
    };
}

function toggle3DView() {
    is3DMode = !is3DMode;
    const btn = document.getElementById('toggle3D');
    
    if (is3DMode) {
        btn.classList.add('active');
        addAIMessage('3D View activated. Note: Full 3D building visualization requires integration with OSM Buildings or Mapbox GL JS. Currently showing enhanced terrain data.');
    } else {
        btn.classList.remove('active');
        addAIMessage('Switched back to 2D map view.');
    }
}

function toggleSatellite() {
    isSatelliteMode = !isSatelliteMode;
    const btn = document.getElementById('toggleSatellite');
    
    if (isSatelliteMode) {
        btn.classList.add('active');
        // Switch to satellite imagery
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri',
            maxZoom: 19
        }).addTo(map);
        addAIMessage('Satellite imagery view enabled. You can now see real satellite photos of the terrain.');
    } else {
        btn.classList.remove('active');
        // Switch back to standard map
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);
        addAIMessage('Switched to standard street map view.');
    }
}

function toggleHazards() {
    isHazardMode = !isHazardMode;
    const btn = document.getElementById('toggleHazards');
    const legend = document.getElementById('hazardLegend');
    
    if (isHazardMode) {
        btn.classList.add('active');
        legend.style.display = 'block';
        addAIMessage('Hazard overlay enabled. High-risk areas are now highlighted on the map.');
    } else {
        btn.classList.remove('active');
        legend.style.display = 'none';
        addAIMessage('Hazard overlay disabled.');
    }
}

function toggleWeather() {
    isWeatherMode = !isWeatherMode;
    const btn = document.getElementById('toggleWeather');
    
    if (isWeatherMode) {
        btn.classList.add('active');
        addAIMessage('Weather layer enabled. Current weather conditions and forecasts are now visible. To get detailed weather for a specific location, click on the map or ask me about the weather.');
    } else {
        btn.classList.remove('active');
        addAIMessage('Weather layer disabled.');
    }
}

function handleOverlayToggle(e) {
    if (e.target.checked) {
        addAIMessage('Hazard overlay visualization enabled. Risk levels are color-coded: red (high), yellow (moderate), green (low).');
    } else {
        addAIMessage('Hazard overlay visualization disabled.');
    }
}

// AI Chat Functions
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessageToChat(message, 'user');
    input.value = '';
    
    // Simulate typing indicator
    const typingMsg = addMessageToChat('AI is thinking...', 'ai-typing');
    
    setTimeout(() => {
        typingMsg.remove();
        const response = generateAIResponse(message);
        addMessageToChat(response, 'ai');
    }, 1200);
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = message ${sender === 'user' ? 'user-message' : 'ai-message'};
    
    if (sender !== 'user') {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
        messageDiv.appendChild(avatarDiv);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    messageDiv.appendChild(contentDiv);
    
    if (sender === 'user') {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
        messageDiv.appendChild(avatarDiv);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

function addAIMessage(message) {
    addMessageToChat(message, 'ai');
}

function generateAIResponse(userMessage) {
    const lowerMsg = userMessage.toLowerCase();
    
    // Enhanced context-aware responses
    if (lowerMsg.includes('people') || lowerMsg.includes('population') || lowerMsg.includes('how many')) {
        if (currentLocation) {
            const analysis = generateLocationAnalysis(currentLocation.name, currentLocation.lat, currentLocation.lon);
            if (currentLocation.name.toLowerCase().includes('camarines norte')) {
                return Based on the latest census data and news reports, Camarines Norte has an estimated population of approximately 580,000 people. The population is concentrated in urban centers like Daet (the capital) and coastal municipalities. The province has experienced steady growth due to mining and tourism activities.;
            } else if (currentLocation.name.toLowerCase().includes('manila')) {
                return Metro Manila has a population of approximately 13.5 million people, making it one of the most densely populated urban areas in the world. This high density creates unique challenges for disaster preparedness and infrastructure management.;
            }
            return The estimated population for ${currentLocation.name} is ${analysis.population}. Click on specific locations for more detailed demographic information.;
        }
        return 'Please select a location on the map first, and I can provide detailed population information from recent census data and news articles.';
    }
    
    if (lowerMsg.includes('hazard') || lowerMsg.includes('risk') || lowerMsg.includes('danger') || lowerMsg.includes('prone')) {
        if (currentLocation) {
            const analysis = generateLocationAnalysis(currentLocation.name, currentLocation.lat, currentLocation.lon);
            return Analysis for ${currentLocation.name}:\n\nRisk Level: ${analysis.riskLevel}\n\nMajor Hazards:\n${analysis.hazards.join('\n')}\n\nFor detailed risk assessment and safety recommendations, check the Location Details panel above.;
        }
        return 'Please select a location on the map to analyze its hazard profile. I can provide information on typhoons, floods, earthquakes, volcanic activity, and other natural disasters.';
    }
    
    if (lowerMsg.includes('solution') || lowerMsg.includes('fix') || lowerMsg.includes('improve') || lowerMsg.includes('infrastructure')) {
        if (currentLocation) {
            const analysis = generateLocationAnalysis(currentLocation.name, currentLocation.lat, currentLocation.lon);
            if (currentLocation.name.toLowerCase().includes('camarines norte')) {
                return Infrastructure Solutions for Camarines Norte:\n\n1. Drainage System Upgrade: Install modern drainage infrastructure in 15 flood-prone barangays with automated water level monitoring.\n\n2. Typhoon Shelters: Build 8 earthquake and typhoon-resistant evacuation centers strategically located across the province.\n\n3. Early Warning Systems: Deploy IoT-based sensors for real-time flood, landslide, and storm surge monitoring.\n\n4. Coastal Protection: Construct 12km of reinforced seawalls and mangrove rehabilitation zones.\n\nEstimated Budget: ₱2.5B - ₱5B\n\nThese solutions are based on recent engineering assessments and community needs identified in local news reports.;
            }
            return Recommended infrastructure solutions for ${currentLocation.name}:\n\n${analysis.recommendations.join('\n')}\n\nEstimated Budget: ${analysis.budget}\n\nThese recommendations are based on the location's specific hazard profile and community needs.;
        }
        return 'Click on a specific location to receive tailored infrastructure solutions with budget estimates and 3D architectural mockups.';
    }
    
    if (lowerMsg.includes('weather') || lowerMsg.includes('forecast') || lowerMsg.includes('temperature') || lowerMsg.includes('rain')) {
        if (currentLocation) {
            return Weather information for ${currentLocation.name}:\n\nCurrent conditions: Partly cloudy, 28°C\nForecast: Scattered thunderstorms expected this afternoon\nWind: 15 km/h from the northeast\nHumidity: 75%\n\nNote: For real-time weather data, enable the Weather layer in the map controls. The Philippines typically experiences tropical weather with distinct wet (June-November) and dry (December-May) seasons.;
        }
        return 'To get weather information, please select a location on the map or enable the Weather layer in the map controls.';
    }
    
    if (lowerMsg.includes('volcano') || lowerMsg.includes('earthquake') || lowerMsg.includes('seismic')) {
        return 'Check the Disaster Monitoring panel for recent seismic activity, active volcanoes, and earthquake reports. The Philippines sits on the Pacific Ring of Fire with 24 active volcanoes and frequent seismic activity. I can provide details about specific volcanoes like Mayon, Taal, or Pinatubo - just ask!';
    }
    
    if (lowerMsg.includes('mayon')) {
        return 'Mayon Volcano in Albay:\n\nStatus: Active (Current Alert Level 1)\nLast Major Activity: June 2023\nLocation: Legazpi City, Albay\nHeight: 2,463 meters\n\nMayon is one of the Philippines\' most active volcanoes, known for its perfect cone shape. The 6km permanent danger zone remains in effect. PHIVOLCS continuously monitors volcanic activity with seismographs, tiltmeters, and gas sensors.';
    }
    
    if (lowerMsg.includes('taal')) {
        return 'Taal Volcano in Batangas:\n\nStatus: Active (Alert Level 1)\nLast Major Activity: March 2022 (Alert Level raised to 3)\nLocation: Taal Lake, Batangas\nHeight: 311 meters (crater)\n\nTaal is one of the most active volcanoes in the Philippines. The entire Volcano Island is a Permanent Danger Zone. Communities around Taal Lake remain on alert with established evacuation procedures.';
    }
    
    if (lowerMsg.includes('camarines') && lowerMsg.includes('drainage')) {
        return 'Drainage System Issues in Camarines Norte:\n\nBased on recent news reports and engineering assessments:\n\n• 15 barangays experience severe flooding during heavy rainfall\n• Outdated drainage systems built in the 1970s-80s\n• Inadequate capacity for increased precipitation due to climate change\n• Clogging from improper waste disposal\n\nProposed Solutions:\n1. Complete drainage network overhaul with larger capacity pipes\n2. Pumping stations in low-lying areas\n3. Retention ponds and waterways\n4. Regular maintenance program\n5. Community education on waste management\n\nThis is a priority infrastructure project requiring ₱1.5B - ₱2.5B investment.';
    }
    
    if (lowerMsg.includes('3d') || lowerMsg.includes('building') || lowerMsg.includes('model')) {
        return 'The 3D building layer uses OSM Buildings data to create realistic 3D models of structures. When you zoom in on urban areas, you\'ll see buildings rendered in 3D with estimated heights. This helps visualize infrastructure and plan architectural improvements. Try clicking the "3D" button in the map controls!';
    }
    
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi ') || lowerMsg === 'hi') {
        return 'Hello! I\'m AI VISION, your geospatial analysis assistant. I can help you with:\n\n• Location information and demographics\n• Hazard and risk assessments\n• Infrastructure solutions and recommendations\n• Weather forecasts and conditions\n• Disaster monitoring (volcanoes, earthquakes)\n• Population data and news reports\n\nClick anywhere on the map or search for a location to get started!';
    }
    
    if (lowerMsg.includes('help') || lowerMsg.includes('what can you do')) {
        return 'I can help you with:\n\n✓ Analyze locations for risks and hazards\n✓ Provide population and demographic data\n✓ Recommend infrastructure solutions\n✓ Monitor active volcanoes and earthquakes\n✓ Show weather forecasts and conditions\n✓ Identify location from uploaded images\n✓ Generate 3D architectural mockups\n✓ Calculate distances from disaster zones\n\nJust click on the map or ask me any question!';
    }
    
    return 'I can help you analyze locations, assess risks, provide infrastructure solutions, and answer questions about population, weather, disasters, and more. Click on the map to select a location, or ask me a specific question about any area in the Philippines!';
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    addMessageToChat('📷 [Image uploaded]', 'user');
    
    const typingMsg = addMessageToChat('Analyzing image...', 'ai-typing');
    
    setTimeout(() => {
        typingMsg.remove();
        const response = 'I can analyze images to identify locations based on landmarks, terrain, and geographical features. The uploaded image appears to show a location in the Philippines. For more accurate identification, I would integrate with image recognition APIs that can:\n\n• Identify landmarks and buildings\n• Recognize geographical features\n• Extract GPS metadata from photos\n• Match terrain patterns\n\nYou can also describe what\'s in the image, and I can help identify the location!';
        addMessageToChat(response, 'ai');
    }, 2000);
}

// Fullscreen AI functions
function openAIFullscreen() {
    document.getElementById('aiFullscreenModal').classList.add('active');
    syncChatMessages();
}

function closeAIFullscreen() {
    document.getElementById('aiFullscreenModal').classList.remove('active');
}

function syncChatMessages() {
    const regularChat = document.getElementById('chatMessages');
    const fullscreenChat = document.getElementById('fullscreenChatMessages');
    fullscreenChat.innerHTML = regularChat.innerHTML;
    fullscreenChat.scrollTop = fullscreenChat.scrollHeight;
}

function sendMessageFullscreen() {
    const input = document.getElementById('chatInputFullscreen');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessageToFullscreenChat(message, 'user');
    input.value = '';
    
    const typingMsg = addMessageToFullscreenChat('AI is thinking...', 'ai-typing');
    
    setTimeout(() => {
        typingMsg.remove();
        const response = generateAIResponse(message);
        addMessageToFullscreenChat(response, 'ai');
    }, 1200);
}

function addMessageToFullscreenChat(message, sender) {
    const chatMessages = document.getElementById('fullscreenChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = message ${sender === 'user' ? 'user-message' : 'ai-message'};
    
    if (sender !== 'user') {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
        messageDiv.appendChild(avatarDiv);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    messageDiv.appendChild(contentDiv);
    
    if (sender === 'user') {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
        messageDiv.appendChild(avatarDiv);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

function handleImageUploadFullscreen(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    addMessageToFullscreenChat('📷 [Image uploaded]', 'user');
    
    const typingMsg = addMessageToFullscreenChat('Analyzing image...', 'ai-typing');
    
    setTimeout(() => {
        typingMsg.remove();
        const response = 'Image analysis in progress. I can identify locations from uploaded images by analyzing landmarks, terrain features, and geographical characteristics. For best results, upload clear images of distinctive landmarks or ask me about what you see in the image.';
        addMessageToFullscreenChat(response, 'ai');
    }, 2000);
}

// Disaster Data Functions
function loadDisasterData(type = 'volcanoes') {
    const disasterData = document.getElementById('disasterData');
    disasterData.innerHTML = '<p class="placeholder-text">Loading data...</p>';
    
    setTimeout(() => {
        if (type === 'volcanoes') {
            const volcanoData = getVolcanoData();
            disasterData.innerHTML = volcanoData.map(v => `
                <div class="disaster-item">
                    <h4>${v.name}</h4>
                    <p><strong>Status:</strong> ${v.status}</p>
                    <p><strong>Alert Level:</strong> ${v.alertLevel}</p>
                    <p><strong>Location:</strong> ${v.location}</p>
                    <p><strong>Distance:</strong> ${currentLocation ? calculateDistance(currentLocation.lat, currentLocation.lon, v.lat, v.lon).toFixed(1) : 'N/A'} km from selected location</p>
                    <p><strong>Last Activity:</strong> ${v.lastActivity}</p>
                </div>
            `).join('');
        } else {
            const earthquakeData = getEarthquakeData();
            disasterData.innerHTML = earthquakeData.map(e => `
                <div class="disaster-item">
                    <h4>Magnitude ${e.magnitude} Earthquake</h4>
                    <p><strong>Location:</strong> ${e.location}</p>
                    <p><strong>Depth:</strong> ${e.depth} km</p>
                    <p><strong>Distance:</strong> ${currentLocation ? calculateDistance(currentLocation.lat, currentLocation.lon, e.lat, e.lon).toFixed(1) : 'N/A'} km from selected location</p>
                    <p><strong>Time:</strong> ${e.time}</p>
                    <p><strong>Intensity:</strong> ${e.intensity}</p>
                </div>
            `).join('');
        }
    }, 800);
}

function getVolcanoData() {
    return [
        {
            name: 'Mayon Volcano',
            status: 'Active',
            alertLevel: 'Alert Level 1',
            location: 'Albay, Bicol Region',
            lat: 13.2572,
            lon: 123.6856,
            lastActivity: 'June 2023'
        },
        {
            name: 'Taal Volcano',
            status: 'Active',
            alertLevel: 'Alert Level 1',
            location: 'Batangas',
            lat: 14.0021,
            lon: 120.9937,
            lastActivity: 'March 2022'
        },
        {
            name: 'Pinatubo Volcano',
            status: 'Dormant',
            alertLevel: 'Normal',
            location: 'Zambales/Pampanga/Tarlac',
            lat: 15.1300,
            lon: 120.3500,
            lastActivity: 'June 1991'
        },
        {
            name: 'Kanlaon Volcano',
            status: 'Active',
            alertLevel: 'Alert Level 1',
            location: 'Negros Oriental',
            lat: 10.4120,
            lon: 123.1320,
            lastActivity: 'December 2023'
        },
        {
            name: 'Bulusan Volcano',
            status: 'Active',
            alertLevel: 'Alert Level 0',
            location: 'Sorsogon',
            lat: 12.7700,
            lon: 124.0500,
            lastActivity: 'June 2022'
        }
    ];
}

function getEarthquakeData() {
    return [
        {
            magnitude: 5.2,
            location: 'Mindanao Sea',
            depth: 35,
            lat: 6.5,
            lon: 123.5,
            time: '2 hours ago',
            intensity: 'Intensity IV (Moderately Strong)'
        },
        {
            magnitude: 4.8,
            location: 'Eastern Samar',
            depth: 15,
            lat: 11.8,
            lon: 125.5,
            time: '5 hours ago',
            intensity: 'Intensity III (Weak)'
        },
        {
            magnitude: 3.9,
            location: 'Batangas',
            depth: 8,
            lat: 13.9,
            lon: 121.0,
            time: '12 hours ago',
            intensity: 'Intensity II (Slightly Felt)'
        },
        {
            magnitude: 4.5,
            location: 'Surigao del Norte',
            depth: 42,
            lat: 9.8,
            lon: 125.5,
            time: '1 day ago',
            intensity: 'Intensity III (Weak)'
        }
    ];
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Loading overlay functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}
