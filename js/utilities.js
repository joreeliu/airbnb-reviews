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

var request = new XMLHttpRequest();
request.open("GET", "http://127.0.0.1:5000/get_neighborhood/", true);
request.onload = function () {
  var neis = JSON.parse(this.responseText);
  //console.log(Object.keys(neis));
  selectBorough(Object.keys(neis));
  var borough = document.getElementById("select-borough").nodeValue;
  //selectNeighborhood(neis[borough]);
};
request.send();
