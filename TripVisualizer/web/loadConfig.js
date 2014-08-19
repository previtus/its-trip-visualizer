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

                //statistics min/max time globals:
                minTime = CONFIG.min_time;
                maxTime = CONFIG.max_time;
                timeCatSize = Math.abs(maxTime - minTime) / numberOfTimeCategories;
                timeLegCatSize = Math.abs(maxTime - minTime) / numberOfLegTimeCategories;
                STATS.byTimeDist = {};
                initNames_forTimeCategories();
                STATS.byLegTimeDist = {};
                initNames_forLegTimeCategories();

                // slider min/max
                var minDate = new Date(new Number(CONFIG.min_time));
                dayOne = minDate.getUTCDay();
                
                $('#timeRange_slider').slider( "option", {
                    min: parseFloat(CONFIG.min_time),
                    max: parseFloat(CONFIG.max_time),
                    values: [0, parseFloat(CONFIG.max_time)-1] 
                });
                refreshTime();
                //$("#timeRange").val(msecToTimeWithDay($("#timeRange_slider").slider("values", 0)) + " - " + msecToTimeWithDay($("#timeRange_slider").slider("values", 1)));
                
                // add options in <select> .citySelector .selectpicker
                $('.citySelector .originalSelect')
                    .find('option')
                    .remove();
                
                for (i = 0; i < CONFIG.cityNames.length; i++) {
                    var txt = CONFIG.cityNames[i];
                    var val = CONFIG.tableNames[i];
                    $('.citySelector .originalSelect').append('<option value="'+val+'">'+txt+'</option>')
                };
                $('.citySelector .originalSelect').val(selectedValue);
                $('.selectpicker').selectpicker('refresh');
                
                // make sure next data is loaded from new table!
                // \is done by reading value of selector in mapFunc.js -> $('.citySelector .originalSelect').val();
                
                // after all, reload drawn data
                globalChangeHandler();
            });
    }
    
    var selectedValue = "only_brno_extracted";
    $('.selectpicker').selectpicker({
        size: 4,
        width: "100%",
        style: "kekeke"
    });
    // bind only once
    $('.selectpicker').on('change', function(){
        var val = $(this).val();
        //console.log(val);
        selectedValue = val;
        loadConfig(val);
    });
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