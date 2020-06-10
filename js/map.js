// read in listings
function get_listing_by_neighborhood(neighborhood) {
  var jsonFeatures = new Array();
  var request = new XMLHttpRequest();
  console.log(neighborhood);
  request.open(
    "GET",
    "http://127.0.0.1:5000/get_listings_by_neighborhood/" + neighborhood,
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
    console.log("features");
  }

  request.onload = function () {
    var data = JSON.parse(this.responseText);
    data.forEach(callback);
    L.geoJson(jsonFeatures, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
          icon: icons[Math.floor(Math.random() * icons.length)],
        });
      },
    }).addTo(layerGroup);
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
  radius: 3,
  fillColor: "#FC642D",
  color: "black",
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8,
};

function selectNeighborhood(neighborhoods) {
  var select = document.getElementById("select-neighborhood"),
    neis = neighborhoods;

  while (select.firstChild) {
    select.removeChild(select.firstChild);
  }

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
        console.log("zoomed!");
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

    layers = geojson.getLayers();

    for (var layer of layers) {
      if (layer.feature.properties.neighbourhood === data) {
        // Zoom to that layer.
        map.fitBounds(layer.getBounds());
        break;
      }
    }
    get_graph(data);
    update_neighborhood_chars(data);
    update_intro(data);
    upodate_score(data);
  });
});

function highlightFeature(e) {
  layer = e.target;
  layer.setStyle(highlightStyle);
  info.update(layer.feature.properties);
  //get_graph(layer.feature.properties.neighbourhood);
}

function resetHighlight(e) {
  layer.setStyle(defaultStyle);
  info.update();
}

function zoomToFeature(e) {
  layerGroup.clearLayers();
  var borough = e.target.feature.properties.neighbourhood_group;
  var nei = e.target.feature.properties.neighbourhood;
  $("#select-borough").val(borough);
  var request = new XMLHttpRequest();
  request.open("GET", "http://127.0.0.1:5000/get_neighborhood/", true);
  request.onload = function () {
    var neis = JSON.parse(this.responseText);
    selectNeighborhood(neis[borough]);
    $("#select-neighborhood").val(e.target.feature.properties.neighbourhood);
    get_listing_by_neighborhood(nei);
  };
  request.send();

  map.fitBounds(e.target.getBounds());
  get_graph(layer.feature.properties.neighbourhood);
  update_neighborhood_chars(layer.feature.properties.neighbourhood);
  update_intro(layer.feature.properties.neighbourhood);
  upodate_score(layer.feature.properties.neighbourhood);
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
  var margin = { top: 10, right: 35, bottom: 20, left: 35 },
    width = 280 - margin.left - margin.right,
    height = 180 - margin.top - margin.bottom;
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

    data.sort(function (a, b) {
      return a.val - b.val;
    });

    /*     var svg = d3.select("svg"),
      margin = 200,
      width = svg.attr("width") - margin,
      height = svg.attr("height") - margin; */

    var y = d3.scaleBand().range([height, 0]).padding(0.1);

    var x = d3.scaleLinear().range([0, width]);

    d3.select("#barChart").selectAll("*").remove();
    var svg = d3
      .select("#barChart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top)
      .style("stroke", "rgb(80,80,0)")
      .append("g")
      .attr(
        "transform",
        "translate(" + margin.left * 2.5 + "," + margin.top + ")"
      );

    x.domain([0, 1]);
    y.domain(
      data.map(function (d) {
        return d.key;
      })
    );

    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .on("click", function (d, i) {
        console.log("click", d.key);
        add_chips(d.key);
        add_neighborhood_chips(d.key);
        update_group_chars(d.key);
      })
      .attr("class", "bar")

      //.attr("x", function(d) { return x(d.sales); })
      .attr("width", function (d) {
        return x(d.val);
      })
      .attr("y", function (d) {
        return y(d.key);
      })
      .attr("height", 15);

    var yAxis = d3.axisLeft().tickSize(0).scale(y);

    var gy = svg
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .call((g) => g.select(".domain").remove());

    // add the x Axis
    svg
      .selectAll("text")
      .data(data)
      .enter()
      .append("text")
      .text(function (d) {
        return d.val;
      })
      //x position is 3 pixels to the right of the bar
      .attr("x", function (d) {
        return x(d.val) + 3;
      });

    // add the y Axis

    //no tick marks
    //.tickSize(0)
    //.orient("left");

    //var gy = svg.append("g").attr("class", "y axis").call(yAxis);

    // var bars = svg.selectAll(".bar").data(data).enter().append("g");
    //svg.append("g").call(d3.axisLeft(y));
  };
  request.send();
}

