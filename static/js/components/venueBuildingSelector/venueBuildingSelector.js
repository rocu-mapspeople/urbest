// Function to populate the venue select dropdown
function populateVenueDropdown(venues) {
  const venueSelect = document.getElementById('venue-select');

  venues.forEach((venue) => {
    const option = document.createElement('option');
    option.value = venue.id;
    option.textContent = venue.name;
    venueSelect.appendChild(option);
  });

  // Attach event listener to venue select dropdown
  venueSelect.addEventListener('change', handleVenueSelection);
}

// Function to handle the venue selection event
function handleVenueSelection(event) {
  const venueId = event.target.value;
  const buildingSelect = document.getElementById('building-select');

  // Clear existing options from the building select dropdown
  buildingSelect.innerHTML = '';

  // Retrieve the buildings for the selected venue
  mapsindoors.services.VenuesService.getBuildings(venueId).then((buildings) => {
    // Populate the building select dropdown with the retrieved buildings
    buildings.forEach((building) => {
      const option = document.createElement('option');
      option.value = building.id;
      option.textContent = building.name;
      buildingSelect.appendChild(option);
    });
  });
}

// Retrieve the venues and populate the venue select dropdown
mapsindoors.services.VenuesService.getVenues().then((venues) => {
  populateVenueDropdown(venues);
});
