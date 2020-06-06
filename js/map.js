// read in listings
function get_listing_geojson() {
  var jsonFeatures = new Array();
  var request = new XMLHttpRequest();
  request.open(
    "GET",
    "http://127.0.0.1:5000/get_listings_by_description/safe",
    true
  );
  function callback(listing) {
    //console.log(listing);
    var lat = listing.latitude;
    var lon = listing.longitude;
    var feature = {
      type: "Feature",
      properties: listing,
      geometry: {
        type: "Point",
        coordinates: [lon, lat],
      },
    };

    jsonFeatures.push(feature);
    //console.log("features")
  }

  request.onload = function () {
    var data = JSON.parse(this.responseText);
    data.forEach(callback);
    L.geoJson(jsonFeatures, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
      },
    }).addTo(map);
  };
  request.send();
  return jsonFeatures;
}

var listings = get_listing_geojson();
var geojsonMarkerOptions = {
  radius: 5,
  fillColor: "#ff7800",
  color: "#000",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8,
};

var map = L.map("map", { center: [40.74706, -73.84397], zoom: 13 });
var tiles = L.tileLayer(
  "http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  }
).addTo(map);

/*$(window)
  .on("resize", function () {
    $("#map").height($(window).height()).width($(window).width());
    map.invalidateSize();
  })
  .trigger("resize");*/
