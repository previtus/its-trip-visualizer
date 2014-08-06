/* FUNCTIONS USED AFTER DOCUMENT LOADED */
/* Most of map functionality is stored in this file. */

$(document).ready(function() {
    var debug = true;

    var map_center_x = 49.198;
    var map_center_y = 16.62;

    // INITIALIZATION:
    var map = L.map('map', {
        center: [map_center_x, map_center_y],
        zoom: 13
    });

    var baseLayers =
            ['OpenStreetMap.BlackAndWhite', 'OpenStreetMap.Mapnik', 'OpenStreetMap.HOT',
                'OpenMapSurfer.Roads',
                'MapQuestOpen.OSM', 'Stamen.Toner',
                'Esri.WorldImagery', 'HERE.hybridDay',
                'MapBox.previtus.iplk86k9'
            ],
            overlays = [
                /*'OpenWeatherMap.Clouds', 'OpenWeatherMap.PrecipitationClassic',
                 'OpenWeatherMap.PressureContour','OpenWeatherMap.Temperature',*/
                'OpenMapSurfer.AdminBounds', 'Hydda.RoadsAndLabels'
            ];

    var layerControl = L.control.layers.provided(baseLayers, overlays).addTo(map);

    // adding by hand
    // MAPBOX MAPS
    var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="http://mapbox.com">Mapbox</a>';
    var mbUrl = 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png';

    var grayscale = L.tileLayer(mbUrl, {id: 'examples.map-20v6611k', attribution: mbAttr});
    var color = L.tileLayer(mbUrl, {id: 'examples.map-i86knfo3', attribution: mbAttr});

    layerControl.addBaseLayer(grayscale, 'Mapbox grayscale');
    layerControl.addBaseLayer(color, 'Mapbox color');
    // GOOGLE MAPS
    var googleMap = new L.Google();
    var googleTerrain = new L.Google('TERRAIN');

    layerControl.addBaseLayer(googleMap, 'Google');
    layerControl.addBaseLayer(googleTerrain, 'Google Terrain');

    var gridLayer = new L.layerGroup();
    var gridIsDrawn = false;
    //layerControl.addOverlay(gridLayer, 'Grid');

    // add permalink generation function
    map.addControl(new L.Control.Permalink({text: 'Permalink', layers: layerControl}));

    map.attributionControl.setPrefix('');
    map.boxZoom.disable();

    // resizeable
    $(".BOX_FILTERS").resizable({handles: 's'});
    $(".BOX_GRAPHS").resizable({handles: 's'});
//    $("#map").resizable({
//        stop: function( event, ui ) {
//            //console.log(ui.size);
//            //ui.size.height ui.size.width
//            $("#map").css("height",ui.size.height);
//            $("#map").css("width",ui.size.width);
//            map.invalidateSize();
//        }
//    });

    // GRID OVERLAY
    // grid settings
    var SelectedPolygons = [];
    var GridSettings = {
        start_x: map_center_x,
        start_y: map_center_y,
        x_step: 0.01,
        y_step: 0.03,
        x_times: 4,
        y_times: 3
    };

    function drawGrid() {
        if (gridIsDrawn) {
            deleteGrid();
        }

        var xmin = GridSettings.start_x - GridSettings.x_times * GridSettings.x_step;
        var xmax = GridSettings.start_x + GridSettings.x_times * GridSettings.x_step;
        var ymin = GridSettings.start_y - GridSettings.y_times * GridSettings.y_step;
        var ymax = GridSettings.start_y + GridSettings.y_times * GridSettings.y_step;
        var x, y;
        for (x = xmin; x <= xmax; x += GridSettings.x_step)
        {
            for (y = ymin; y <= ymax; y += GridSettings.y_step)
            {
                var p1 = new L.LatLng(x, y),
                        p2 = new L.LatLng(x + GridSettings.x_step, y),
                        p3 = new L.LatLng(x + GridSettings.x_step, y + GridSettings.y_step),
                        p4 = new L.LatLng(x, y + GridSettings.y_step),
                        polygonPoints = [p1, p2, p3, p4];

                var defaultStyle = {
                    color: "#333344",
                    weight: 1, /* weight of grid line */
                    opacity: 0.3, /* grid line opacity */
                    fillOpacity: 0.2, /* grid fill opacity */
                    fillColor: "#333344"
                };

                var polygon = new L.Polygon(polygonPoints, defaultStyle);
                polygon.on('click', function(e) {
                    //alert('x: '+x+', y: '+y);
                    //console.log( polygon.getBounds() );
                    //console.log( polygon );
                    this.setStyle({fillOpacity: 0, opacity: 0.1});

                    //                var tmp = [];
                    //                for (i = 0; i < 4; i++) {
                    //                    console.log( this.toGeoJSON().geometry.coordinates[0][i] );
                    //                    
                    //                    tmp.push( this.toGeoJSON().geometry.coordinates[0][i] );
                    //                }

                    //SelectedPolygons.push(tmp);
                    SelectedPolygons.push(this.toGeoJSON().geometry.coordinates[0]);
                    this.off('click');

                    onChange(null);

                    //console.log(tmp);
                    //console.log(SelectedPolygons);
                    //console.log(this.toGeoJSON().geometry.coordinates);
                });
                gridLayer.addLayer(polygon);
            }
        }
        gridIsDrawn = true;
    }
    function deleteGrid() {
        //console.log(gridLayer);

        $.each(gridLayer._layers, function(i, layer) {
            map.removeLayer(layer);
        });

        gridIsDrawn = false;
        SelectedPolygons = [];
    }

    map.addLayer(gridLayer);
    drawGrid();

    // visualization
    function getLayerByTripId(tripId) {
        var l = null;
        $.each(map._layers, function(i, layer) {
            if (layer.isUserMarked) {
                if (layer._tripProperties.trip_id) {
                    if (layer._tripProperties.trip_id == tripId) {
                        l = layer;
                        return l;
                    }
                }
            }
        });
        return l;
    }
    
    var lastHighlighted = null;
    function highlightById(tripId) {
        var layer = getLayerByTripId(tripId);
        if (layer != null) {
            console.log("highlighting "+layer._tripProperties.trip_id);
            console.log(layer);
            layer.bringToFront();
            var tmpStyle_L1 = window.mouseOverStyle;
            layer.setStyle(tmpStyle_L1);
        }
    }
    function highlightEndId(tripId) {
        var layer = getLayerByTripId(tripId);
        if (layer != null) {
            console.log("de-highlighting "+layer._tripProperties.trip_id);
            console.log(layer);
            
            layer.bringToBack();
            var styleDefault_L1 = window.defaultStyle;
            styleDefault_L1.color = layer._tripProperties._colorCoding;
            layer.setStyle(styleDefault_L1);
        }
    }
    
    function groupTop(e) {
        var layerClicked = e.target;

        var Layer1 = layerClicked._pointerToLayer1_main;

        // bring it up
        Layer1.bringToFront();

        if (detailLVL > 1) {
            var Layer2 = Layer1._pointerToLayer2_secondary;
            Layer2.bringToFront();
            var tmpStyle_L2 = window.mouseOverSecondaryStyle;
            tmpStyle_L2.color = Layer1._tripProperties._colorCodingLight;
            Layer2.setStyle(tmpStyle_L2);
        }

        if (detailLVL > 2) {
            var Layer3 = Layer1._pointerToLayer3_points
            Layer3.bringToFront();
            var tmpStyle_L3 = window.mouseOverMarkerStyle;

            tmpStyle_L3.color = Layer1._tripProperties._colorCoding;
            tmpStyle_L3.fillColor = Layer1._tripProperties._colorCodingLight;
            Layer3.setStyle(tmpStyle_L3);
        }

        // change style
        var tmpStyle_L1 = window.mouseOverStyle;
        Layer1.setStyle(tmpStyle_L1);
    }
    function groupBot(e) {
        var layerClicked = e.target;

        var Layer1 = layerClicked._pointerToLayer1_main;

        if (detailLVL > 2) {
            var Layer3 = Layer1._pointerToLayer3_points
            Layer3.bringToBack();
            var styleDefault_L3 = window.defaultMarkerStyle;
            styleDefault_L3.color = Layer1._tripProperties._colorCoding;
            styleDefault_L3.fillColor = Layer1._tripProperties._colorCodingLight;
            Layer3.setStyle(styleDefault_L3);
        }

        if (detailLVL > 1) {
            var Layer2 = Layer1._pointerToLayer2_secondary;
            Layer2.bringToBack();
            var styleDefault_L2 = window.defaultSecondaryStyle;
            styleDefault_L2.color = Layer1._tripProperties._colorCodingLight;
            Layer2.setStyle(styleDefault_L2);
        }


        Layer1.bringToBack();

        var styleDefault_L1 = window.defaultStyle;
        styleDefault_L1.color = Layer1._tripProperties._colorCoding;
        Layer1.setStyle(styleDefault_L1);

    }

    function visualizeGeoJSON(objJson, pointsJson, jsonAllPoints, tripCommonProperties) {
        var color_seed = tripCommonProperties.agent_id + " " + (5*tripCommonProperties.trip_id)+JSON.stringify(objJson);
        var color_starter = colorFromStrSeed(color_seed);

        //console.log(color_starter);

        //var color_starter = randomColorHexFromSeed(tripCommonProperties.agent_id+tripCommonProperties.trip_id);

        // hax, only one line drawn, do it with the nicer color
        if (detailLVL == 1) {
            color_starter = ColorLuminance(color_starter, 0.8);
        }

        var useStyle = {};
        useStyle.color = color_starter;
        useStyle.weight = window.defaultStyle.weight;
        useStyle.opacity = window.defaultStyle.opacity;

        var color_lighter = ColorLuminance(useStyle.color, 0.8);

        // Main lines
        var lines = {
            "type": "Feature",
            "geometry": objJson,
            "properties": tripCommonProperties
        };
        var points = {
            "type": "Feature",
            "geometry": pointsJson
        };

        var features = new L.featureGroup();
        var layer1_mainLine = new L.geoJson(lines, {style: useStyle});
        layer1_mainLine.isUserMarked = true;
        layer1_mainLine._layerTypeMarker = 1;
        layer1_mainLine._tripProperties = tripCommonProperties;
        layer1_mainLine._tripProperties._colorCoding = color_starter;
        layer1_mainLine._tripProperties._colorCodingLight = color_lighter;
        layer1_mainLine._allPoints = jsonAllPoints;
        features.addLayer(layer1_mainLine);

        //tripCommonProperties._layer1id = layer1_mainLine.getLayerId();
        tripCommonProperties._layer1id = layer1_mainLine._leaflet_id;

        if (detailLVL > 1) {
            // Secondary lines
            var thinnerStyle = useStyle;
            thinnerStyle.weight = window.defaultSecondaryStyle.weight;
            thinnerStyle.color = color_lighter;
            thinnerStyle.opacity = 1;
            var layer2_secondaryLine = new L.geoJson(lines, {style: thinnerStyle});
            layer2_secondaryLine._layerTypeMarker = 2;
            features.addLayer(layer2_secondaryLine);
            layer1_mainLine._pointerToLayer2_secondary = layer2_secondaryLine;
        }
        if (detailLVL > 2) {
            // Points
            var geojsonMarkerOptions = window.defaultMarkerStyle;
            geojsonMarkerOptions.fillColor = color_lighter;
            geojsonMarkerOptions.color = color_starter;

            var layer3_points = new L.geoJson(points, {
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            });
            layer3_points._layerTypeMarker = 3;
            features.addLayer(layer3_points);
            layer1_mainLine._pointerToLayer3_points = layer3_points;
        }

        features._pointerToLayer1_main = layer1_mainLine;
        features.__deleteable = true;

//        layer2_secondaryLine._pointerToLayer1_main = layer1_mainLine;
//        layer3_points._pointerToLayer1_main = layer1_mainLine;

        features
                //.bindPopup(desc)
                .on('click', mapClicked)
                .on('mouseover', groupTop)
                .on('mouseout', groupBot)
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
            var t = 17 - map.getZoom();
            DIST = off + (DIST / Math.pow(powpow, t)) / del;
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
                        var pointB = pointGroup[k + 1];

                        //pointToSegmentDistance( <Point> p, <Point> p1, <Point> p2 )
                        var A = L.point(pointA[1], pointA[0]);
                        var B = L.point(pointB[1], pointB[0]);
                        var distFromLine = L.LineUtil.pointToSegmentDistance(X, A, B);

                        if (distFromLine < DIST) {
//                          console.log("_Close to line of layer: "+layer._leaflet_id+", dist: "+distFromLine);
                            closeLayers[ind] = layer;
                            layer._lastDist = distFromLine;
                            ind = ind + 1;

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

        if (closeLayers.length > 0) {
            // CLICKED TRIP HIGHLIGHTING:
            var debugStr = "Highlighted layers: ";
            //console.log(closeLayers);

            closeLayers.sort(function(a, b) {
                //return b._lastDist-a._lastDist; // DESC by expected distance
                return a._tripProperties.trip_id - b._tripProperties.trip_id; // ASC by trip_id
            });

            var desc = ""
            for (i = 0; i < closeLayers.length; i++) {
                var Layer1 = closeLayers[i];
                Layer1.bringToFront();
                if (detailLVL > 1) {
                    var Layer2 = Layer1._pointerToLayer2_secondary;
                    Layer2.bringToFront();
                }
                if (detailLVL > 2) {
                    var Layer3 = Layer1._pointerToLayer3_points;
                    Layer3.bringToFront();
                }
                debugStr += Layer1._leaflet_id + " (distFromClick " + Layer1._lastDist + "; tripId: " + Layer1._tripProperties.trip_id + ") \n";

                // collect informations for description
                var TripInfo = Layer1._tripProperties;
                var legInfo = "";
                $.each(TripInfo._legs, function(j, leg) {
                    legInfo += leg.type + " | ";
                });
                legInfo = legInfo.slice(0, -3);

console.log(TripInfo);

                var localDesc = "<div class='tripDesc' id='"+TripInfo.trip_id+"'><span style='color: " + TripInfo._colorCoding + ";'>#" + TripInfo.trip_id + " <strong>" + TripInfo.agent_id + "</strong></span><br>"
                        + "<div class='tripDescDetails'>"
                        + "<strong>trip time:</strong> <small>" + msecToTime(TripInfo.t_start_time) + " to " + msecToTime(TripInfo.t_end_time) + "</small><br>"
                        + "<strong>trip dest:</strong> <small>" + TripInfo.from_activity.toLowerCase() + " -> " + TripInfo.to_activity.toLowerCase() + "</small><br>"
                        + "<div class='agentInfoBar'>"
                            + "<strong>gender:</strong> "+ genderToStr(TripInfo.gender) + " <strong>age:</strong> "+ TripInfo.age + "<br>"
                            + "<strong>education:</strong> " + TripInfo.education.toLowerCase() + " <strong>economic.:</strong> " + TripInfo.economic_activity.toLowerCase() + "<br>"
                            + "<strong>driver's licence:</strong> " + booToStr(TripInfo.drivers_licence) + " <strong>pt. card:</strong> " + booToStr(TripInfo.pt_discount_card) + "<br>"
                        + "</div>"
                        + "<strong>legs:</strong> "+"<small>" + legInfo + "</small>"
                        + "</div></div>";
                desc += localDesc;
            };

            var popup = L.popup();
            popup.setLatLng(e.latlng)
                    .setContent(desc)
                    .openOn(map);

            if (closeLayers.length > 3) {
                // hide most of them
                $(".tripDesc").children("div").slice(2).toggle();
            }

            $(".tripDesc").each(function() {
                var currentId = $(this).attr('id');
                
//                $("#"+currentId)
//                    .on('mouseover', highlightById(currentId))
//                    .on('mouseout', highlightEndId(currentId));
                
                $("#"+currentId).mouseover(function() {
                    highlightById(currentId);
                });
                
                $("#"+currentId).mouseout(function() {
                    highlightEndId(currentId);
                });
            });

            $(".tripDesc").click(function() {
                $(this).children("div").toggle();
            });

            //console.log(debugStr);
        }
    }
    ;
    map.on('click', mapClicked);

    //processing
    function processMultipleTripsData(jsonData) {
        // restart stats
        STATS = {};
        STATS.Agents = {};
        STATS.Trips = {};
        STATS.Legs = {};

        STATS.byAgentProp = {};
        STATS.byLegProp = {};
        STATS.byLegProp.type = {};
        
        STATS.byTripProp = {};
        STATS.byTripProp.from_activity = {};
        STATS.byTripProp.to_activity = {};
        
        STATS.byTimeDist = {};
        initNames_forTimeCategories();
        //console.log(STATS.byTimeDist);
        STATS.byLegTimeDist = {};
        initNames_forLegTimeCategories();
        
        // init zeros
        $.each(InitNamesForAgentProps, function(propName, propValues) {
            STATS.byAgentProp[propName] = {};
            for (i = 0; i < propValues.length; i++) {
                // for example STATS.byAgentProp.gender.FEMALE = 0
                var tmp = STATS.byAgentProp[propName];
                tmp[ propValues[i] ] = 0;
            }
        });
        STATS.byAgentProp.isEmpty = true;
        //console.log(STATS.byAgentProp);
        // init STATS.byLegProp.type
        $.each(InitTypesForLegs, function(propName, propValues) {
            STATS.byLegProp[propName] = {};
            for (i = 0; i < propValues.length; i++) {
                var tmp = STATS.byLegProp[propName];
                tmp[ propValues[i] ] = 0;
            }
        });
        //console.log(STATS.byLegProp);
        
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
             *      - education,agent_id,gender,pt_discount_card,t_end_time,economic_activity,t_start_time, ..... atd
             *      - _legsLoaded : int number of loaded legs
             *      - _legs:
             *          leg0 az leg<_legsLoaded-1>:
             *              - l_start_time, l_end_time, type, geojsonpath
             */
            // foreach trip:
            var numberOfTrips = Object.keys(jsonData).length;
            
            $.each(jsonData, function(i, trip) {
                if (jQuery.isNumeric(trip)) {
                    return true; // = continue
                }
                var tripCommonProperties = trip;

                /* STATS */
                // for each trip:
                //  - save pointer to trip to STATS.Trips.<trip_id> -> trip //without agent and leg info
                //  - save leg info into array of legs STATS.Legs.<trip_id> -> [array of legs]
                //  - save agent info into STATS.Agents.<agent_id> (don't override if we already have this Agent loaded)

                // assigment of array or object is treated through reference pointer (thus all the data structures are not copied by these assignments...)

                // 1.) save to STATS.Trips (ignore legs and agent info in this as well ... we wont be using it and I want to prevent object cloning...)
                var trip_id = trip.trip_id;
                var agent_id = trip.agent_id;
                // VAR A -> no cloning (which is + now), but mess
                // STATS.Trips[trip_id] = trip; // wish I could make it a subset of this object without neccessity of cloning
                // VAR B -> cloning (shallow one), but neat
                
                STATS.Trips[trip_id] = _.pick(trip, 'trip_id', 't_start_time', 't_end_time', 'from_activity', 'to_activity', 'agent_id');
                STATS.Trips[trip_id].numberOfLegs = Object.keys(trip._legs).length;

                //from_activity, to_activity
                if (STATS.byTripProp.from_activity[ STATS.Trips[trip_id].from_activity ] == null) {
                    STATS.byTripProp.from_activity[ STATS.Trips[trip_id].from_activity ] = 1;
                } else {
                    STATS.byTripProp.from_activity[ STATS.Trips[trip_id].from_activity ] += 1;
                }
                if (STATS.byTripProp.to_activity[ STATS.Trips[trip_id].to_activity ] == null) {
                    STATS.byTripProp.to_activity[ STATS.Trips[trip_id].to_activity ] = 1;
                } else {
                    STATS.byTripProp.to_activity[ STATS.Trips[trip_id].to_activity ] += 1;
                }

                // 2.) save to STATS.Legs
                STATS.Legs[trip_id] = trip._legs;
                
                for (var t in trip._legs) {
                    var leg = trip._legs[t];
                    
                    if (STATS.byLegProp.type[ leg.type ] == null) {
                        STATS.byLegProp.type[ leg.type ] = 1;
                    } else {
                        STATS.byLegProp.type[ leg.type ] += 1;
                    }
                    
                    // TIME FOR LEGS
                    // leg.l_start_time, leg.l_end_time
                    var s = leg.l_start_time;
                    var startCat = timeLegCategoryFromTime(s);
                    var e = leg.l_end_time;
                    var endCat = timeLegCategoryFromTime(e);

                    var fiftyPerc = timeLegCatSize*0.5;
                    if (startCat == endCat) {
                        STATS.byLegTimeDist[startCat]++;
                    } else if ((endCat - startCat) == 1) {
                        var c = endCat * timeLegCatSize;
                        var atLeastOne = false;
                        if ((c - s)>fiftyPerc) {
                            STATS.byLegTimeDist[startCat]++;
                            atLeastOne = true;
                        }

                        if ((e - c)>fiftyPerc) {
                            STATS.byLegTimeDist[endCat]++;
                            atLeastOne = true;
                        }

                        if (!atLeastOne) {
                            if ((c - s)>(e - c)) {
                                STATS.byLegTimeDist[startCat]++;
                            } else {
                                STATS.byLegTimeDist[endCat]++;
                            }
                        }
                    } else {
                        var cFirst = (startCat+1) * timeLegCatSize; // first central point
                        if ((cFirst-s)>fiftyPerc) {
                            STATS.byLegTimeDist[startCat]++;
                        }
                        for (var tmp_i = startCat+1; tmp_i < endCat; tmp_i++) {
                            STATS.byLegTimeDist[tmp_i]++;
                        }
                        var cLast = endCat * timeLegCatSize; // first central point
                        if ((e-cLast)>fiftyPerc) {
                            STATS.byLegTimeDist[endCat]++;
                        }
                    }
                }
                //STATS.byLegProp[propName];

                // 3.) save to STATS.Agents
                //STATS.Agents[agent_id] = _.pick(trip, '');
                if (STATS.Agents[agent_id] == null) {
                    // doesn't exist yet
                    STATS.Agents[agent_id] = _.pick(trip, 'agent_id', 'age', 'gender', 'education', 'marital_status', 'economic_activity', 'drivers_licence', 'pt_discount_card');
                    STATS.Agents[agent_id]._trips = [trip_id];
                    STATS.Agents[agent_id].ageCategory = countAgeCategoryFromAge(trip.age);
                    
                    // BUILD ARRAYS OF USED VALUES of AGENT - with voluntary initialization
                    // plus one to for example this structure STATS.byAgentProp.gender.FEMALE
                    // parse through accepted properties
                    $.each(InitNamesForAgentProps, function(propName, nevermind_initiallyAcceptedValues) {                        
                        var property = STATS.byAgentProp[propName];
                        var value = trip[propName];
                        if (propName === "age") {
                            // age is special - convert it to category
                            value = catTostr( countAgeCategoryFromAge(trip.age) );
                        }

                        if (property[value] == null) {
                            // wasn't initiated
                            property[value] = 1;
                            STATS.byAgentProp.isEmpty = false;
                        } else {
                            property[value] += 1;
                            STATS.byAgentProp.isEmpty = false;
                        }

                        // here we could build back-pointers to agents with these properties
                        var propNameGroup = propName + "_pointers";

                        if (STATS.byAgentProp[propNameGroup] == null) {
                            STATS.byAgentProp[propNameGroup] = {};
                        }
                        var pointerArr = STATS.byAgentProp[propNameGroup];
                        if (pointerArr[value] == null) {
                            pointerArr[value] = [agent_id];
                        } else {
                            pointerArr[value].push(agent_id);
                        }
                        // \ end of that ... we probably won't use it anyway ...
                    });


                } else {
                    STATS.Agents[agent_id]._trips.push(trip_id);
                }
                
                // 4. TIME STATS
                var logLevel = 0; // 3 all; 2 only multi-interval
                
                if (logLevel>2) console.log("-next-trip--------------------------------------");
                // trip.t_start_time, trip.t_end_time
                var s = trip.t_start_time;
                var startCat = timeCategoryFromTime(s);
                var e = trip.t_end_time;
                var endCat = timeCategoryFromTime(e);
                if (logLevel>2) console.log("S: "+s+" = "+msecToTimeHM(s)+" (cat "+startCat+"); end: "+e+" = "+msecToTimeHM(e)+" (cat "+endCat+")");
                
                var fiftyPerc = timeCatSize*0.5;
                if (startCat == endCat) {
                    // I-------------------I
                    //           s.....e
                    // time interval only in one category
                    
                    STATS.byTimeDist[startCat]++;
                    
                    if (logLevel>2) console.log("start: "+s+" (cat "+startCat+"); end: "+e+"(cat "+endCat+")");
                    if (logLevel>2) console.log("plusplus to <"+startCat+"> //one interval only");
                } else if ((endCat - startCat) == 1) {
                    var c = endCat * timeCatSize;
                    // I-------------------I-------------------I
                    //           s........[C]..e
                    // time interval in two categories - even if its <50% we must assign it to at least one
                    if (logLevel>2) console.log("start: "+s+"; C: "+c+"; end: "+e);
                    var atLeastOne = false;
                    if ((c - s)>fiftyPerc) {
                        STATS.byTimeDist[startCat]++;
                        atLeastOne = true;
                        if (logLevel>2) console.log("plusplus to <"+startCat+"> //two intervals - first is >50%");
                    }
                    
                    if ((e - c)>fiftyPerc) {
                        STATS.byTimeDist[endCat]++;
                        atLeastOne = true;
                        if (logLevel>2) console.log("plusplus to <"+endCat+"> //two intervals - first is >50%");
                    }
                    
                    if (!atLeastOne) {
                        // add the one which has larger segment
                        if ((c - s)>(e - c)) {
                            STATS.byTimeDist[startCat]++;
                            if (logLevel>2) console.log("plusplus to <"+startCat+"> //two intervals - larger one (first)");
                        } else {
                            STATS.byTimeDist[endCat]++;
                            if (logLevel>2) console.log("plusplus to <"+endCat+"> //two intervals - larger one (second)");
                        }
                    }
                } else {
                    if (logLevel>2) console.log("start: "+s+" (cat "+startCat+"); end: "+e+"(cat "+endCat+")");
                    // I---I---I---I---I---I
                    //  s.[C].........[C].e
                    // time interval in multiple categories
                    // solve the first and last category
                    var cFirst = (startCat+1) * timeCatSize; // first central point
                    if ((cFirst-s)>fiftyPerc) {
                        STATS.byTimeDist[startCat]++;
                        if (logLevel>1) console.log("plusplus to <"+startCat+"> // start of multi");
                    }
                    
                    // solve all in between
                    // I---I---I---I---I---I
                    //  xx[C].........[C]xx
                    //  plusplus to <startCat+1> --- <endCat-1>
                    for (var tmp_i = startCat+1; tmp_i < endCat; tmp_i++) {
                        STATS.byTimeDist[tmp_i]++;
                        if (logLevel>1) console.log("plusplus to <"+tmp_i+"> // part");
                    }
                    
                    // last category
                    var cLast = endCat * timeCatSize; // first central point
                    if ((e-cLast)>fiftyPerc) {
                        STATS.byTimeDist[endCat]++;
                        if (logLevel>1) console.log("plusplus to <"+endCat+"> // end of multi");
                    }
                }
                if (logLevel>2) console.log(STATS.byTimeDist);
                
                
                /* ende-STATS */

                var multiPointArray = "["; // store only first and last coordinate segment
                var lineStrArr = "["; // store all coordinates to form MultiLine

                // Random offset with random string seed
                var seedStr = tripCommonProperties.agent_id + " " + tripCommonProperties.trip_id;
                var offset = offsetFromStrSeed(seedStr);

                var FirstSegment = jQuery.parseJSON(trip._legs.leg0.geojsonpath).coordinates[0];
                FirstSegment = offsetArrayOfPoints(FirstSegment, offset);
                multiPointArray += "[" + FirstSegment[0] + "],"

                $.each(trip._legs, function(j, leg) {
                    // <offset?>
                    var coordinates = jQuery.parseJSON(leg.geojsonpath).coordinates[0];
                    // coordinates is array of points
                    coordinates = offsetArrayOfPoints(coordinates, offset);

                    lineStrArr += JSON.stringify(coordinates) + ",";

                    var last = coordinates[ coordinates.length - 1 ];
                    multiPointArray += "[" + last + "],"
                });
                lineStrArr = lineStrArr.slice(0, -1);
                lineStrArr += "]";

                multiPointArray = multiPointArray.slice(0, -1);
                multiPointArray += "]";

                var lineSegments = jQuery.parseJSON(lineStrArr);
                var allPoints = "[";
                for (k = 0; k < lineSegments.length; k++) {
                    var str = JSON.stringify(jQuery.parseJSON(lineStrArr)[k]);
                    allPoints += str.slice(1, -1) + ","; // without [, ]
                }
                allPoints = allPoints.slice(0, -1) + "]";
                var jsonAllPoints = jQuery.parseJSON(lineStrArr);
                // <HAX> - print all points!
//                multiPointArray = allPoints;
                // </HAX>

                var lineGeoData = multiLineStrToGeoJSON(lineStrArr);
                var pointGeoData = multiPointStrToGeoJSON(multiPointArray);

                visualizeGeoJSON(lineGeoData, pointGeoData, jsonAllPoints, tripCommonProperties);
            });

            //console.log(STATS.Agents);
            //console.log(STATS.byAgentProp);
            //console.log(STATS.Legs);
            console.log(STATS.byTimeDist);
        }
    }

    function multiLineStrToGeoJSON(multilineStr) {
        var jsonString = "{\"type\": \"MultiLineString\",\"coordinates\": " + multilineStr + "}";

        var geoData = jQuery.parseJSON(jsonString);
        return geoData;
    }
    function multiPointStrToGeoJSON(str) {
        var jsonString = "{\"type\": \"MultiPoint\",\"coordinates\": " + str + "}";

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

    var xhr = null;
    function getMultipleTrips(dataToBeSent) {
        $(".loadingIcon").show();
        
        if (xhr !== null) {
            // abort any previous unfinished request calls
            xhr.abort();
        }
        
        xhr = $.post("getFilteredData.jsp", dataToBeSent)
                .done(function(data) {
                    //clear map
                    //if ($("#autoReset").is(':checked')) {
                        clearMap();
                    //}
                    //
                    //recieve response
                    //$(".tempServerResponseTxt").show();
                    //$(".tempServerResponse").show();
                    //$(".tempServerResponse").text($.trim(data));
                    var jsonData = jQuery.parseJSON(data);
                    processMultipleTripsData(jsonData);
                    processMultipleTripsDataExploration(jsonData);
                    drawGraphs();
                    
                    $(".loadingIcon").hide();
                    xhr = null;
                });
    }
    function getMultipleTripsExplore(dataToBeSent) {
        $.post("getFilteredData.jsp", dataToBeSent)
                .done(function(data) {
                    //recieve response
                    //$(".tempServerResponseTxt").show();
                    //$(".tempServerResponse").show();
                    //$(".tempServerResponse").text($.trim(data));
                    var jsonData = jQuery.parseJSON(data);
                    processMultipleTripsDataExploration(jsonData);
                });
    }

    function processMultipleTripsDataExploration(jsonData) {
        //console.log(jsonData);
        $(".filterPrediction").show();
        $("#tripCount").text(jsonData.trips);
        $("#agentCount").text(jsonData.agents);
        $("#legCount").text(jsonData.legs);
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
        if (value !== "-" && value !== null) {
            object[name] = value;
        }
    }

    function collectDataFromForm(isExploratory) {
        //prepare data
        var dataToBeSent = {};
//         setIfNotEmpty(dataToBeSent, "agent_id", $("#agent_id").val());
//         setIfNotEmpty(dataToBeSent, "trip_id", $("#trip_id").val());
        // by activity
        setIfSelected(dataToBeSent, "from_act", $("#from_act").val());
        setIfSelected(dataToBeSent, "to_act", $("#to_act").val());
        
        // by transport type
        setIfSelected(dataToBeSent, "trans_type", $("#trans_type").val());

        // by agent info
        if ($(".multiselectAgesFrom").val() !== "-") {
            dataToBeSent.age_from = $(".multiselectAgesFrom").val();
        }
        if ($(".multiselectAgesTo").val() !== "-") {
            dataToBeSent.age_to = $(".multiselectAgesTo").val();
        }

        setIfSelected(dataToBeSent, "gender", $('input[name=gender]:checked').val());
        setIfSelected(dataToBeSent, "education", $("#education").val());
        setIfSelected(dataToBeSent, "maritalStatus", $("#maritalStatus").val());
        setIfSelected(dataToBeSent, "economicalActivity", $("#economicalActivity").val());
        setIfSelected(dataToBeSent, "driveLicence", $('input[name=driveLicence]:checked').val());
        setIfSelected(dataToBeSent, "ptCard", $('input[name=ptCard]:checked').val());

        // add rectangle selection filter
        setIfNotEmpty(dataToBeSent, "bound_a_lat", $("#BoundA_lat").val());
        setIfNotEmpty(dataToBeSent, "bound_a_lon", $("#BoundA_lon").val());
        setIfNotEmpty(dataToBeSent, "bound_b_lat", $("#BoundB_lat").val());
        setIfNotEmpty(dataToBeSent, "bound_b_lon", $("#BoundB_lon").val());

        // add time period filter
        // default values: min: 2262200, max: 85944980
        if ($("#timeRange_slider").slider("values", 0) > 2262200) {
            dataToBeSent.time_start = $("#timeRange_slider").slider("values", 0);
        }
        if ($("#timeRange_slider").slider("values", 1) < 85944980) {
            dataToBeSent.time_end = $("#timeRange_slider").slider("values", 1);
        }

        dataToBeSent.isExploratory = isExploratory;

        if (gridIsDrawn) {
            //dataToBeSent.boundaries = JSON.stringify(SelectedPolygons);
            dataToBeSent.boundaries = SelectedPolygons;
            dataToBeSent.boundaries_numOfBoxes = SelectedPolygons.length;
        }

        //send it
        if (isExploratory) {
            getMultipleTripsExplore(dataToBeSent);
        } else {
            getMultipleTrips(dataToBeSent);
        }
    }

    $("#ButtonFilteredData").click(function() {
        collectDataFromForm(false);
    });

    // Bind (Isaac) form change onto function
    function onChange(e) {
        //console.log(e);
        //alert("Something changed ... i can smell it in the water!\n"+e);

        // CALL SCRIPT THAT WILL EVALUATE THE NUMBER OF Trips/Agents/Legs AFFECTED
        // call small script - only explore
        //collectDataFromForm(true);
        // call the whole Behemoth with all drawing ...
        collectDataFromForm(false);
    }

    $("select").change(function(e) {
        if (e.originalEvent) { // filter only user interaction
            onChange(e);
        }
    });
    $("input").change(function(e) {
        if (e.originalEvent) {
            onChange(e);
        }
    });

    $(".multiselectCustom").multiselect({
        buttonClass: 'btn form-control',
        includeSelectAllOption: true,
        numberDisplayed: 2,
        onDropdownHide: function(element, checked) {
            onChange(element);
        }
    });

    $(".multiselectAgesFrom").multiselect({
        buttonClass: 'btn btn-sm form-control',
        enableFiltering: true,
        maxHeight: 400,
        onDropdownHide: function(element, checked) {
            onChange(element);

            //alert( $('.multiselectAgesFrom').val() );
            //$(".multiselectAgesTo").children().prop('disabled', false);
            //$(".multiselectAgesTo").children().slice(0, $('.multiselectAgesFrom').val() ).prop('disabled', true);
            //$(".multiselectAgesTo").children().each(function(){
            //    $(this).prop('disabled', true);
            //});
            //minAgeSetTo($('.multiselectAgesFrom').val());
        }
    });
    $(".multiselectAgesTo").multiselect({
        buttonClass: 'btn btn-sm form-control',
        enableFiltering: true,
        maxHeight: 400,
        onDropdownHide: function(element, checked) {
            onChange(element);

            //$(".multiselectAgesFrom").children().attr("disabled", "enabled");
            //$(".multiselectAgesFrom").children().slice( $('.multiselectAgesFrom').val() ).attr("disabled", "disabled");
            //maxAgeSetTo($('.multiselectAgesTo').val());
        }
    });

    $(window).load(function() {
        onChange();
    });

    $("#ButtonRedraw").click(function() {
        deleteGrid();
        drawGrid();
        
        onChange();
    });
    $("#ButtonDeleteGrid").click(function() {
        deleteGrid();
        
        onChange();
    });
    // #ButtonGenGraphsTMP in graphFunc.js
});