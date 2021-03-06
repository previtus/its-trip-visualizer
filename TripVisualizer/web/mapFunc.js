/* FUNCTIONS USED AFTER DOCUMENT LOADED */
/* Most of map functionality is stored in this file. */
var map;
var globalGridHandler;
var globalChangeHandler;
$(document).ready(function() {
    var debug = true;

    // default for Brno > [16.61398, 49.20553];
    var map_center_x = 49.20553;
    var map_center_y = 16.61398;

    // INITIALIZATION:
    map = L.map('map', {
        center: [map_center_x, map_center_y],
        zoom: 13
    });

    var baseLayers =
            ['OpenStreetMap.BlackAndWhite', 'OpenStreetMap.HOT',
                'Stamen.Toner',
                'Esri.WorldImagery'
            ];

    var layerControl = L.control.layers.provided(baseLayers).addTo(map);

    // adding by hand
    // MAPBOX MAPS
    var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery Â© <a href="http://mapbox.com">Mapbox</a>';
    var mbUrl = 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png';

    var grayscale = L.tileLayer(mbUrl, {id: 'examples.map-20v6611k', attribution: mbAttr});
    var color = L.tileLayer(mbUrl, {id: 'examples.map-i86knfo3', attribution: mbAttr});

    layerControl.addBaseLayer(grayscale, 'Mapbox grayscale');

    var gridLayer = new L.layerGroup();
    var gridIsDrawn = false;
    var popupIsOpened = false;
    //layerControl.addOverlay(gridLayer, 'Grid');

    // add permalink generation function
    map.addControl(new L.Control.Permalink({text: 'Permalink', layers: layerControl}));

    map.attributionControl.setPrefix('');
    map.boxZoom.disable();

    // GRID OVERLAY
    // grid settings
    var SelectedPolygons = [];
    var gridCenter = [16.61398, 49.20553];
    var GridSettings = {
        start_x: gridCenter[1],
        start_y: gridCenter[0],
        x_step: 0.0108,
        y_step: 0.03,
        x_times: 4,
        y_times: 2
    }; // x - north<->south; y - east<->west
    
    globalGridHandler = {
        setConfig : function() {
            GridSettings.start_x = parseFloat(CONFIG.map_center_y);
            GridSettings.start_y = parseFloat(CONFIG.map_center_x);
            GridSettings.x_step  = parseFloat(CONFIG.grid_step_x);
            GridSettings.y_step  = parseFloat(CONFIG.grid_step_y);
            GridSettings.x_times = parseFloat(CONFIG.grid_repetition_x);
            GridSettings.y_times = parseFloat(CONFIG.grid_repetition_y);
        },
        draw : function() {drawGrid();},
        delete : function() {deleteGrid();}
    }

    function drawGrid() {
        if (gridIsDrawn) {
            deleteGrid();
        }

        var xmin = GridSettings.start_x - GridSettings.x_times * GridSettings.x_step;
        var xmax = GridSettings.start_x + GridSettings.x_times * GridSettings.x_step - 0.001;
        var ymin = GridSettings.start_y - GridSettings.y_times * GridSettings.y_step;
        var ymax = GridSettings.start_y + GridSettings.y_times * GridSettings.y_step - 0.001;
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
                    if (popupIsOpened) {
                        map.closePopup();
                        popupIsOpened = false;
                    } else {
                        this.setStyle({fillOpacity: 0, opacity: 0.1});
                        SelectedPolygons.push(this.toGeoJSON().geometry.coordinates[0]);
                        this.off('click');

                        onChange(null);
                    }
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
    //drawGrid();

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
    function isHighlighted(layer) {
        if (layer != null) {
            //console.log(layer);
            if (layer._isHigh) {
                return true;
            }
        }
        return false;
    }
    function highlightById(tripId) {
        if (lastHighlighted != null) {
            highlightEndId(lastHighlighted);
        }
        var layer = getLayerByTripId(tripId);
        if (layer != null) {
//            console.log("highlighting "+layer._tripProperties.trip_id);
            layer.bringToFront();
            var tmpStyle_L1 = window.mouseOverStyle;
            tmpStyle_L1.color = layer._tripProperties._highlightColor;
            layer.setStyle(tmpStyle_L1);
            
            lastHighlighted = tripId;
        }
    }
    function highlightEndId(tripId) {
        var layer = getLayerByTripId(tripId);
        if (layer != null) {
//            console.log("de-highlighting "+layer._tripProperties.trip_id);
            layer.bringToBack();
            var styleDefault_L1 = window.defaultStyle;
            styleDefault_L1.color = layer._tripProperties._colorCoding;
            layer.setStyle(styleDefault_L1);
            
            lastHighlighted = null;
        }
    }
    function unHighlightLast() {
        if (lastHighlighted != null) {
            highlightEndId(lastHighlighted);
        }
    }

    function visualizeGeoJSON(objJson, jsonAllPoints, tripCommonProperties) {
        var color_seed = tripCommonProperties.agent_id + " " + (5*tripCommonProperties.trip_id)+JSON.stringify(objJson);
        var color_starter = redColorFromStrSeed(color_seed);
        color_starter = ColorLuminance(color_starter, 0.8);
        var highlight_color = blueColorFromStrSeed(color_seed);
        highlight_color = ColorLuminance(highlight_color, 0.8);
        //console.log(color_starter);

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

        var features = new L.featureGroup();
        var layer1_mainLine = new L.geoJson(lines, {style: useStyle});
        layer1_mainLine.isUserMarked = true;
        layer1_mainLine._layerTypeMarker = 1;
        layer1_mainLine._tripProperties = tripCommonProperties;
        layer1_mainLine._tripProperties._highlightColor = highlight_color;
        layer1_mainLine._tripProperties._colorCoding = color_starter;
        layer1_mainLine._tripProperties._colorCodingLight = color_lighter;
        layer1_mainLine._allPoints = jsonAllPoints; //<- needed for detecting trips near click
        features.addLayer(layer1_mainLine);

        tripCommonProperties._layer1id = layer1_mainLine._leaflet_id;
        features._pointerToLayer1_main = layer1_mainLine;
        features.__deleteable = true;
        features._isHigh = false;

        features.on('click', mapClicked);
        features.on('mouseover', highlightOverEffect);
        features.on('mouseout', highlightOutEffect);
        features.addTo(map);
    }
    
    function highlightOverEffect(e) {
        // cannot point to global variables or Leaflet onMouseOver event handling shall be broken ... O-o
        var Layer1 = e.target._pointerToLayer1_main;
        Layer1.bringToFront();
        var tmpStyle_L1 = window.mouseOverStyle;
        tmpStyle_L1.color = Layer1._tripProperties._highlightColor;
        Layer1.setStyle(tmpStyle_L1);
        Layer1._isHigh = true;
    }
    
    function highlightOutEffect(e) {
        // cannot point to global variables or Leaflet onMouseOver event handling shall be broken ... O-o
        var Layer1 = e.target._pointerToLayer1_main;
        //Layer1.bringToFront();
        var tmpStyle_L1 = window.defaultStyle;
        tmpStyle_L1.color = Layer1._tripProperties._colorCoding;
        Layer1.setStyle(tmpStyle_L1);
        Layer1._isHigh = false;
    }

    // map onclick processing
    function mapClicked(e) {
        unHighlightLast();
        popupIsOpened = false;
        
        var clickPoint = e.latlng;
        var X = L.point(clickPoint.lat, clickPoint.lng);
        var DIST = 0.001;

        // zoom and distance acomondation, magical formula:
        var powpow = 0.81;
        var del = 4;
        var off = -0.0001;
        var t = 17 - map.getZoom();
        DIST = off + (DIST / Math.pow(powpow, t)) / del;

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

            var desc = "";
            var wasHigh = 0;
            
            for (i = 0; i < closeLayers.length; i++) {
                var tripLayer = closeLayers[i];
                tripLayer.bringToFront();
                debugStr += tripLayer._leaflet_id + " (distFromClick " + tripLayer._lastDist + "; tripId: " + tripLayer._tripProperties.trip_id + ") \n";

                // collect informations for description
                var TripInfo = tripLayer._tripProperties;
                var legInfo = "";
                $.each(TripInfo._legs, function(j, leg) {
                    var legTime = msecToTimePeriod( (leg.l_end_time-leg.l_start_time) );
                    legInfo += "<span title='"+msecToTime(leg.l_start_time)+" to "+msecToTime(leg.l_end_time)+" ("+legTime+")'>" + leg.type + "</span> | ";
                });
                legInfo = legInfo.slice(0, -3);

                var nameFromAgentId = "Citizen "+(TripInfo.agent_id+"").slice(7); //CitizenXYZ
                var timePeriod = msecToTimePeriod( (TripInfo.t_end_time-TripInfo.t_start_time) );
                var localDesc = "<div class='tripDesc' id='"+TripInfo.trip_id+"'><span class=\"symbol\">+</span> <span style='color: " + TripInfo._colorCoding + ";'><strong>" + nameFromAgentId + "</strong></span><br>"
                        + "<div class='tripDescDetails'>"
                        + "<strong>trip time:</strong> <small>" + msecToTime(TripInfo.t_start_time) + " to " + msecToTime(TripInfo.t_end_time) + " ("+timePeriod+")</small><br>"
                        + "<strong>trip dest:</strong> <small>" + TripInfo.from_activity.toLowerCase() + " -> " + TripInfo.to_activity.toLowerCase() + "</small><br>"
                        + "<div class='agentInfoBar'>"
                            + "<strong>gender:</strong> "+ genderToStr(TripInfo.gender) + " <strong>age:</strong> "+ TripInfo.age + "<br>"
                            + "<strong>education:</strong> " + TripInfo.education.toLowerCase() + " <strong>economic.:</strong> " + TripInfo.economic_activity.toLowerCase() + "<br>"
                            + "<strong>driver's licence:</strong> " + booToStr(TripInfo.drivers_licence) + " <strong>pt. card:</strong> " + booToStr(TripInfo.pt_discount_card) + "<br>"
                        + "</div>"
                        + "<strong>legs:</strong> "+"<small>" + legInfo + "</small>"
                        + "</div></div>";
                desc += localDesc;
                
                if (wasHigh == 0 && isHighlighted(closeLayers[i])) {
                    highlightEndId(closeLayers[i]._tripProperties.trip_id);
                    wasHigh = i;
                }
            };
            
            highlightById(closeLayers[wasHigh]._tripProperties.trip_id);
            closeLayers[wasHigh].bringToFront();
            
            var popup = L.popup();
            popup.setLatLng(e.latlng)
                    .setContent(desc)
                    .openOn(map);
            popupIsOpened = true;

            if (closeLayers.length > 3) {
                // hide most of them
                $(".tripDesc").children("div").slice(2).toggle();
            }
            
            var defaultPlus = "<i class=\"fa fa-plus-square-o\"></i>"; //+
            var defaultMinus = "<i class=\"fa fa-minus-square-o\"></i>"; //-
            var highPlus = "<i class=\"fa fa-plus-square\"></i>"; //+
            var highMinus = "<i class=\"fa fa-minus-square\"></i>"; //-

            $(".tripDesc").each(function() {
                var currentId = $(this).attr('id');
                var isVisible = $(this).children(".tripDescDetails").is(":visible");
                if (isVisible) {
                    $("#"+currentId+" .symbol").html(defaultMinus);
                } else {
                    $("#"+currentId+" .symbol").html(defaultPlus);
                }
                
                $("#"+currentId).mouseover(function() {
                    var isVisible = $(this).children(".tripDescDetails").is(":visible");
                    
                    if (isVisible) {
                        $("#"+currentId+" .symbol").html(highMinus);
                    } else {
                        $("#"+currentId+" .symbol").html(highPlus);
                    }
                    
                    highlightById(currentId);
                });
                
                $("#"+currentId).mouseout(function() {
                    var isVisible = $(this).children(".tripDescDetails").is(":visible");
                    
                    if (isVisible) {
                        $("#"+currentId+" .symbol").html(defaultMinus);
                    } else {
                        $("#"+currentId+" .symbol").html(defaultPlus);
                    }
                    
                    highlightEndId(currentId);
                });
            });

            $(".tripDesc").click(function() {
                $(this).children(".tripDescDetails").toggle();
            });

            //console.log(debugStr);
        }
    };
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

                //from_activity, to_activity - compatible with multiple data separated by comma
                var splitted_from_activity = (STATS.Trips[trip_id].from_activity + "").split(",");
                var splitted_to_activity = (STATS.Trips[trip_id].to_activity + "").split(",");
                
                for (i = 0; i < splitted_from_activity.length; i++) {
                    var act = splitted_from_activity[i];
                    if (STATS.byTripProp.from_activity[ act ] == null) {
                        STATS.byTripProp.from_activity[ act ] = 1;
                    } else {
                        STATS.byTripProp.from_activity[ act ] += 1;
                    }
                }
                for (i = 0; i < splitted_to_activity.length; i++) {
                    var act = splitted_to_activity[i];
                    if (STATS.byTripProp.to_activity[ act ] == null) {
                        STATS.byTripProp.to_activity[ act ] = 1;
                    } else {
                        STATS.byTripProp.to_activity[ act ] += 1;
                    }
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
                        /*
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
                        */
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

                var lineStrArr = "["; // store all coordinates to form MultiLine

                // Random offset with random string seed
                var seedStr = tripCommonProperties.agent_id + " " + tripCommonProperties.trip_id;
                var offset = offsetFromStrSeed(seedStr);

                var FirstSegment = jQuery.parseJSON(trip._legs.leg0.geojsonpath).coordinates[0];
                FirstSegment = offsetArrayOfPoints(FirstSegment, offset);

                $.each(trip._legs, function(j, leg) {
                    // <offset?>
                    var coordinates = jQuery.parseJSON(leg.geojsonpath).coordinates[0];
                    coordinates = offsetArrayOfPoints(coordinates, offset);

                    lineStrArr += JSON.stringify(coordinates) + ",";
                });
                lineStrArr = lineStrArr.slice(0, -1);
                lineStrArr += "]";

                var lineSegments = jQuery.parseJSON(lineStrArr);
                var allPoints = "[";
                for (k = 0; k < lineSegments.length; k++) {
                    var str = JSON.stringify(jQuery.parseJSON(lineStrArr)[k]);
                    allPoints += str.slice(1, -1) + ","; // without [, ]
                }
                allPoints = allPoints.slice(0, -1) + "]";
                var jsonAllPoints = jQuery.parseJSON(lineStrArr);

                var lineGeoData = multiLineStrToGeoJSON(lineStrArr);

                visualizeGeoJSON(lineGeoData, jsonAllPoints, tripCommonProperties);
            });

            //console.log(STATS.Agents);
        }
    }

    function multiLineStrToGeoJSON(multilineStr) {
        var jsonString = "{\"type\": \"MultiLineString\",\"coordinates\": " + multilineStr + "}";

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

    var xhr = null;
    function getMultipleTrips(dataToBeSent) {
        $(".loadingIcon").show();
        map.closePopup();
        
        if (xhr !== null) {
            // abort any previous unfinished request calls
            xhr.abort();
        }
        
        xhr = $.ajax({
            type: "POST",
            url: "getFilteredData.jsp",
            data: dataToBeSent,
            headers : {'Accept-Encoding' : 'gzip'},
            //dataType: 'json'
            dataType : 'text'
        })
        //xhr = $.post("getFilteredData.jsp", dataToBeSent)
                .done(function(data) {
                    clearMap();
                    //console.log(data);
                    
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

        // add time period filter
        if ($("#timeRange_slider").slider("values", 0)) {
            dataToBeSent.time_start = $("#timeRange_slider").slider("values", 0);
        }
        if ($("#timeRange_slider").slider("values", 1)) {
            dataToBeSent.time_end = $("#timeRange_slider").slider("values", 1);
        }

        dataToBeSent.isExploratory = isExploratory;

        // add source for data from currently selected city
        dataToBeSent.source = $('.citySelector .originalSelect').val();
        //alert("loading from "+dataToBeSent.source);

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
        //alert("Something changed ... i can smell it in the water!\n"+e);
        // call the whole Behemoth with all trip-drawing ...
        collectDataFromForm(false);
    }
    globalChangeHandler = function () { onChange() };

    $("select").change(function(e) {
        if (e.originalEvent) { // filter only user interaction
            onChange(e);
        }
    });
    $("input").change(function(e) {
        // filtration of map layer selection
        if (e.originalEvent && ($(this).attr("class") != "leaflet-control-layers-selector")) {
            onChange(e);
        }
    });

    var flagValueHasBeenChanged = false;
    $(".multiselectCustom").multiselect({
        buttonClass: 'btn form-control',
        includeSelectAllOption: true,
        numberDisplayed: 2,
        dropRight: true,
        onDropdownShow: function(event) {
            flagValueHasBeenChanged = false;
        },
        onChange: function(element, checked) {
            flagValueHasBeenChanged = true;
        },
        onDropdownHide: function(event) {
            if (flagValueHasBeenChanged) {
                onChange(event);
            }
            flagValueHasBeenChanged = false;
        }
    });

    var fromValue = "";
    var toValue = "";
    $(".multiselectAgesFrom").multiselect({
        buttonClass: 'btn btn-sm form-control',
        enableFiltering: true,
        maxHeight: 400,
        dropRight: true,
        onDropdownShow: function(event) {
            fromValue = $(".multiselectAgesFrom").val();
        },
        onDropdownHide: function(event) {
            if ($(".multiselectAgesFrom").val() != fromValue) {
                onChange(event);
            }
        }
    });
    $(".multiselectAgesTo").multiselect({
        buttonClass: 'btn btn-sm form-control',
        enableFiltering: true,
        maxHeight: 400,
        dropRight: true,
        onDropdownShow: function(event) {
            toValue = $(".multiselectAgesTo").val();
        },
        onDropdownHide: function(event) {
            if ($(".multiselectAgesTo").val() != toValue) {
                onChange(event);
            }
        }
    });

//    $(window).load(function() {
//        onChange();
//    });

    // Info panels in MAP region (must be before ButtonRedraw, ButtonDeleteGrid binding)
    var MyControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        onAdd: function(map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'custom-control-panel');
            return container;
        }
    });
    map.addControl(new MyControl());
    
    var buttonStr = "<input type=\"button\" class=\"btn btn-default\" value=\"Draw grid\" id=\"ButtonRedraw\"/>" +
                    "<input type=\"button\" class=\"btn btn-default\" value=\"Delete grid\" id=\"ButtonDeleteGrid\"/>";
    var openedControlPanel = false;

    $(".custom-control-panel").html("<div class=\"v-align\"><span class=\"click-able-title\"><i class=\"fa fa-cog\"></i> <span class=\"shown-on-mouseover\">Control panel <span class=\"symbol\">&nbsp;</span></span></span></div> <div class=\"v-align\">&nbsp;<span class=\"toggle-part\">"+buttonStr+"</span></div>");
    $(".custom-control-panel .v-align:first").toggle(
        function() {
            $(".custom-control-panel .toggle-part").show();
            openedControlPanel = true;
            $(".custom-control-panel .symbol").html("<i class=\"fa fa-angle-left\"></i>");
        }, function() {
            $(".custom-control-panel .toggle-part").hide();
            openedControlPanel = false;
            $(".custom-control-panel .symbol").html("<i class=\"fa fa-angle-right\"></i>");
        }
    );
    $(".custom-control-panel").mouseover(function() {
        //$(".custom-control-panel .shown-on-mouseover").html("<i class=\"fa fa-angle-left\"></i>");
        $( ".custom-control-panel .shown-on-mouseover" ).show();
        if (openedControlPanel) {
            $(".custom-control-panel .symbol").html("<i class=\"fa fa-angle-left\"></i>");
        } else {
            $(".custom-control-panel .symbol").html("<i class=\"fa fa-angle-right\"></i>");
        }
    });
    $(".custom-control-panel").mouseout(function() {
        if (!openedControlPanel) {
            $( ".custom-control-panel .shown-on-mouseover" ).hide();
        }
        $(".custom-control-panel .symbol").html("&nbsp;");
    });
    
    // Button binding
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