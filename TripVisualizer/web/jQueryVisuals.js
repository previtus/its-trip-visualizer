/* jQuery visualization used in form UI */
/* Generally only input/output reactions of form on main site. 
 * Can't reach map object and any drawing connected with map layers (those are separated in mapFunc.js file). */
var refreshTime;
$(document).ready(function() {
    // JQUERY MAGICS
    // resize
    $(".leaflet-control-attribution").css("margin-right", "20px");

    // multiselect
    //$(".multiselectCustom").multiselect(...) is in mapFunc
    $(".exclusionSelect").buttonset();

    // Accordion
    $( "#accordion" ).accordion({
        collapsible: true,
        heightStyle: "content",
        active: false,
        activate: function(event, ui) {
            $(window).trigger('resize');
        }
    });

    // slider input TripId
//    $("#tripId_slider").slider({
//        range: true,
//        min: 0,
//        max: 283,
//        values: [10, 20],
//        slide: function(event, ui) {
//            $("#tripIdRange").val(ui.values[ 0 ] + " - " + ui.values[ 1 ]);
//        }
//    });
//    $("#tripIdRange").val($("#tripId_slider").slider("values", 0) + " - " + $("#tripId_slider").slider("values", 1));
    
    $("#timeRange_slider").slider({
        range: true,
        min: 0000000,
        max: 86400000, //1day = 86400000
        values: [0000000, 86400000-1],
        slide: function(event, ui) {
            if ((maxTime-minTime) > 86400000) {
                $("#timeRange").val(msecToTimeWithDay(ui.values[0]) + " - " + msecToTimeWithDay(ui.values[1]));
            } else {
                $("#timeRange").val(msecToTime(ui.values[0]) + " - " + msecToTime(ui.values[1]));
            }
            //$("#timeRange").val(ui.values[0] + " - " + ui.values[1]);
        },
        stop: function(event, ui) {
            $("#invisCheckbox").trigger('click');
        }
    });
    refreshTime = function() {
        if ((maxTime-minTime) > 86400000) {
            $("#timeRange").val(msecToTimeWithDay($("#timeRange_slider").slider("values", 0)) + " - " + msecToTimeWithDay($("#timeRange_slider").slider("values", 1)));
        } else {
            $("#timeRange").val(msecToTime($("#timeRange_slider").slider("values", 0)) + " - " + msecToTime($("#timeRange_slider").slider("values", 1)));
        }
    };
    
    // filter panels toggle and enabling
    $(".filterPanel .panelControl input[name='toggleButton']").click(function() {
        // points to panelContent div
        $(this).parent().next().toggle();

        if ($(this).val() === "-") {
            $(this).val("+");
        } else {
            $(this).val("-");
        }
    });

    $(".filterPanel .panelControl .panelCheckbox").change(function() {
        // reaction on changing
        if ($(this).is(':checked')) {
            $(this).parent().parent().attr("class", "filterPanel activePanel");
        } else {
            $(this).parent().parent().attr("class", "filterPanel");
        }
    });
    $(":checkbox").change().change();
});