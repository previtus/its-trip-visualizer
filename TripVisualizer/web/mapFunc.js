/* FUNCTIONS USED AFTER DOCUMENT LOADED */

$(document).ready(function() {
    var debug = true;

    // INITIALIZATION:
    var map = L.map('map').setView([49.202, 16.577], 13);
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '<a href="http://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18
    }).addTo(map);
    map.attributionControl.setPrefix('');

    $("#map").resizable({
        stop: function( event, ui ) {
            //console.log(ui.size);
            //ui.size.height ui.size.width
            $("#map").css("height",ui.size.height);
            $("#map").css("width",ui.size.width);
            map.invalidateSize();
        }
    });

    // visualization
    function visualizeGeoJSON0(objJson, desc) {
        //console.log(objJson);
        L.geoJson(objJson)
                .bindPopup(desc)
                .addTo(map);
    }
    function visualizeGeoJSON1(objJson, desc, useStyle) {
        L.geoJson(objJson,{ style: useStyle })
                .bindPopup(desc)
                .addTo(map);
    }
    
    function groupTop(e) {
        var layer = e.target;
        //console.log(layer);
        layer.bringToFront();
    }
    function groupBot(e) {
        var layer = e.target;
        layer.bringToBack();
    }
    function groupClicked(e) {
        var layer = e.target;
        layer.bringToFront();
    }
    
    function visualizeGeoJSON(objJson, desc, useStyle, pointsJson) {
        var color_starter = useStyle.color;
        var color_lighter = ColorLuminance(useStyle.color, 0.8);
        //var color_even_lighter = ColorLuminance(useStyle.color, .95);
        
        var weight_starter = useStyle.weight;
        var weight_thinner = useStyle.weight * 0.55;
        var weight_tmp = (weight_starter - weight_thinner)/2;
        
        // Main lines
        var lines = {
            "type": "Feature",
            "geometry": objJson
        };
        var points = {
            "type": "Feature",
            "geometry": pointsJson
        };
        
        var features = new L.featureGroup();
        features.addLayer( new L.geoJson(lines,{ style: useStyle }) );
        
        // Secondary lines
        var thinnerStyle = useStyle;
            thinnerStyle.weight = weight_thinner;
            thinnerStyle.color = color_lighter;
            thinnerStyle.opacity = 1;
        features.addLayer(new L.geoJson(lines,{ style: thinnerStyle }));
        
        // Points
        var geojsonMarkerOptions = {
            radius: weight_starter * 0.4,
            fillColor: color_lighter,
            color: color_starter,
            weight: weight_tmp,
            opacity: 1,
            fillOpacity: 0.8
        };
        features.addLayer(new L.geoJson(points, {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            })
        );
        
        $.each(features._layers, function(i, layer) {
            //console.log(i);
            layer.isUserMade = true;
        });
        
        features
            .bindPopup(desc)
            //.on('click', groupClicked)
            .on('mouseover', groupTop)
            //.on('mouseout', groupBot)
            .addTo(map);
    }

    // <SlightHorror>
