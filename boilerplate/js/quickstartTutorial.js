var map = L.map('map').setView([51.505, -0.09], 13);//represents a map object using the div id of the Dom and sets the view of the map using latlng and zoom 

//Tilelayer, this step has us adding a tileLayer or slippy map to the leaflet API 
var tileLayer /*Stadia_AlidadeSmooth*/ = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', { //add a tile layer
	maxZoom: 20,
	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
});
tileLayer.addTo(map) //Add the tile layer to map, addTo() is an inherited method of tilelayer, adds given layer to map

//L.Marker used for adding clickable icon on map
var marker = L.marker([51.5, -0.09]).addTo(map);

//L.circle used for adding a circle to the map at specified lat lng with other properties 
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

//var polygon L.polygon used for adding a polygon with nodes at specefied lat lng
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

//open a popup on the marker, circle and polygon  using .bindPopup
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup(); 
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

//Open a mopup on map at the specified lat lng 
var popup = L.popup()
    .setLatLng([51.513, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);

//function for map click event that allows user interaction
function onMapClick(e) {
    alert("You clicked the map at " + e.latlng);
}
    
map.on('click', onMapClick);

//Setting a varible popup to an Empty L.popup 
var popup = L.popup();

//function which uses var popup to express a popup interaction with user at any lat lng
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

//map.on, call onMapClick function 
map.on('click', onMapClick);