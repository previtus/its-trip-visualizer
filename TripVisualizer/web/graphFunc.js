/* Graph generation from data recieved from server, done after jQuery is ready*/
drawGraphs = function (){};

$(document).ready(function() {
    $( "#ButtonGenGraphsTMP" ).click(function() {
        if (STATS.byAgentProp != null) {
            drawGraphs();
        }
    });

    drawGraphs = function () {
        console.log(STATS.byAgentProp);
        if (STATS.byAgentProp == null || STATS.byAgentProp.isEmpty) {
            return;
        }
        
        /* in STATS.byAgentProp we have:
         * drivers_licence, economic_activity, education, gender, marital_status, pt_discount_card, age (in categories)
         */

        //ageGraph <-- ?

        var redBlue = ["#F7464A", "#464af7"]; 
        var greenRed = ["#0ed209", "#d2090e"];
        drawGraph("genderGraph","gender", redBlue, "Gender", "Gender");

        drawGraph("driversGraph","drivers_licence", greenRed, "Driver's<br>licence", "Driver's licence");
        drawGraph("economicGraph","economic_activity", null, "Economic<br>activity", "Economic activity");
        drawGraph("educationGraph","education", null, "Education", "Education");
        drawGraph("maritalGraph","marital_status", null, "Marital<br>status", "Marital status");
        drawGraph("ptcardGraph","pt_discount_card", greenRed, "Public<br>transport card", "Public transport card");
        
        drawGraph("ageGraph","age", null, "Age", "Age");
    }

    function drawGraph(idname,statname,colors,graphName,popupname) {
        $("#"+idname).css("height","300px");
        
        var dataArr = [];
        var stat = STATS.byAgentProp[statname];
        for(var propertyName in stat) {
            var propertyValue = stat[propertyName];
            //console.log(propertyName+" "+propertyValue);
            
            var lowName = capitaliseFirstLetter( String.toLowerCase(propertyName) );
            lowName = lowName.replaceAll("_"," ");
            
            var dataSlice = [lowName, propertyValue]
            dataArr.push(dataSlice);
        }
        
        //console.log(dataArr);
        if (colors !== null) {
            var n = colors.length;
            for (var i = 0; i < n; i++) {
                colors.push(lighter(colors[i]));
            }    
        }
        
        var settingsHalfDonut = {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false
            },
            title: {
                text: graphName,
                align: 'center',
                verticalAlign: 'middle',
                y: 55
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.y}</b>'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
                        distance: -50,
                        style: {
                            fontWeight: 'bold',
                            color: 'white',
                            textShadow: '0px 1px 2px black'
                        }
                    },
                    startAngle: -90,
                    endAngle: 90,
                    center: ['50%', '75%']
                    //colors: colors
                    //colors:  ["#F7464A", "#464af7", "rgba(15,72,127,1)", "rgba(52,109,164,1)"]
                    //colors: ["#F7464A", "#464af7"]
                }
            },
            series: [{
                type: 'pie',
                name: 'Gender',
                innerSize: '50%',
                data: dataArr
            }]
        };
        
        var settings = {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false
            },
            title: {
                text: graphName,
//                align: 'center',
//                verticalAlign: 'middle',
//                y: 55
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.y}</b>'
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
//                        distance: -50,
//                        style: {
//                            fontWeight: 'bold',
//                            color: 'white',
//                            textShadow: '0px 1px 2px black'
//                        }
                    },
//                    startAngle: -90,
//                    endAngle: 90,
//                    center: ['50%', '75%']
                }
            },
            series: [{
                type: 'pie',
                name: popupname,
//                innerSize: '50%',
                data: dataArr
            }]
        };
        
        if (colors !== null) {
            settings.plotOptions.pie.colors = colors;
        }
        
        $('#'+idname).highcharts( settings );

    }

    /*
    function fooGraphs_STACKED_highcharts() {
        $("#legTypeGraph").css("height","400px");
        var assignmentByName = {"WALK":0,"TELEPORT":1,"PT":2,"CAR":3}
        
        var ArrLabels = [];
        var ArrData = [[], [], [], []];
        var i = 0;
        for (var tripI in STATS.Legs) {
            ArrLabels.push(tripI);
            
            var tripsLegs = STATS.Legs[tripI];
            // init trip with zeros
            for (var j = 0; j < 4; j++) {
                ArrData[j][i]=0;
            }
            
            for (var legI in tripsLegs) {
                var leg = tripsLegs[legI];
                
                var increment = assignmentByName[ leg.type ];
                ArrData[increment][i]++;
            }
            i++;
        }
        
        console.log(ArrLabels);
        console.log(ArrData);
        
        $('#legTypeGraph').highcharts({
            chart: {
                type: 'column'
            },
            title: {
                text: 'Leg type distribution'
            },
            xAxis: {
                categories: ArrLabels //['Apples', 'Oranges', 'Pears', 'Grapes', 'Bananas']
                //, title: { text: 'Trip id' }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of legs in trip'
                },
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                    }
                }
            },
            legend: {
                align: 'right',
                x: -70,
                verticalAlign: 'top',
                y: 20,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
                borderColor: '#CCC',
                borderWidth: 1,
                shadow: false
            },
            tooltip: {
                formatter: function() {
                    return '<b>'+ this.x +'</b><br/>'+
                        this.series.name +': '+ this.y +'<br/>'+
                        'Total: '+ this.point.stackTotal;
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true,
                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
                        style: {
                            textShadow: '0 0 3px black, 0 0 3px black'
                        }
                    }
                }
            },
            series: [{
                name: 'Walk',
                data: ArrData[0]
            }, {
                name: 'Teleport',
                data: ArrData[1]
            }, {
                name: 'Public transport',
                data: ArrData[2]
            }, {
                name: 'Car',
                data: ArrData[3]
            }]
        });
    }
    */
});