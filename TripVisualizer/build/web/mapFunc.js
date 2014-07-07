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

    // visualization
    function visualizeGeoJSON(objJson, desc) {
        //console.log(objJson);
        L.geoJson(objJson)
                .bindPopup(desc)
                .addTo(map);
    }
    function visualizeGeoJSON(objJson, desc, useStyle) {
        //console.log(objJson);
        L.geoJson(objJson,{ style: useStyle })
                .bindPopup(desc)
                .addTo(map);
    }

    //processing
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
        visualizeGeoJSON(geoData, desc);
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
            visualizeGeoJSON(geoData, desc, useStyle);
    }
    function multiLineStrToGeoJSON(multilineStr) {
        var jsonString = "{\"type\": \"MultiLineString\",\"coordinates\": "+multilineStr+"}";
        
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
                    $(".tempServerResponse").text($.trim(data));
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