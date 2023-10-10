import { defineCustomElements } from 'https://www.unpkg.com/@mapsindoors/components/dist/esm/loader.js';
import { placeSearch } from './components/search/search.js';
import { initializeMapClicks, currentlySelectedParentId, lastClickedLocation } from './components/mapInteraction/clickListening.js';
import { createGeoData } from './components/integrationApi/integrationApi.js';




export let mapboxToken = window.MAPBOX_TOKEN;



document.addEventListener("DOMContentLoaded", function() {
    const currentDate = new Date();
    const month = ("0" + (currentDate.getMonth() + 1)).slice(-2); // months are zero-based
    const day = ("0" + currentDate.getDate()).slice(-2);
    const year = currentDate.getFullYear();
    
    const formattedDate = `${year}-${month}-${day}`;
    
    document.getElementById("work-order-date").value = formattedDate;
});


// Define a function to create an issue
const createIssue = async (issueData) => {
  console.log(issueData);
  try {
    const response = await fetch('/create_issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
        body: new URLSearchParams(issueData).toString(),
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      // Handle the case where creating the issue failed
      console.error('Failed to create the issue. Status:', response.status);
      return { error: 'Failed to create the issue' };
    }
  } catch (error) {
    // Handle any network or other errors
    console.error('Error creating the issue:', error);
    return { error: 'An error occurred while creating the issue' };
  }
};

// presents the message
function handleGeoDataResponse(geoDataResponse, issueId) {
    if (geoDataResponse.status >= 200 && geoDataResponse.status <= 299) {
        console.log('GeoData successfully created!', geoDataResponse);

        const createdLocationId = geoDataResponse.data.data[0];

        // Construct the URLs
        const urbestURL = `https://urbest.io/dashboard?issue-id=${issueId}`;
        const mapURL = `https://storage.googleapis.com/maptemplate99/index.html?apiKey=${window.MI_API_KEY}&locationId=${createdLocationId}&primaryColor=0066FF`;

        // Update the links in the success message
        document.getElementById('linkUrbest').href = urbestURL;
        document.getElementById('linkMap').href = mapURL;

        // Display the success message
        document.getElementById('successMessage').style.display = 'block';
    } else {
        alert("Failed to create GeoData. Please try again!");
    }
}



defineCustomElements();
// Get the venue selector and building selector elements
const venueSelector = document.getElementById('venue-select');
const buildingSelector = document.getElementById('building-select');
const addressDisplay = document.getElementById('building-address');



let buildings; // Declare the buildings variable

// Function to populate the venue selector dropdown
function populateVenueSelector(venues) {
  venues.forEach(venue => {
    const option = document.createElement('option');
    option.value = venue.id;
    option.textContent = venue.name;
    venueSelector.appendChild(option);

  });

  // Trigger building selector population with the first venue
  const firstVenueId = venues[0].id;
  populateBuildingSelector(firstVenueId);
}

// Function to populate the building selector dropdown
function populateBuildingSelector(venueId) {
  mapsindoors.services.VenuesService.getBuildings(venueId).then(retrievedBuildings => {
    buildings = retrievedBuildings; // Update the buildings variable

    // Clear previous options
    buildingSelector.innerHTML = '';

    buildings.forEach(building => {
      const option = document.createElement('option');
      option.value = building.id;
      option.textContent = building.buildingInfo.name; // Use building name from buildingInfo
      buildingSelector.appendChild(option);
    });

    // Set default building's address
    const defaultBuilding = buildings[0];
    const defaultAddress = defaultBuilding && defaultBuilding.address;

    if (defaultAddress) {
      addressDisplay.textContent = defaultAddress;
    } else {
      addressDisplay.textContent = 'No address stored';
    }
  });
}

// Event listener for building selector changes
buildingSelector.addEventListener('change', event => {
  const selectedBuildingId = event.target.value;
  const selectedBuilding = buildings.find(building => building.id === selectedBuildingId);
  const address = selectedBuilding && selectedBuilding.address;

  if (address) {
    addressDisplay.textContent = address;
  } else {
    addressDisplay.textContent = 'No address stored';
  }
});


export const miMapElement = document.querySelector('mi-map-mapbox');
const mapViewOptions = {
  accessToken: mapboxToken,
  element: document.getElementById('map'),
  center: { lat: 48.146443278182595, lng: 17.130318221624492 },
  zoom: 20,
  maxZoom: 25,
};

const mapViewInstance = new mapsindoors.mapView.MapboxView(mapViewOptions);
const mapsIndoorsInstance = new mapsindoors.MapsIndoors({ mapView: mapViewInstance });
const mapInstance = mapViewInstance.getMap();

