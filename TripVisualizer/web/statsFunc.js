/* Object holders and functions for statistics */

var STATS = {};
STATS.Agents = {};
STATS.Trips  = {};
STATS.Legs   = {};
var numberOfAgeCategories = 8;
var minAge = 5;
var maxAge = 85;
// STATS holds redundant data (respectively copies of references pointing at the same data; pointers are redundant, yet data is not doubled)
// however it gives us better structure for data parsing which we need* (*want) for creating statistics ...

function getAgentById(agent_id) {
    return STATS.Agents[agent_id];
}

function getTripById(trip_id) {
    return STATS.Trips[trip_id];
}

function getLegsByTripId(trip_id) {
    return STATS.Legs[trip_id];
}

function countAgeCategoryFromAge(age) {
    var catSize = (maxAge - minAge) / numberOfAgeCategories; //cheetah
    var count = -1;
    age -= minAge;
    while (age > 0) {
        age -= catSize;
        count ++;
    }
    return count;
}

// selection of initial values (if we encounter new one, it will be added dynamicly); These values will be written out even if their value is 0 (by default)
var InitNamesForAgentProps = {};
InitNamesForAgentProps.gender = ["FEMALE","MALE"];
InitNamesForAgentProps.education = ["SECONDARY_WITHOUT_FINAL_EXAM","SECONDARY_WITH_FINAL_EXAM","BASIC","UNIVERSITY","null","HIGHER_PROFESSIONAL"];
InitNamesForAgentProps.marital_status = ["MARRIED","SINGLE","DIVORCED","WIDOWED"];
InitNamesForAgentProps.economic_activity = ["WORKING","SECONDARY_SCHOOL","UNIVERSITY_STUDENT","PRIMARY_SCHOOL"];
InitNamesForAgentProps.drivers_licence = ["t","f"];
InitNamesForAgentProps.pt_discount_card = ["t","f"];
initNames_forAgeCategories();

var InitTypesForLegs = {};
InitTypesForLegs.type = ["CAR","PT","WALK"];

var InitTypesForTrips = {};
InitTypesForTrips.to_activity = ["SLEEP","WORK","SCHOOL","LEISURE","SHOP_DAILY","SHOP_LONG"];
InitTypesForTrips.from_activity = InitTypesForTrips.to_activity;

function catTostr(cat) {
    var catSize = (maxAge - minAge) / numberOfAgeCategories; //can i haz cat
    var str = Math.floor(minAge + cat*catSize + 1)+"_to_"+Math.floor(minAge + (cat+1)*catSize);
    return str;
}

function initNames_forAgeCategories () {
    InitNamesForAgentProps.age = []; // empty arr
    var catSize = (maxAge - minAge) / numberOfAgeCategories; //cibet cat
    
    for (var a = 0; a < numberOfAgeCategories; a++) {
        InitNamesForAgentProps.age.push( catTostr(a) );
    }
}

// Time distribution statistics
// -> for trips
var minTime = 0000000;
var maxTime = 86400000;
var numberOfTimeCategories = 6; //6 is ok, 8 also
var timeCatSize = (maxTime - minTime) / numberOfTimeCategories;
STATS.byTimeDist = {};
initNames_forTimeCategories();

function initNames_forTimeCategories () {
    for (var a = 0; a < numberOfTimeCategories; a++) {
        STATS.byTimeDist[a] = 0;
    }
}

function timeCategoryFromTime(time) {
    var count = -1;
    while (time > 0) {
        time -= timeCatSize;
        count ++;
    }
    return count;
}

function categoryNameFromCat(cat) {
    //return msecToTime(cat*timeCatSize)+"_to_"+msecToTime((cat+1)*timeCatSize);
    return msecToTimeHM(cat*timeCatSize)+"_to_"+msecToTimeHM((cat+1)*timeCatSize -1);
    //return cat+"="+(cat*timeCatSize)+"_to_"+((cat+1)*timeCatSize);
}

// -> for legs
var numberOfLegTimeCategories = 8;
var timeLegCatSize = (maxTime - minTime) / numberOfLegTimeCategories;
STATS.byLegTimeDist = {};
initNames_forLegTimeCategories();
function initNames_forLegTimeCategories () {
    for (var a = 0; a < numberOfLegTimeCategories; a++) {
        STATS.byLegTimeDist[a] = 0;
    }
}

function timeLegCategoryFromTime(time) {
    var count = -1;
    while (time > 0) {
        time -= timeLegCatSize;
        count ++;
    }
    return count;
}
function categoryNameFromLegCat(cat) {
    return msecToTimeHM(cat*timeLegCatSize)+"_to_"+msecToTimeHM((cat+1)*timeLegCatSize -1);
}
