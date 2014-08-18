/* Loads configuration for currently selected city; Also handles page initialization; */
var CONFIG = {};
$(document).ready(function() {
    // load init config
    loadConfig("only_brno_extracted");
    
    function loadConfig(cityName) {
        var dataToBeSent = {cityName : cityName};
        $.post("loadConfig.jsp", dataToBeSent)
            .done(function(data) {
                CONFIG = jQuery.parseJSON(data);
                //console.log(CONFIG);
                // center map to this value
                var latlng = L.latLng(CONFIG.map_center_y, CONFIG.map_center_x);
                map.panTo(latlng);
                
                // init drawing of grid
                globalGridHandler.setConfig();
                globalGridHandler.draw();
                
                // create city selector
                
                // make sure next data is loaded from new table!
                
            });
    }
});

/* data comes in this form:
    cityNames = ["Brno", "Only Brno Extracted Copy"]
    grid_repetition_x = "4"
    grid_repetition_y = "2"
    grid_step_x = "0.010800000000000001"
    grid_step_y = "0.029999999999999999"
    map_center_x = "16.613980000000002"
    map_center_y = "49.205530000000003"
    max_time = "86339353"
    min_time = "2262205"
    tableNames = ["only_brno_extracted", "only_brno_extracted_copy"]
*/