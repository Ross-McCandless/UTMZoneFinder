var latitude = 0;
var longitude = 0;
var description = 'Search for an address!';

var map = L.map('mapid', { zoomControl: false }).setView([latitude, longitude], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

function isMarkerInsidePolygon() {
    var pt = turf.point([longitude, latitude]);
    UTMZones.features.forEach(currentUTMZonePoly => {
        poly = turf.multiPolygon(currentUTMZonePoly.geometry.coordinates);
        var found = turf.booleanPointInPolygon(pt, poly);
        if (found) {
            determinedUTMZone = currentUTMZonePoly.properties.UTMZone;
        }
    });
};
isMarkerInsidePolygon();

var lastClickedPoly;
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#2DFDFF',
        fillOpacity: 0.25
    });

    layer.bringToFront();

    if (lastClickedPoly && lastClickedPoly.feature.properties.UTMZone != determinedUTMZone) {
        lastClickedPoly.bringToBack();
    }

    if (lastClickedPoly && lastClickedPoly.feature.properties.UTMZone != layer.feature.properties.UTMZone) {
        geojson.resetStyle(lastClickedPoly);
    }

    lastClickedPoly = layer;
}

function onEachFeature(feature, layer) {
    layer.on({
        click: highlightFeature
    });
    if (feature.properties) {
        layer.bindPopup('UTM Zone: ' + feature.properties.UTMZone);
    }
}

function styler(feature) {
    return {
        fillColor: 'green',
        weight: 1,
        opacity: 1,
        color: 'black',
        fillOpacity: 0.5
    };
};

var geojson;
geojson = L.geoJSON(UTMZones, {
    style: styler,
    onEachFeature: onEachFeature
}).addTo(map);

// create the geocoding control and add it to the map
var searchControl = L.esri.Geocoding.geosearch({
    useMapBounds: false,
    expanded: true,
    zoomToResult: false,
    position: 'topleft',
    collapseAfterResult: false,
    placeholder: 'Search Address or Place'
}).addTo(map);

// create an empty layer group to store the results and add it to the map
var results = L.layerGroup().addTo(map);

function clearAll() {
    results.clearLayers();
    map.closePopup();
    geojson.resetStyle();
};

// listen for the results event and add every result to the map
searchControl.on("results", function (data) {
    for (var i = data.results.length - 1; i >= 0; i--) {
        description = data.results[i].properties.LongLabel;
        longitude = data.results[i].properties.DisplayX;
        latitude = data.results[i].properties.DisplayY;
        isMarkerInsidePolygon();
        markers = L.marker([latitude, longitude]).addTo(results)
            .bindPopup(description + '<br><br>UTM Zone: ' + determinedUTMZone, { autoClose: false })
            .openPopup();
    }
});

var InfoBox = L.control({ position: 'topleft' });
InfoBox.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = '<p class="Info"><b><big>UTM Zone Finder</big><b><br><br>Search one or many addresses or places.<br><br> Made by <a href="https://www.linkedin.com/in/rossmccandless/">Ross McCandless</a></p>'
    return div;
};
InfoBox.addTo(map);