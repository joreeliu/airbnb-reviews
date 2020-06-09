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
  request.open("GET", "http://127.0.0.1:5000/get_neighborhood_geo/", true);

  request.onload = function () {
    var data = JSON.parse(this.responseText);
    var nei_style = defaultStyle;
    geojson = L.geoJson(data, {
      style: nei_style,
      onEachFeature: onEachFeature,
    }).addTo(map);

    // method that we will use to update the control based on feature properties passed
    info.update = function (props) {
      this._div.innerHTML =
        "<h4>Location</h4>" +
        (props
          ? "<b>" +
          props.neighbourhood +
          "</b><br />" +
          props.neighbourhood_group
          : "Hover over a neighborhood");
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
  $("#select-borough").trigger("change");
  $("#select-borough").change(function () {
    var data = $(this).val();

    if (data == "Select Borough") {
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
  $("#select-neighborhood").trigger("change");
  $("#select-neighborhood").change(function () {
    var data = $(this).val();

    if (data == "Select Neighborhood") {
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
    //get_graph(layer.feature.properties.neighbourhood);
  });
});

function highlightFeature(e) {
  layer = e.target;
  layer.setStyle(highlightStyle);
  info.update(layer.feature.properties);
  get_graph(layer.feature.properties.neighbourhood);
}

function resetHighlight(e) {
  layer.setStyle(defaultStyle);
  info.update();
}

function zoomToFeature(e) {
  var borough = e.target.feature.properties.neighbourhood_group;
  $("#select-borough").val(borough);
  var request = new XMLHttpRequest();
  request.open("GET", "http://127.0.0.1:5000/get_neighborhood/", true);
  request.onload = function () {
    var neis = JSON.parse(this.responseText);
    selectNeighborhood(neis[borough]);
    $("#select-neighborhood").val(e.target.feature.properties.neighbourhood);
  };
  request.send();

  map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature,
  });
}

function getColor(d) {
  return d > 1000
    ? "#800026"
    : d > 500
      ? "#BD0026"
      : d > 200
        ? "#E31A1C"
        : d > 100
          ? "#FC4E2A"
          : d > 50
            ? "#FD8D3C"
            : d > 20
              ? "#FEB24C"
              : d > 10
                ? "#FED976"
                : "#FFEDA0";
}

function style(feature) {
  return {
    fillColor: getColor(feature.properties.density),
    weight: 2,
    opacity: 1,
    color: "white",
    dashArray: "3",
    fillOpacity: 0.7,
  };
}

function get_graph(neighborhood) {
  // set the dimensions and margins of the graph
  var margin = { top: 30, right: 35, bottom: 200, left: 35 },
    width = 380 - margin.left - margin.right,
    height = 360 - margin.top - margin.bottom;
  //console.log(width);

  var request = new XMLHttpRequest();
  request.open(
    "GET",
    "http://127.0.0.1:5000/get_neighbor_cluster_count/" + neighborhood,
    true
  );

  //console.log(svg.attr(width));
  request.onload = function () {
    var data = JSON.parse(this.responseText);
    console.log(data);

    /*     var svg = d3.select("svg"),
      margin = 200,
      width = svg.attr("width") - margin,
      height = svg.attr("height") - margin; */

      var y = d3.scaleBand()
      .range([height, 0])
      .padding(0.1);

var x = d3.scaleLinear()
      .range([0, width]);
      
    d3.select("#barChart").selectAll("*").remove();
    var svg = d3
      .select("#barChart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("stroke", "rgb(80,80,0)")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain([0, d3.max(data, function(d){ return d.val; })])
      y.domain(data.map(function(d) { return d.key; }));

      svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      //.attr("x", function(d) { return x(d.sales); })
      .attr("width", function(d) {return x(d.val); } )
      .attr("y", function(d) { return y(d.key); })
      .attr("height", y.bandwidth());

  // add the x Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

  // add the y Axis
  svg.append("g")
      .call(d3.axisLeft(y));
  };
  request.send();
}

get_neighbourhoods_geojson();
get_borough();
//get_graph("Midtown");

var map = L.map("map", { center: [40.742413, -73.980182], zoom: 12 });
var geojson = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  }
).addTo(map);

var info = L.control();
var highlightStyle = {
  color: "black",
  weight: 3,
  opacity: 0.6,
  fillOpacity: 0.7,
  fillColor: "yellow",
};

var defaultStyle = {
  fillColor: "white",
  weight: 3,
  color: "black",
  fillOpacity: 0.2,
};
var formatPercent = d3.format(".0%");
info.onAdd = function (map) {
  this._div = L.DomUtil.create("div", "info"); // create a div with a class "info"
  this.update();
  return this._div;
};

info.setPosition("topleft");
