$(document).ready(function() {
    // JQUERY MAGICS
    // resize
    $(".leaflet-control-attribution").css("margin-right", "20px");

    // slider input TripId
    $("#tripId_slider").slider({
        range: true,
        min: 0,
        max: 283,
        values: [10, 20],
        slide: function(event, ui) {
            $("#tripIdRange").val(ui.values[ 0 ] + " - " + ui.values[ 1 ]);
        }
    });
    $("#tripIdRange").val($("#tripId_slider").slider("values", 0) + " - " + $("#tripId_slider").slider("values", 1));

    $("#timeRange_slider").slider({
        range: true,
        min: 2262200,
        max: 85944980,
        values: [2262200, 85944980],
        slide: function(event, ui) {
            $("#timeRange").val(msecToTime(ui.values[0]) + " - " + msecToTime(ui.values[1]));
        }
    });
    $("#timeRange").val(msecToTime($("#timeRange_slider").slider("values", 0)) + " - " + msecToTime($("#timeRange_slider").slider("values", 1)));

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

    // select rectangle button
    $("#ButtonRectangle").toggle(
        function() {
            $(this).css("color", "green");
        }, function() {
            $(this).css("color", "black");
        }
    );
});