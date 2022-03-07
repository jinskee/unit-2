//declare map variable in global scope
var map;
var dataStats = {};
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

/*function calculateMinValue(data){
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
};*/

function calcStats(data) {
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for (var city of data.features) {
      //loop through each year
      for (var year = 1985; year <= 2015; year += 5) {
        //get population for current year
        var value = city.properties["Pop_" + String(year)];
        //add value to array
        allValues.push(value);
      }
    }
    //get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function (a, b) {
      return a + b;
    });
    dataStats.mean = sum / allValues.length;
  }

//calculate the radius of each proportional symbol 
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly 
    var minRadius = 5;
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/dataStats.min,0.5715) * minRadius

    return radius;
};

/*From Chapter 6 example 1.2, refactored procedural code: function createPopupContent(properties, attribute){
    //add the city popup content string
    var popupContent = "<p><b>City:</b> " + properties.City + "</p>";

    //add formatted attribute to panel content string 
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Population in " + year + ":</b> " + properties[attribute] + " million</p>";

    return popupContent;
};*/

//constuctor function: Object oriented approach instead assigns the variables as properties of an object. 
//These properties then can be inherited by other child objects.
//Special type of "parent" object- similar to class in many object-oriented languages- is created by a constructor function.
//Becasue this functoin is analogous to a class, it is convention to capitalize the firs letter of a constructor funtions name.
function PopupContent(properties, attribute){
    this.properties = properties;
    this.attribute = attribute;
    this.year = attribute.split("_")[1];
    this.population = this.properties[attribute];
    this.formatted = "<p><b>City:</b> " + this.properties.City + "</p><p><b>Population in " + this.year + ":</b> " + this.population + " million</p>";
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
    var popupContent = new PopupContent(feature.properties, attribute); //createPopupContent(feature.properties, attribute); //"<p><b>City:</b> " + feature.properties.skiArea + "</p>";
    
    //Create another popup based on the fires
    var popupContent2 = Object.create(popupContent);

    //change the formatting of popupContent2 
    popupContent2.formatted = "<h2>" + popupContent.population + " million</h2>";
    
    console.log(popupContent.formatted)//original popup content 
    //from chapter 5: add formateed attribute to popup content string 
    //From chapter 5: var year = attribute.split("_")[1]; 
    
    //From Chapter 5: popupContent += "<p><b>Population in : " + year + ":</b> " + feature.properties[attribute] + " millions</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent2.formatted, {
        offset: new L.Point(0,-options.radius) 
    });

    //From chapter 5: Bind the popup to the circle marker addin an offset to each circle marker as to not cover symbol
    //layer.bindPopup(popupContent, {
    //    offset: new L.Point(0,-options.radius) 
    //}); From chapter 5

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

function getCircleValues(attribute) {
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
      max = -Infinity;
  
    map.eachLayer(function (layer) {
      //get the attribute value
      if (layer.feature) {
        var attributeValue = Number(layer.feature.properties[attribute]);
  
        //test for min
        if (attributeValue < min) {
          min = attributeValue;
        }
  
        //test for max
        if (attributeValue > max) {
          max = attributeValue;
        }
      }
    });
  
    //set mean
    var mean = (max + min) / 2;
  
    //return values as an object
    return {
      max: max,
      mean: mean,
      min: min,
    };
  }
  
  function updateLegend(attribute) {
    //create content for legend
    var year = attribute.split("_")[1];
    //replace legend content
    document.querySelector("span.year").innerHTML = year;
  
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(attribute);
  
    for (var key in circleValues) {
      //get the radius
      var radius = calcPropRadius(circleValues[key]);
  
      document.querySelector("#" + key).setAttribute("cy", 59 - radius);
      document.querySelector("#" + key).setAttribute("r", radius)
  
      document.querySelector("#" + key + "-text").textContent = Math.round(circleValues[key] * 100) / 100 + " million";
    }
  };
function updatePropSymbols(attribute){

    //var year = attribute.split("_")[1];
    //update temporal legend
    //document.querySelector("span.year").innerHTML = year;
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = new PopupContent(props, attribute);//createPopupContent(props, attribute);//"<p><b>City: </b> " + props.City + "</p>";

            //From chapter 5: add formatted attribute to panel content string
            //var year = attribute.split("_")[1];
            //popupContent += "<p><b>Population in : " + year + ":</b> " + props[attribute] + " millions</p>";

            //update popup content            
            var popup = layer.getPopup();            
            popup.setContent(popupContent.formatted).update();
        };
    });

    updateLegend(attribute);
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
    //console.log(attributes);

    return attributes;
};

function createSequenceControls(attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            //create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')

            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class ="step" id="reverse" title="Reverse"><img src="img/reverse.png"></button>');

            container.insertAdjacentHTML('beforeend', '<button class ="step" id="forward" title="Forward"><img src="img/forward.png"></button>');

            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());  
    
    // add listeners after adding control!!!
    //Set Slider attributes
    document.querySelector(".range-slider").max = 6; 
    document.querySelector(".range-slider").min = 0; 
    document.querySelector(".range-slider").value = 0; 
    document.querySelector(".range-slider").step = 1; 

    var steps = document.querySelectorAll('.step');

    steps.forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;
            //step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //step 7: if past the last attribute, wrap around to first attribute
                index = index > 6 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 6 : index;
            };

            //step 8: update slider
            document.querySelector('.range-slider').value = index;

            //step 9: pass new attribute to update symbols
            updatePropSymbols(attributes[index]);
        })
    })
    //step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        //step 6: get new index value
        var index = this.value;

        //step 9: pass new attribute to update symbols
        updatePropSymbols(attributes[index]);
    });
};

/*//Step 1: Create new sequence controls
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
};*/


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

function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        
        onAdd: function () {
            //create the control container with a particular class name
            var container = L.DomUtil.create("div", "legend-control-container");

            //PUT YOUR SCRIPT TO CREATE TEMPORAL LEGEND HERE
            container.innerHTML = '<p class="temporalLegend">Population in <span class="year">1980</span></p>';

            //Step 1 start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="160px" height="60px">';

            //array of circle names to base loop on 
            var circles = ["max", "mean", "min"];

            //step 2: loop to add each circle and text to svg string
            for (var i=0; i < circles.length; i++){
                //calculate r and cy
                var radius = calcPropRadius(dataStats[circles[i]]);
                console.log(radius);
                var cy = 59 - radius;
                console.log(cy);
                
                //circle string
                svg +=
                '<circle class="legend-circle" id="' +
                circles[i] +
                '" r="' +
                radius +
                '"cy="' +
                cy +
                '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';
      
              //evenly space out labels
              var textY = i * 20 + 20;
      
              //text string
              svg +=
                '<text id="' +
                circles[i] +
                '-text" x="65" y="' +
                textY +
                '">' +
                Math.round(dataStats[circles[i]] * 100) / 100 +
                " million" +
                "</text>";
            }

            //close svg string
            svg += "</svg>";

            //add an attribute legend svg to container
            container.insertAdjacentHTML('beforeend',svg);// += svg;

            return container;
        },
    });

    map.addControl(new LegendControl());
};

//function to retrieve the data and place it on the map
function getData(map){
    //load the data
    fetch("data/MegaCities.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processData(json);
            //calculate minimum data value
            //minValue = calculateMinValue(json);
            calcStats(json)
            //create marker options
            //callfunction to create proportional symbols
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
            createLegend(attributes);
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
