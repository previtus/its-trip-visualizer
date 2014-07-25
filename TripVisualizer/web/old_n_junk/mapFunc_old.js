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
        var layerClicked = e.target;
        
        var Layer1 = layerClicked._pointerToLayer1_main;
        var Layer2 = Layer1._pointerToLayer2_secondary;
        var Layer3 = Layer1._pointerToLayer3_points
        
        Layer1.bringToFront();
        Layer2.bringToFront();
        Layer3.bringToFront();
    }
    function groupBot(e) {
        var layerClicked = e.target;
        
        var Layer1 = layerClicked._pointerToLayer1_main;
        var Layer2 = Layer1._pointerToLayer2_secondary;
        var Layer3 = Layer1._pointerToLayer3_points
        
        Layer3.bringToBack();
        Layer2.bringToBack();
        Layer1.bringToBack();
    }
    
    function visualizeGeoJSON(objJson, pointsJson, useStyle, jsonAllPoints, tripCommonProperties) {       
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
        
        var layer1_mainLine = new L.geoJson(lines,{ style: useStyle });
        layer1_mainLine.isUserMarked = true;
        layer1_mainLine._layerTypeMarker = 1;
        layer1_mainLine._tripProperties = tripCommonProperties;
        layer1_mainLine._tripProperties._colorCoding = color_starter;
        layer1_mainLine._allPoints = jsonAllPoints;
        features.addLayer( layer1_mainLine );
        
        // Secondary lines
        var thinnerStyle = useStyle;
            thinnerStyle.weight = weight_thinner;
            thinnerStyle.color = color_lighter;
            thinnerStyle.opacity = 1;
        var layer2_secondaryLine = new L.geoJson(lines,{ style: thinnerStyle });
        layer2_secondaryLine._layerTypeMarker = 2;
        features.addLayer( layer2_secondaryLine );
        
        // Points
        var geojsonMarkerOptions = {
            radius: weight_starter * 0.4,
            fillColor: color_lighter,
            color: color_starter,
            weight: weight_tmp,
            opacity: 1,
            fillOpacity: 0.8
        };
        
        var layer3_points = new L.geoJson(points, {
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions);
            }
        });
        layer3_points._layerTypeMarker = 3;
        features.addLayer( layer3_points );
        
        features._pointerToLayer1_main = layer1_mainLine;
        
        layer1_mainLine._pointerToLayer2_secondary = layer2_secondaryLine;
        layer1_mainLine._pointerToLayer3_points = layer3_points;
        
        features.__deleteable = true;
        
