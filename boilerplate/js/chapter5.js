//declare map variable in global scope
var map;
//function to instantiate the leaflet map
function createMap(){
    map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

//Add OSM base tilelayer
    var Stadia_AlidadeSmooth = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
	    maxZoom: 20,
	    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(map)

    //call the getData function
    
    getData(map);
};

function calculateMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var city of data.features){
        //loop through each year
        for(var year = 1985; year <= 2015; year+=5){
            //get population for current year
            var value = city.properties["Pop_"+ String(year)];
            //add value to array 
            allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)

    return minValue;
}

//calculate the radius of each proportional symbol 
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly 
    var minRadius = 5;
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};


//Function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute value to visualize with proportional symbols
    var attribute = attributes[0];

    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
        
    };

    //For each feature, determine its value for the selected attribute 
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //Create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string starting with city
    var popupContent = "<p><b>City:</b> " + feature.properties.skiArea + "</p>";
    
    //add formateed attribute to popup content string 
    var year = attribute.split("_")[1]; 
    
    popupContent += "<p><b>Population in : " + year + ":</b> " + feature.properties[attribute] + " millions</p>";

    //Bind the popup to the circle marker addin an offset to each circle marker as to not cover symbol
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius) 
    });

    //return the circle marker to the L.geojson pointToLayer option
    return layer;
};

//add circle markers or point features to the map
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON Layer and add it to map 
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//Create an array of the sequential attributes
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into the attribute array
    for (var attribute in properties){
        //only take attributes with snowfall values
        if (attribute.indexOf("Pop") > -1){
            attributes.push(attribute);
        };
    };

    //check the resulg
    console.log(attributes);

    return attributes;
};

//Step 1: Create new sequence controls
function createSequenceControls(attributes){
    //create range input element (Slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);
    //console.log("IS THIS WORKING");
    
    //set slider attributes
    document.querySelector(".range-slider").max = 6;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    //add step buttons
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse">Reverse</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward">Forward</button>');

    //replace button content with images
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>")
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>")

    //Example 3.6 click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;
            console.log(index);
            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 6 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 6 : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider').value = index;

            updatePropSymbols(attributes[index]);
        })
    })

    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        var index = this.value;
        //console.log(index);
        updatePropSymbols(attributes[index]);
    });
};

function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = "<p><b>City: </b> " + props.City + "</p>";

            //add formatted attribute to panel content string
            var year = attribute.split("_")[1];
            popupContent += "<p><b>Population in : " + year + ":</b> " + props[attribute] + " millions</p>";

            //update popup content            
            popup = layer.getPopup();            
            popup.setContent(popupContent).update();
        };
    });
};
/* From Activity 5 onEachFeature
function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};*/

//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    fetch("data/SnowFall.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processData(json);
            //calculate minimum data value
            minValue = calculateMinValue(json);
            //create marker options
            //callfunction to create proportional symbols
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
        }) 
};
document.addEventListener('DOMContentLoaded', createMap)
/*
//add circle markers or point features to the map
function createPropSymbols(data){
    //Determine which attribute to visualize with proportional symbols
    var attribute = "Pop_2015"
    //create marker options
    var geojsonMarkerOptions = {
        //radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1, 
        opacity: 1,
        fillOpacity: 0.8,
        radius: 8
    };

    

    //create a Leaflet GeoJSON Layer and add it to map 
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {

            //Step 5: For each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);

            //step 6: Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);

            //examine the attribute value to check that it is correct 
            console.log(feature.properties, attValue);

            //create circle markers
            return L.circleMarker(latlng, geojsonMarkerOptions);
        }
    }).addTo(map);
};

/* From Activity 5 onEachFeature
function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    fetch("data/MegaCities.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //calculate minimum data value
            minValue = calculateMinValue(json);
            //create marker options
            //callfunction to create proportional symbols
            createPropSymbols(json);
        }) 
};
document.addEventListener('DOMContentLoaded', createMap)*/
