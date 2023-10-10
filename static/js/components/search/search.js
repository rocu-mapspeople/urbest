import { handleMapsIndoorsClick, placeMarker } from '../mapInteraction/clickListening.js';



function getCoordinates(location) {
    if (location.geometry.type === 'Polygon') {
        // Return the anchor point if it's a polygon
        return location.properties.anchor.coordinates;
    } else if (location.geometry.type === 'Point') {
        // Return the coordinates directly if it's a point
        return location.geometry.coordinates;
    }
}


export function placeSearch(miSearchElement, miListElement, mapsIndoorsInstance, mapInstance){



  // //set the state of the previousId to null
let previousId = null

  miSearchElement.addEventListener('results', (event) => {
    // Reset search results list
    miListElement.innerHTML = null;

    // Append new search results
    event.detail.forEach(location => {
      const miListItemElement = document.createElement('mi-list-item-location');
      location.properties.imageURL = mapsIndoorsInstance.getDisplayRule(location).icon
      miListItemElement.location = location;

      miListElement.appendChild(miListItemElement);
    });
  });

  miSearchElement.addEventListener('cleared', (event) => {
    // Reset search results list
    miListElement.innerHTML = null;
    miListItemElement.showExternalId = false;
    mapsIndoorsInstance.filter(null);

    // Clear the location info table
    ['name', 'building', 'venue', 'floor', 'type'].forEach(prop => {
      document.getElementById(`location-${prop}`).innerText = '';
    });
  });

  miListElement.addEventListener('click', (event) => {
    // Get the selected location
    const selectedLocation = event.target.location;
    mapsIndoorsInstance.setFloor(selectedLocation.properties.floor);
    mapInstance.setCenter(selectedLocation.properties.anchor.coordinates);
    mapInstance.setPitch(0);
    mapInstance.setZoom(20);

    handleMapsIndoorsClick(selectedLocation, selectedLocation.properties.anchor.coordinates);





    // Setting the new display rule for the clicked location in the list
    mapsIndoorsInstance.setDisplayRule(selectedLocation.id, {
        visible: true,
        polygonVisible: true,
        polygonFillColor: "#d99830",
        polygonStrokeColor: "#d99830",
        polygonFillOpacity: 1,
        labelVisible: true,
        label: selectedLocation.properties.name
    });

    // If there was a previously selected location, reset its display rule
    if (previousId) {
        mapsIndoorsInstance.setDisplayRule(previousId, null);
    }

    // Update previousId to the currently selected location's id
    previousId = selectedLocation.id;

    // Do something with the selected location, for example:
    console.log('Selected location:', selectedLocation);

    // Set the selected location text as the value of the search box
    miSearchElement.setAttribute('value', selectedLocation.properties.name);
    miListElement.style.display = 'none';

    // Update the location info table
    document.getElementById('location-name').innerText = selectedLocation.properties.name;
    document.getElementById('location-building').innerText = selectedLocation.properties.building;
    document.getElementById('location-venue').innerText = selectedLocation.properties.venue;
    document.getElementById('location-floor').innerText = selectedLocation.properties.floorName;
    document.getElementById('location-type').innerText = selectedLocation.properties.type;

    placeMarker(selectedLocation.properties.anchor.coordinates, mapInstance);


    window.currentlySelectedLocation = {
    geometry: {
        coordinates: getCoordinates(selectedLocation),
        type: "Point"  // Assuming you always want to work with a point for the subsequent logic
    }
};
});



  miSearchElement.addEventListener('input', () => {
    miListElement.style.display = 'block';
  });






}