//        layer2_secondaryLine._pointerToLayer1_main = layer1_mainLine;
//        layer3_points._pointerToLayer1_main = layer1_mainLine;
                
        features
            //.bindPopup(desc)
            .on('click', mapClicked)
            //.on('mouseover', groupTop)
            //.on('mouseout', groupBot)
            .addTo(map);
    }

    // map onclick processing
    function mapClicked(e) {
        var clickPoint = e.latlng;
        var X = L.point(clickPoint.lat, clickPoint.lng);
        var DIST = 0.001;
        
        // zoom and distance acomondation
        var powpow = 0.81;
        var del = 4;
        var off = -0.0001;
        if (map.getZoom() > 12) {
            var t = 17-map.getZoom();
            DIST = off + (DIST / Math.pow(powpow,t))/del;
        }
        
        var closeLayers = [];
        var ind = 0;
        
        $.each(map._layers, function(i, layer) {
            // only one layer with line will have this flag
            if (layer.isUserMarked) {
                var allPoints = layer._allPoints;
                
                for (j = 0; j < allPoints.length; j++) {
                    var pointGroup = allPoints[j];
                    var brk = false;
                    
                    for (k = 0; k < pointGroup.length - 1; k++) {
                        var pointA = pointGroup[k];
                        var pointB = pointGroup[k+1];
                        
                        //pointToSegmentDistance( <Point> p, <Point> p1, <Point> p2 )
                        var A = L.point(pointA[1], pointA[0]);
                        var B = L.point(pointB[1], pointB[0]);
                        var distFromLine = L.LineUtil.pointToSegmentDistance(X, A, B);
                        
                        if (distFromLine < DIST) {
//                          console.log("_Close to line of layer: "+layer._leaflet_id+", dist: "+distFromLine);
                            closeLayers[ind] = layer;
                            layer._lastDist = distFromLine;
                            ind = ind+1;
                            
                            brk = true;
                            break;
                        }
                    }
                    if (brk) {
                        break;
                    }
                }
            }
        });
        /*
        $.each(map._layers, function(i, layer) {
            // only one layer with line will have this flag
            if (layer.isUserMarked) {
                var allPoints = layer._allPoints;
                
                var brk = false;
                
                $.each(layer._layers, function(j, subLayer) {
                    if (subLayer.getLatLngs != null) {
                        var pointsT = subLayer.getLatLngs();
                        for (t = 0; t < pointsT.length; t++) {
                            var points = pointsT[t];
                            
                            // iterate through pairs of points
                            for (k = 0; k < points.length-1; k++) {
                                var pointA = points[k];
                                var pointB = points[k+1];

                                console.log(L.Control.Distance);

                                //pointToSegmentDistance( <Point> p, <Point> p1, <Point> p2 )
                                var X = L.point(clickPoint.lat, clickPoint.lng);
                                var A = L.point(pointA.lat, pointA.lng);
                                var B = L.point(pointB.lat, pointB.lng);
                                var distFromLine = L.LineUtil.pointToSegmentDistance(X, A, B);
                                // dotLineLength(x, y, x0, y0, x1, y1, o)
//                                var distFromLine = dotLineLength(
//                                        clickPoint.lat, clickPoint.lng,
//                                        pointA.lat, pointA.lng,
//                                        pointB.lat, pointB.lng,
//                                        true
//                                );
                                if (distFromLine < DIST) {
    //                                console.log("_Close to line of layer: "+layer._leaflet_id+", dist: "+distFromLine);
                                    closeLayers["Lay"+ind] = layer;
                                    ind = ind+1;
                                    return true;
                                }
                            }
                        }
                        
                    }
                    
                });
                
            }
        });
        */
       
        if (closeLayers.length > 0) {
            // CLICKED TRIP HIGHLIGHTING:
            var debugStr = "Highlighted layers: ";
            //console.log(closeLayers);

            closeLayers.sort(function(a, b){
                //return b._lastDist-a._lastDist; // DESC by expected distance
                return a._tripProperties.trip_id-b._tripProperties.trip_id; // ASC by trip_id
            });

            var desc = ""
            for (i = 0; i < closeLayers.length; i++) {
                var Layer1 = closeLayers[i];
                var Layer2 = Layer1._pointerToLayer2_secondary;
                var Layer3 = Layer1._pointerToLayer3_points

                Layer1.bringToFront();
                Layer2.bringToFront();
                Layer3.bringToFront();

                debugStr += Layer1._leaflet_id + " (distFromClick "+Layer1._lastDist+"; tripId: "+Layer1._tripProperties.trip_id+") \n";

                // collect informations for description
                var TripInfo = Layer1._tripProperties;
                var legInfo = "";
                $.each(TripInfo._legs, function(j, leg) {
                    legInfo += leg.type + " | ";
                });
                legInfo = legInfo.slice(0,-3);
                
                var localDesc = "<div class='tripDesc'><strong style='color: "+TripInfo._colorCoding+";'>#"+TripInfo.trip_id+" "+ TripInfo.agent_id + "</strong><br>"
                    + "<div class='tripDescDetails'>" + TripInfo.gender + "; " + TripInfo.economic_activity + "; " + TripInfo.education + "<br>"
                    + TripInfo.from_activity + " -> " + TripInfo.to_activity + "<br>"
                    + "<small>" + legInfo + "</small>"
                    + "</div></div>";
                desc += localDesc;
            };

            var popup = L.popup();
            popup.setLatLng(e.latlng)
                .setContent(desc)
                .openOn(map);
                
//            $(".tripDesc strong").click(function() {
//                $(this).next().next().toggle();
//            });
            $(".tripDesc").click(function() {
                $(this).children("div").toggle();
            });
        
            //console.log(debugStr);
        }
    };
    map.on('click', mapClicked);

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
                var tripCommonProperties = trip;
                var multiPointArray = "["; // store only first and last coordinate segment
                var lineStrArr = "["; // store all coordinates to form MultiLine
                
                var FirstSegment = jQuery.parseJSON( trip._legs.leg0.geojsonpath ).coordinates;
                multiPointArray += "["+FirstSegment[0]+"],"
                
                $.each(trip._legs, function(j, leg) {
                    var coordinates = jQuery.parseJSON(leg.geojsonpath).coordinates;
                    lineStrArr += JSON.stringify(coordinates) + ",";
                    
                    var first = coordinates[0];
                    var last = coordinates[ Object.keys(coordinates).length-1 ];
                    //multiPointArray += "["+first+","+last+"],"
                    //multiPointArray += "["+first+"],"
                    multiPointArray += "["+last+"],"
                });
                lineStrArr = lineStrArr.slice(0, -1);
                lineStrArr += "]";
                
                multiPointArray = multiPointArray.slice(0, -1);
                multiPointArray += "]";
                
                var lineSegments = jQuery.parseJSON(lineStrArr);
                var allPoints = "[";
                for (k = 0; k < lineSegments.length; k++) {
                    var str = JSON.stringify( jQuery.parseJSON(lineStrArr)[k] );
                    allPoints += str.slice(1, -1) + ","; // without [, ]
                }
                allPoints = allPoints.slice(0, -1) + "]";
                var jsonAllPoints = jQuery.parseJSON(lineStrArr);
                // <HAX> - print all points!
//                multiPointArray = allPoints;
                // </HAX>

                var lineGeoData = multiLineStrToGeoJSON(lineStrArr)
                var pointGeoData = multiPointStrToGeoJSON(multiPointArray);
                
                var color = randomColorHexFromSeed(tripCommonProperties.agent_id+tripCommonProperties.trip_id);
                //var color = rainbow(numberOfTrips, i);
                //alert(color);
                var useStyle = {
                    "color": color,
                    "weight": 10,
                    "opacity": 0.8
                };
                visualizeGeoJSON(lineGeoData, pointGeoData, useStyle, jsonAllPoints, tripCommonProperties);
                
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
            processPerLegSegment(jsonData);
            //processAsWholeTrip(jsonData);
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
            if (map._layers[i].__deleteable) {
            //if (map._layers[i]._path != undefined) {
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