// STYLES FOR LEAFLET
var weightDefault = 10;
var weightMouseOver = 15;

var m1 = 0.55;
var radius_m = 0.4;
var def_m1 = 0.75;
var def_radius_m = 0.55;

// MOUSEOVER
window.mouseOverStyle = {
    "weight": weightMouseOver,
    "opacity": 1
};

window.mouseOverSecondaryStyle = {
    "weight": weightMouseOver * m1,
    "opacity": 1
};

window.mouseOverMarkerStyle = {
    radius: weightMouseOver * radius_m,
    weight: weightMouseOver * ((1-m1)/2), //(weightMouseOver - weightMouseOver*0.55)/2,
    opacity: 1,
    fillOpacity: 1
};

// DEFAULT
window.defaultStyle = {
    //"color": color,
    "weight": weightDefault,
    "opacity": 0.8
};

window.defaultSecondaryStyle = {
    "weight": weightDefault * def_m1,
    "opacity": 0.8
};

window.defaultMarkerStyle = {
    radius: weightDefault * def_radius_m,
    //fillColor: color_lighter, color: color_starter,
    weight: weightDefault * ((1-def_m1)/2), //weight: (weightDefault - weightDefault*0.55)/2,
    opacity: 1,
    fillOpacity: 0.8
};