// Floor Selector
const floorSelectorElement = document.createElement('div');
new mapsindoors.FloorSelector(floorSelectorElement, mapsIndoorsInstance);
mapInstance.addControl({
  onAdd: function () {
    return floorSelectorElement;
  },
  onRemove: function () {}
});

const miSearchElement = document.getElementById('search-input');
const miListElement = document.getElementById('search-list');

mapsIndoorsInstance.on('ready', () => {
  mapsindoors.services.VenuesService.getVenues().then(venues => {

            const anchorCoordinates = venues[0].anchor.coordinates;
            mapInstance.setCenter(anchorCoordinates);
            // mapsIndoorsInstance.setCenter(anchorCoordinates);
        }).catch(error => {
            console.error(error);
        });
  // Hide MI_BUILDING and MI_VENUE layers on the map. This will prevent them from being clicked.
  mapsIndoorsInstance.setDisplayRule(['MI_BUILDING', 'MI_VENUE'], {
    visible: false
  });

  // Initialize search and click handling
  placeSearch(miSearchElement, miListElement, mapsIndoorsInstance, mapInstance);
  initializeMapClicks(mapsIndoorsInstance, mapInstance);

  // Fetch the venues and populate the venue selector
mapsindoors.services.VenuesService.getVenues().then(venues => {
  populateVenueSelector(venues);

});

// Event listener for venue selector changes
venueSelector.addEventListener('change', event => {
  const selectedVenueId = event.target.value;
  populateBuildingSelector(selectedVenueId);

    mapsindoors.services.VenuesService.getVenue(selectedVenueId).then(venue => {
    const anchorCoordinates = venue.anchor.coordinates;
    mapInstance.setCenter(anchorCoordinates);
    mapsIndoorsInstance.setZoom(20);
    miSearchElement.setAttribute('mi-venue', venueId);
  });
});







  
  // Retrieve the venues and populate the venue select dropdown
});

// Get the form and the submit button
const form = document.getElementById('work-order-form');
const submitButton = form.querySelector('button[type="submit"]');

// Get the location input field
const locationInput = document.getElementById('work-order-location');

// Disable the submit button initially
submitButton.disabled = false;
// Form submission event listener
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = document.querySelector('button[type="submit"]');

  // Update button text and disable it
  const originalButtonText = submitButton.innerText;
  submitButton.innerText = "Please wait for submit to process...";
  submitButton.disabled = true;


  const coordinates = window.currentlySelectedLocation;
  console.log(coordinates);
let coords = coordinates.geometry.coordinates
const parentId = currentlySelectedParentId;

  // Get the selected buildingId from the dropdown
  const categorySelector = document.getElementById('categorySelector');
  const selectedCategory = categorySelector.value;
  // const selectedOption = categorySelector.options[categorySelector.selectedIndex];
  // const selectedBuildingId = selectedOption.dataset.buildingId;
  const selectedOption = categorySelector.options[categorySelector.selectedIndex];
const selectedBuildingId = selectedOption.dataset.buildingId;

// Get the value of the "work-order-description" input field
  const descriptionTextInput = document.getElementById('work-order-description');
  const descriptionText = descriptionTextInput ? descriptionTextInput.value : '';



  try {
    // Make a POST request to create the issue using createIssue function
    const issueResponse = await createIssue({
      building_id: selectedBuildingId,
      category_id: selectedCategory,
      description: descriptionText,
      floor_name: lastClickedLocation.properties.floorName
    });

    // Check both the status code and any possible 'error' property in the response
    if (issueResponse.error) {
      console.error('Failed to create the issue. Response:', issueResponse);
      alert('Failed to create the issue. Check the console for more details.');
      return;  // Stop the function here to avoid creating geo data without an issue
    }

    // Issue created successfully, get the issue_id
    const issueId = issueResponse.issue_id;
    console.log(issueId);

    // Assuming you have the `issueId` variable, pass it when creating geo data
    const geoDataResponse = await createGeoData({
      parentId: currentlySelectedParentId,
      name: descriptionText,
      description: descriptionText,
      coords: coords,
      issueId: issueId,
    });

    handleGeoDataResponse(geoDataResponse, issueId);


    // Check if creating geo data was successful
    if (geoDataResponse.status >= 200 && geoDataResponse.status <= 299) {
      // Geo data created successfully
      console.log('GeoData successfully created!', geoDataResponse);
    } else {
      // Handle the case where creating geo data failed
      console.error('Failed to create GeoData. Status:', geoDataResponse.status, 'Data:', geoDataResponse.data);
      alert('Failed to create GeoData. Check the console for more details.');
    }
  } catch (error) {
    // Handle any errors that might occur within the try block
    console.error('An error occurred:', error);
    alert('An error occurred. Please try again later.');
  } finally {
    // Restore original button text and enable it
    submitButton.innerText = originalButtonText;
    submitButton.disabled = false;
  }
});