function add_chips(group) {
  var request = new XMLHttpRequest();
  request.open("GET", "http://127.0.0.1:5000/get_keywords/" + group, true);

  request.onload = function () {
    var data = JSON.parse(this.responseText);
    console.log(data);

    d3.select("#key-words").selectAll("*").remove();

    data.forEach(addfunction);

    function addfunction(value) {
      d3.select("#key-words").append("div").attr("class", "chip").text(value);
    }
  };
  request.send();
}

function add_neighborhood_chips(group) {
  var request = new XMLHttpRequest();
  request.open(
    "GET",
    "http://127.0.0.1:5000/get_top_clusters_groups/" + group,
    true
  );

  request.onload = function () {
    var data = JSON.parse(this.responseText);
    console.log(data);

    d3.select("#related-neighborhoods").selectAll("*").remove();

    data.forEach(addfunction);

    function addfunction(value) {
      d3.select("#related-neighborhoods")
        .append("div")
        .attr("class", "chip")
        .text(value);
    }
  };
  request.send();
}
function update_neighborhood_chars(neighbourhood) {
  $("#narra1 p").text(neighbourhood);
}

function update_group_chars(group) {
  $("#narra2 p").text(group);
  $("#narra3 p").text(group);
}

function update_intro(neighbourhood) {
  var request = new XMLHttpRequest();
  request.open(
    "GET",
    "http://127.0.0.1:5000/get_neighbor_intro/" + neighbourhood,
    true
  );
  request.onload = function () {
    var res = JSON.parse(this.responseText);
    d3.select("#intro").selectAll("*").remove();
    d3.select("#intro").append("h3").text(neighbourhood);
    d3.select("#intro")
      .append("div")
      .attr("class", "streetview")
      .attr(
        "style",
        "background-image: url('" +
          res.img +
          "');background-position: bottom center; height: 100px"
      );
    d3.select("#intro").append("h2").text(res.neighborhood_description);
    d3.select("#intro")
      .append("button")
      .attr("onclick", "window.location.herf='" + res.neighborhood_url)
      .text("More Info");
  };
  request.send();
}

function upodate_score(neighbourhood) {
  var request = new XMLHttpRequest();
  request.open(
    "GET",
    "http://127.0.0.1:5000/get_neighborhood_score/" + neighbourhood,
    true
  );
  request.onload = function () {
    var res = JSON.parse(this.responseText);
    d3.select("#scoreplace").selectAll("*").remove();
    d3.select("#scoreplace")
      .text("Average Airbnb Review Score for " + neighbourhood + ":")
      .append("a")
      .attr(
        "style",
        "color: #ff5a5f; font-family: fantasy; font-size: xx-large; top: 10px;"
      )
      .text(Math.round(res.score, 0));
  };
  request.send();
}

get_neighbourhoods_geojson();
get_borough();
//get_graph("Midtown");

var map = L.map("map", { center: [40.742413, -73.980182], zoom: 12 });
var layerGroup = L.layerGroup().addTo(map);
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
  fillColor: "#00A699",
};

var LeafIcon = L.Icon.extend({
  options: {
    //shadowUrl: "leaf-shadow.png",
    iconSize: [20, 18],
    //shadowSize: [50, 64],
    iconAnchor: [11, 20],
    //shadowAnchor: [4, 62],
    popupAnchor: [-3, -76],
  },
});

var icon1 = new LeafIcon({ iconUrl: "1.png" });
var icon2 = new LeafIcon({ iconUrl: "2.png" });
var icon3 = new LeafIcon({ iconUrl: "3.png" });
var icon4 = new LeafIcon({ iconUrl: "4.png" });
var icons = [icon1, icon2, icon3, icon4];

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