//    map.on('click', function(e) {
//	//alert(e.latlng);
//        
//        var dxy = 200;
//        //var southWest = L.latLng(e.latlng.lat - dxy, e.latlng.lng - dxy);
//        //var northEast = L.latLng(e.latlng.lat + dxy, e.latlng.lng + dxy);
//        //var bounds = L.latLngBounds(southWest, northEast);
//        
//        //console.log(map);
//        var closeLayers = {};
//        var ind = 1;
//        
//        $.each(map._layers, function(i, layer) {
//            if (layer.isUserMade) {
//                //console.log(layer);
//                var brk = false;
//                
//                $.each(layer._layers, function(j, subLayer) {
//                    if (subLayer.getLatLngs != null) {
//                        var pointsT = subLayer.getLatLngs();
//                        var points = pointsT[0];
//                        
//                        $.each(points, function(k, point) {
//                            if (!brk) {
//                                if (point.distanceTo(e.latlng) < dxy) {
//                                    //console.log(point.distanceTo(e.latlng));
//                                    //console.log(point);
//                                    
//                                    closeLayers["Lay"+ind] = layer;
//                                    ind = ind+1;
//                                    brk = true;
//                                }
//                            }
//                            
//                        });
//                        
//                    }
//                    
//                });
//                
//            }
//        });
//        
//        //console.log(closeLayers);
//        $.each(closeLayers, function(i, closeLayer) {
//            closeLayer.bringToFront();
//        });
//    });
    // </SlightHorror>

    //processing
    function processMultipleTripsData(data) {
        var jsonData = jQuery.parseJSON(data);
        if (jsonData.hasOwnProperty("error")) {
            // report error
            var msg = "---- \<ERROR\> ----\nerror: " + jsonData.error + "\nerror message: " + jsonData.errorMessage;
            if (debug) {
                alert(msg);
            } else {
                console.log(msg);
            }
        } else {
            // everything went ok...
            // ###### JSON object's structure is as follows: ######
            /* jsonData:
             *  - <int trip_id>:
             *      - education,agent_id,gender,pt_discount_card,end_time,economic_activity,start_time, ..... atd
             *      - _legsLoaded : int number of loaded legs
             *      - _legs:
             *          leg0 az leg<_legsLoaded-1>:
             *              - l_start_time, l_end_time, type, geojsonpath
             */
            // foreach trip:
            var numberOfTrips = Object.keys(jsonData).length;
            
            $.each(jsonData, function(i, trip) {
                var commonProperties = trip;
                var multiPointArray = "["; // store only first and last coordinate segment
                var lineStrArr = "["; // store all coordinates to form MultiLine
                
                $.each(trip._legs, function(j, leg) {
                    var coordinates = jQuery.parseJSON(leg.geojsonpath).coordinates;
                    lineStrArr += JSON.stringify(coordinates) + ",";
                    
                    var first = coordinates[0];
                    var last = coordinates[ Object.keys(coordinates).length-1 ];
                    multiPointArray += "["+first+","+last+"],"
                });
                lineStrArr = lineStrArr.slice(0, -1);
                lineStrArr += "]";
                
                multiPointArray = multiPointArray.slice(0, -1);
                multiPointArray += "]";
                
                var desc = "<div class='tripSegmentDesc'><strong>" + commonProperties.agent_id + "</strong><br>"
                    + commonProperties.gender + " " + commonProperties.economic_activity + " " + commonProperties.education + "<br>"
                    + commonProperties.from_activity + " -> " + commonProperties.to_activity
                    + "</div>";
                var lineGeoData = multiLineStrToGeoJSON(lineStrArr)
                var pointGeoData = multiPointStrToGeoJSON(multiPointArray);
                
                var color = randomColorHexFromSeed(commonProperties.agent_id+commonProperties.trip_id);
                //var color = rainbow(numberOfTrips, i);
                //alert(color);
                var useStyle = {
                    "color": color,
                    "weight": 10,
                    "opacity": 0.8
                };
                visualizeGeoJSON(lineGeoData, desc, useStyle, pointGeoData);
                
            });
        }
    }
    
    //processing one trip at time - was used in communication with "getOneTrip.jsp"
    function processTripData(data) {
        var jsonData = jQuery.parseJSON(data);

        if (jsonData.hasOwnProperty("error")) {
            // report error
            var msg = "---- \<ERROR\> ----\nerror: " + jsonData.error + "\nerror message: " + jsonData.errorMessage;
            if (debug) {
                alert(msg);
            } else {
                console.log(msg);
            }
        } else {
            // everything went ok...
            //processPerLegSegment(jsonData);
            processAsWholeTrip(jsonData);
        }
    }
    
    function processPerLegSegment (jsonData) {
            $.each(jsonData, function(i, item) {
                processLegData(item);
                //alert(i+":\n"+jsonData[i]);
                //alert(i+":\n"+item);
            });
    }
    function processLegData(jsonData) {
        console.log(jsonData);

        var geoData = jQuery.parseJSON(jsonData.geojsonpath);
        var desc = "<div class='legSegmentDesc'><strong>" + jsonData.agent_id + "</strong><br>"
                + jsonData.gender + " " + jsonData.economic_activity + " " + jsonData.education + "<br>"
                + "<strong>" + jsonData.type + "</strong><br>"
                + jsonData.from_activity + " -> " + jsonData.to_activity
                + "</div>";
        visualizeGeoJSON0(geoData, desc);
    }
    
    function processAsWholeTrip (jsonData) {
            var lineStrArr = "[";
            var commonProperties = {};
            var loadedFirst = false;
            $.each(jsonData, function(i, item) {
                
                var coordinates = jQuery.parseJSON(item.geojsonpath).coordinates;
                lineStrArr += JSON.stringify(coordinates) + ",";
                
                if (!loadedFirst) {
                    commonProperties = item;
                    loadedFirst = true;
                }
                //alert(i+":\n"+jsonData[i]);
                //alert(i+":\n"+item);
            });
            lineStrArr = lineStrArr.slice(0, -1);
            lineStrArr += "]";
            
            var desc = "<div class='tripSegmentDesc'><strong>" + commonProperties.agent_id + "</strong><br>"
                + commonProperties.gender + " " + commonProperties.economic_activity + " " + commonProperties.education + "<br>"
                + commonProperties.from_activity + " -> " + commonProperties.to_activity
                + "</div>";
            var geoData = multiLineStrToGeoJSON(lineStrArr)
            
            var color = randomColorHexFromSeed(commonProperties.agent_id);
            //alert(color);
            var useStyle = {
                "color": color,
                "weight": 7,
                "opacity": 0.8
            };           
            visualizeGeoJSON1(geoData, desc, useStyle);
    }
    function multiLineStrToGeoJSON(multilineStr) {
        var jsonString = "{\"type\": \"MultiLineString\",\"coordinates\": "+multilineStr+"}";
        
        var geoData = jQuery.parseJSON(jsonString);
        return geoData;
    }
    function multiPointStrToGeoJSON(str) {
        var jsonString = "{\"type\": \"MultiPoint\",\"coordinates\": "+str+"}";
        
        var geoData = jQuery.parseJSON(jsonString);
        return geoData;
    }

    // map control
    function lookAt(lat, lon) {
        var latlng = L.latLng(lat, lon);
        map.panTo(latlng);
    }

    function clearMap() {
        for (i in map._layers) {
            if (map._layers[i]._path != undefined) {
                try {
                    map.removeLayer(map._layers[i]);
                }
                catch (e) {
                    console.log("problem with " + e + map._layers[i]);
                }
            }
        }
    }

    // server comunination
    function getOneTrip(tripId) {
        $.post("getOneTrip.jsp", {trip_id: tripId})
                .done(function(data) {
                    processTripData(data);
                });
    }
    
    function getMultipleTrips(dataToBeSent) {
        $.post("getFilteredData.jsp", dataToBeSent)
                .done(function(data) {
                    //recieve response
                    //$(".tempServerResponse").text($.trim(data));
                    processMultipleTripsData(data);
                });
    }

    // BUTTON REACTIONS:
    $("#ButtonFromServer").click(function() {
        var tripId = $("#tripId").val();
        getOneTrip(tripId);
    });

    $("#ButtonFromServerRange").click(function() {
        var tripIdFrom = $("#tripId_slider").slider("values", 0);
        var tripIdTo = $("#tripId_slider").slider("values", 1);

        for (var i = tripIdFrom; i < tripIdTo; i++) {
            getOneTrip(i);
        }
    });

    $("#ButtonClearMap").click(function() {
        clearMap();
    });

    function setIfNotEmpty(object, name, value) {
        // use this with text field (text input)
        if ($.trim(value)) {
            object[name] = value;
        }
    }
    function setIfSelected(object, name, value) {
        // use this with selection <select> or radio (radio input)
        if (value !== "-") {
            object[name] = value;
        }
    }

    $("#ButtonFilteredData").click(function() {
        //prepare data
        var dataToBeSent = {};
        if ($("#filter_byId_check").is(':checked')) {
            setIfNotEmpty(dataToBeSent, "agent_id", $("#agent_id").val());
            setIfNotEmpty(dataToBeSent, "trip_id", $("#trip_id").val());
        }
        
        if ($("#filter_byActiv_check").is(':checked')) {
            setIfSelected(dataToBeSent, "from_act", $("#from_act").val());
            setIfSelected(dataToBeSent, "to_act", $("#to_act").val());
        }

        if ($("#filter_byTransportType_check").is(':checked')) {
            setIfSelected(dataToBeSent, "trans_type", $("#trans_type").val());
        }

        if ($("#filter_byAgentInfo_check").is(':checked')) {
            if ($("#age").val() !== "-" && $.trim($("#age_val").val())) {
                dataToBeSent.age = $("#age").val();
                dataToBeSent.age_val = $("#age_val").val();
            }

            setIfSelected(dataToBeSent, "gender", $('input[name=gender]:checked').val());
            setIfSelected(dataToBeSent, "education", $("#education").val());
            setIfSelected(dataToBeSent, "maritalStatus", $("#maritalStatus").val());
            setIfSelected(dataToBeSent, "economicalActivity", $("#economicalActivity").val());
            setIfSelected(dataToBeSent, "driveLicence", $('input[name=driveLicence]:checked').val());
            setIfSelected(dataToBeSent, "ptCard", $('input[name=ptCard]:checked').val());
        }


        //send it
        getMultipleTrips(dataToBeSent);
    });


});