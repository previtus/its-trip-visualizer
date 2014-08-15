/* HELPER FUNCTIONS */
/* used in other .js files, no need for jQuery to be loaded */

function offsetArrayOfPoints(arr, off) {
    var offarr = arr;
    for (i = 0; i < offarr.length; i++) {
        offarr[i][0] += off[0];
        offarr[i][1] += off[1];
    }
    return offarr;
}

// String manipulations
function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}
String.prototype.replaceAll = function(str1, str2, ignore) 
{
	return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
} 
function makeLowerCase(value) {
  return value.toString().toLowerCase();
}

function genderToStr(genderStr) {
    if (genderStr === "MALE") {
        return "♂";
    } else {
        return "♀";
    }
}
function booToStr(genderStr) {
    if (genderStr === "t") {
        return "&#10003;";
    } else {
        return "✗";
    }
}

// Int manipulations
function minTwoDigits(n) {
  return (n < 10 ? '0' : '') + n;
}

function roundTo3Digits(input) {
    return roundToXDigits(input,3);
}

function roundToXDigits (input, digits) { 
    return +(Math.round(input + "e+"+digits)  + "e-"+digits);
}

// Arrays helper
Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};
Array.prototype.avg = function () {
    var sum = 0, j = 0; 
   for (var i = 0; i < this.length, isFinite(this[i]); i++) { 
          sum += parseFloat(this[i]); ++j; 
    } 
   return j ? sum / j : 0; 
};

function median(values) {
    values.sort( function(a,b) {return a - b;} );
    var half = Math.floor(values.length/2);

    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
}

// slider input time period
function msecToTime(milliseconds) {
    var date = new Date(new Number(milliseconds));
    var str = date.getUTCHours() + ":" + minTwoDigits(date.getUTCMinutes()) + ":" + minTwoDigits(date.getUTCSeconds());
    return str;
}
function msecToTimeHM(milliseconds) {
    var date = new Date(new Number(milliseconds));
    var str = date.getUTCHours() + ":" + minTwoDigits(date.getUTCMinutes());
    return str;
}

function randRedColor(huehuehue) {
    var c = jQuery.Color( "red" );
    var othercolor = jQuery.Color({
        hue: huehuehue,
        saturation: 0.9,
        lightness: 0.4,
        alpha: 1
    });
    c = c.transition( othercolor, 0.05 );
    return c.toHexString();
};
function randBlueColor(huehuehue) {
    //var c = jQuery.Color( "blue" );
    var c = jQuery.Color( "#407394" );
    var othercolor = jQuery.Color({
        hue: huehuehue,
        saturation: 0.9,
        lightness: 0.4,
        alpha: 1
    });
    c = c.transition( othercolor, 0.05 );
    return c.toHexString();
};

function redColorFromStrSeed(strSeed) {
    // rig elections!
    Math.seedrandom(strSeed);
    var hue = Math.random()*1000;
    return randRedColor(hue);
}
function blueColorFromStrSeed(strSeed) {
    Math.seedrandom(strSeed);
    var hue = Math.random()*1000;
    return randBlueColor(hue);
}

function offsetFromStrSeed(strSeed) {
    Math.seedrandom(strSeed);
    var a = (2*Math.random())-1;
    var b = (2*Math.random())-1;
    //var m = 0.0005; - good, except for big zoom
    var m = 0.0001;

    return [m*a,m*b];
}

// COLORS:
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
    var seed = strHashCode(strSeed);
    color = Math.floor((Math.abs(Math.sin(seed) * 16777215)) % 16777215);
    color = color.toString(16);
    // pad any colors shorter than 6 characters with leading 0s
    while (color.length < 6) {
        color = '0' + color;
    }
    return "#" + color;
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

function lighter(hex) {
    return ColorLuminance(hex, 0.55);
}