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
    geojson = L.geoJson(jsonFeatures, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geojsonMarkerOptions);
      },
    }).addTo(map);
  };
  request.send();
  return jsonFeatures;
}


function get_neighbourhoods_geojson() {
  var request = new XMLHttpRequest();
  request.open(
    "GET",
    "http://127.0.0.1:5000/get_neighborhood_geo/",
    true
  );

  request.onload = function () {
    var data = JSON.parse(this.responseText);
    geojson = L.geoJson(data,
      {
        onEachFeature: onEachFeature
      }).addTo(map);

    // method that we will use to update the control based on feature properties passed
    info.update = function (props) {
      this._div.innerHTML = '<h4>Location</h4>' + (props ?
        '<b>' + props.neighbourhood + '</b><br />' + props.neighbourhood_group
        : 'Hover over a state');
    };

    info.addTo(map);
  };
  request.send();
}


var geojsonMarkerOptions = {
  radius: 5,
  fillColor: "#ff7800",
  color: "#000",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8,
};

function selectNeighborhood(neighborhoods) {
  var select = document.getElementById("select-neighborhood"),
    neis = neighborhoods;
  for (var i = 0; i < neis.length; i++) {
    var option = document.createElement("OPTION"),
      txt = document.createTextNode(neis[i]);
    option.appendChild(txt);
    option.setAttribute("value", neis[i]);
    select.insertBefore(option, select.lastChild);
  }
}

function selectBorough(borough) {
  var select = document.getElementById("select-borough"),
    neis = borough;
  for (var i = 0; i < neis.length; i++) {
    var option = document.createElement("OPTION"),
      txt = document.createTextNode(neis[i]);
    option.appendChild(txt);
    option.setAttribute("value", neis[i]);
    select.insertBefore(option, select.lastChild);
  }
}

function get_borough() {
  var request = new XMLHttpRequest();
  request.open("GET", "http://127.0.0.1:5000/get_neighborhood/", true);
  request.onload = function () {
    var neis = JSON.parse(this.responseText);
    selectBorough(Object.keys(neis));
  };
  request.send();
}

function get_neighborhood(borough) {
  var request = new XMLHttpRequest();
  request.open("GET", "http://127.0.0.1:5000/get_neighborhood/", true);
  request.onload = function () {
    var neis = JSON.parse(this.responseText);
    selectNeighborhood(neis[borough]);
  };
  request.send();
}


$(function () {
  $('#select-borough').trigger('change');
  $('#select-borough').change(function () {
    var data = $(this).val();

    if (data == 'Select Borough') {
      return;
    }

    console.log(data);

    layers = geojson.getLayers();

    for (var layer of layers) {
      if (layer.feature.properties.neighbourhood_group === data) {
        // Zoom to that layer.
        map.fitBounds(layer.getBounds(), { maxZoom: 13 });
        break;
      }
    }
    get_neighborhood(data);
  });
});

$(function () {
  $('#select-neighborhood').trigger('change');
  $('#select-neighborhood').change(function () {
    var data = $(this).val();

    if (data == 'Select Neighborhood') {
      return;
    }

    console.log(data);

    for (var layer of layers) {
      if (layer.feature.properties.neighbourhood === data) {
        // Zoom to that layer.
        map.fitBounds(layer.getBounds());
        break;
      }
    }
  });
});

function highlightFeature(e) {
  layer = e.target;
  info.update(layer.feature.properties);
}

function resetHighlight(e) {
  info.update();
}

function zoomToFeature(e) {
  var borough = e.target.feature.properties.neighbourhood_group;
  $('#select-borough').val(borough);
  var request = new XMLHttpRequest();
  request.open("GET", "http://127.0.0.1:5000/get_neighborhood/", true);
  request.onload = function () {
    var neis = JSON.parse(this.responseText);
    selectNeighborhood(neis[borough]);
    $('#select-neighborhood').val(e.target.feature.properties.neighbourhood);
  };
  request.send();

  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
}

function getColor(d) {
  return d > 1000 ? '#800026' :
    d > 500 ? '#BD0026' :
      d > 200 ? '#E31A1C' :
        d > 100 ? '#FC4E2A' :
          d > 50 ? '#FD8D3C' :
            d > 20 ? '#FEB24C' :
              d > 10 ? '#FED976' :
                '#FFEDA0';
}

function style(feature) {
  return {
    fillColor: getColor(feature.properties.density),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  };
}

function get_graph(neighborhood) {

  // set the dimensions and margins of the graph
  var margin = { top: 30, right: 30, bottom: 70, left: 60 },
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  var svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  var request = new XMLHttpRequest();
  request.open(
    "GET",
    "http://127.0.0.1:5000/get_neighbor_cluster_count/" + neighborhood,
    true
  );

  request.onload = function () {
    var data = JSON.parse(this.responseText);
    console.log(data);

    var svg = d3.select("svg"),
      margin = 200,
      width = svg.attr("width") - margin,
      height = svg.attr("height") - margin

    var xScale = d3.scaleBand().range([0, width]).padding(0.4),
      yScale = d3.scaleLinear().range([height, 0]);
    var g = svg.append("g")
      .attr("transform", "translate(" + 100 + "," + 100 + ")");

    xScale.domain(data.map(function (d) { return d.key; }));
    yScale.domain([0, d3.max(data, function (d) { return d.val; })]);

    g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale));

    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat(function (d) {
        return d;
      }).ticks(10));


    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) { return xScale(d.key); })
      .attr("y", function (d) { return yScale(d.val); })
      .attr("width", xScale.bandwidth())
      .attr("height", function (d) { return height - yScale(d.val); });

  };
  request.send();
}


get_neighbourhoods_geojson();
get_borough();
get_graph('Midtown');


var map = L.map("map", { center: [40.74706, -73.84397], zoom: 13 });
var geojson = L.tileLayer(
  "http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',

  }
).addTo(map);

var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
  this.update();
  return this._div;
};


