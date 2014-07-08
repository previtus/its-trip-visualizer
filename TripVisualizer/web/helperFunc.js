/* HELPER FUNCTIONS */

function strHashCode (str) {
    var hash = 0;
    if (str.length == 0) return hash;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
    
function randomColorHexFromSeed(strSeed) {
    var seed = strHashCode(strSeed)
    color = Math.floor((Math.abs(Math.sin(seed) * 16777215)) % 16777215);
    color = color.toString(16);
    // pad any colors shorter than 6 characters with leading 0s
    while (color.length < 6) {
        color = '0' + color;
    }
    return "#" + color;
}

// slider input time period
function msecToTime(milliseconds) {
    var date = new Date(milliseconds);
    var str = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()
    return str;
}

function rainbow(numOfSteps, step) {
    // URL: http://blog.adamcole.ca/2011/11/simple-javascript-rainbow-color.html
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    var r, g, b;
    var h = step / numOfSteps;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    switch(i % 6){
        case 0: r = 1, g = f, b = 0; break;
        case 1: r = q, g = 1, b = 0; break;
        case 2: r = 0, g = 1, b = f; break;
        case 3: r = 0, g = q, b = 1; break;
        case 4: r = f, g = 0, b = 1; break;
        case 5: r = 1, g = 0, b = q; break;
    }
    var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
    return (c);
}


function ColorLuminance(hex, lum) {
        // URL: http://www.sitepoint.com/javascript-generate-lighter-darker-color/
        //  hex — a hex color value such as “#abc” or “#123456″ (the hash is optional)
        //  lum — the luminosity factor, i.e. -0.1 is 10% darker, 0.2 is 20% lighter, etc.
	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	}
	lum = lum || 0;

	// convert to decimal and change luminosity
	var rgb = "#", c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i*2,2), 16);
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
		rgb += ("00"+c).substr(c.length);
	}

	return rgb;
}

///**
//* See: http://jsfromhell.com/math/dot-line-length
//*
//* Distance from a point to a line or segment.
//*
//* @param {number} x point's x coord
//* @param {number} y point's y coord
//* @param {number} x0 x coord of the line's A point
//* @param {number} y0 y coord of the line's A point
//* @param {number} x1 x coord of the line's B point
//* @param {number} y1 y coord of the line's B point
//* @param {boolean} overLine specifies if the distance should respect the limits
//* of the segment (overLine = true) or if it should consider the segment as an
//* infinite line (overLine = false), if false returns the distance from the point to
//* the line, otherwise the distance from the point to the segment.
//*/
//var dotLineLength = function(x, y, x0, y0, x1, y1, o) {
//    function lineLength(x, y, x0, y0) {
//        // definition of norm
//        return Math.sqrt((x -= x0) * x + (y -= y0) * y);
//    }
//    if (o && !(o = function(x, y, x0, y0, x1, y1) {
//        if (!(x1 - x0))
//            return {x: x0, y: y};
//        else if (!(y1 - y0))
//            return {x: x, y: y0};
//        var left, tg = -1 / ((y1 - y0) / (x1 - x0));
//        return {x: left = (x1 * (x * tg - y + y0) + x0 * (x * -tg + y - y1)) / (tg * (x1 - x0) + y0 - y1), y: tg * left - tg * x + y};
//    }(x, y, x0, y0, x1, y1), o.x >= Math.min(x0, x1) && o.x <= Math.max(x0, x1) && o.y >= Math.min(y0, y1) && o.y <= Math.max(y0, y1))) {
//        var l1 = lineLength(x, y, x0, y0), l2 = lineLength(x, y, x1, y1);
//        return l1 > l2 ? l2 : l1;
//    }
//    else {
//        var a = y0 - y1, b = x1 - x0, c = x0 * y1 - y0 * x1;
//        return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
//    }
//};