/* Object holders and functions for statistics */

var STATS = {};
STATS.Agents = {};
STATS.Trips  = {};
STATS.Legs   = {};
var numberOfAgeCategories = 10;
var minAge = 0;
var maxAge = 100;
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

function countAgeCategoryFromAge(age, numberOfCategories) {
    var catSize = (maxAge - minAge) / numberOfCategories; //cheetah
    var count = 0;
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

//function initNames_forAgeCategories (numberOfCategories) {
//    InitNamesForAgentProps.age = []; // empty arr
//    var catSize = (maxAge - minAge) / numberOfCategories; //cibet cat
//    
//    for (i = 0; i < numberOfCategories; i++) {
//        InitNamesForAgentProps.age.push((i*catSize)+"to"+((i+1)*catSize));
//    }
//}