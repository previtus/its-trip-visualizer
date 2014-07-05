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