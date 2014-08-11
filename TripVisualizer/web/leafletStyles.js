// STYLES FOR LEAFLET
/* Default styling for drawn map elements.
 * Is also determined by value of detailLVL (in index.html) which selects number of layers drawn per trip (1-3). */
var weightDefault = 5;
var weightMouseOver = 7.5;

// MOUSEOVER
window.mouseOverStyle = {
    "weight": weightMouseOver,
    "opacity": 1
};

// DEFAULT
window.defaultStyle = {
    //"color": color,
    "weight": weightDefault,
    "opacity": 0.33
};