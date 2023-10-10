let mapsindoorsApiKey = window.MI_API_KEY;
export let lastClickedLocation = null;

export function initializeMapClicks(mapsIndoorsInstance, mapInstance) {
    mapInstance.on('click', (event) => {
        console.log("Raw map click coordinates:", event.lngLat);

        window.currentlySelectedLocation = {
            geometry: {
                coordinates: [event.lngLat.lng, event.lngLat.lat],
                type: "Point"
            }
        };
        
        placeMarker(event.lngLat, mapInstance);
        mapsIndoorsInstance.addListener('click', (location) => handleMapsIndoorsClick(location, event.lngLat));
    });
}

let currentMarker = null;

export function placeMarker(coordinates, mapInstance) {
    if (currentMarker) {
        currentMarker.setLngLat(coordinates);
    } else {
        currentMarker = new mapboxgl.Marker()
            .setLngLat(coordinates)
            .addTo(mapInstance);
    }
}

export function handleMapsIndoorsClick(location, rawCoordinates) {
    if (location) {
        lastClickedLocation = location;
        handleMapClickForWorkOrder(location, rawCoordinates);
    }
}

export let currentlySelectedParentId = null; 

async function fetchParentId(location_id) {
    const apiUrl = `/get_parent_id?location_id=${location_id}`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.parentId) {
            currentlySelectedParentId = data.parentId;
            console.log(currentlySelectedParentId);
        } else {
            console.error('No parentId in response', data);
        }
    } catch (error) {
        console.error('Error fetching parentId:', error);
    }
}

function updateLocationInfo(name, building, venue, floorName, type, externalId) {
    document.getElementById('location-name').innerText = name;
    document.getElementById('location-building').innerText = building;
    document.getElementById('location-venue').innerText = venue;
    document.getElementById('location-floor').innerText = floorName;
    document.getElementById('location-type').innerText = type;
    document.getElementById('location-externalId').innerText = externalId;
}

export function handleMapClickForWorkOrder(location, rawCoordinates) {
    const { name, building, venue, floorName, type, externalId } = location.properties;
    console.log(location.properties);

    updateLocationInfo(name, building, venue, floorName, type, externalId);
    
    fetchParentId(location.id);
}
