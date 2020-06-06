function callback(listing, jsonFeatures) {
  var lat = listing.latitude;
  var lon = listing.longitude;
  var feature = {
    type: "Feature",
    properties: {
      name: "Dunkin Donuts",
      address: "1 Broadway #1, Cambridge, MA 02142",
      latitude: lat,
      longitude: lon,
    },
    geometry: {
      type: "Point",
      coordinates: [-71.083372, 42.362504],
    },
  };

  jsonFeatures.push(feature);
}
