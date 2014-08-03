/* Graph generation from data recieved from server, done after jQuery is ready*/
drawGraphs = function (){};

$(document).ready(function() {
    $( "#ButtonGenGraphsTMP" ).click(function() {
        if (STATS.byAgentProp != null) {
            drawGraphs();
        }
    });

    drawGraphs = function () {
        //console.log(STATS.byAgentProp);
        if (STATS.byAgentProp == null || STATS.byAgentProp.isEmpty) {
            return;
        }
        
        /* in STATS.byAgentProp we have:
         * drivers_licence, economic_activity, education, gender, marital_status, pt_discount_card, age (in categories)
         */
        var redBlue = ["#F7464A", "#464af7"]; 
        var greenRed = ["#0ed209", "#d2090e"];
        // PIE
        drawGraphPie("genderGraph","byAgentProp","gender", redBlue, "Gender", "Gender");
        drawGraphPie("driversGraph","byAgentProp","drivers_licence", greenRed, "Driver's<br>licence", "Driver's licence");
        drawGraphPie("economicGraph","byAgentProp","economic_activity", null, "Economic<br>activity", "Economic activity");
        drawGraphPie("educationGraph","byAgentProp","education", null, "Education", "Education");
        drawGraphPie("maritalGraph","byAgentProp","marital_status", null, "Marital<br>status", "Marital status");
        drawGraphPie("ptcardGraph","byAgentProp","pt_discount_card", greenRed, "Public<br>transport card", "Public transport card");
        drawGraphPie("ageGraph","byAgentProp","age", null, "Age", "Age");
        
        // BOX
        drawGraphBar("ptcardGraph","byAgentProp","pt_discount_card", greenRed, "Public transport card");
        
        // WHISKER
        //STATS.Trips[trip_id].numerOfLegs
        var dataArr = []; // number of legs per trip
        for (var t in STATS.Trips) {
            var trip = STATS.Trips[t];
            dataArr.push( trip.numberOfLegs );
        }
        //console.log(dataArr);
        //var dataArr = [1, 2, 3, 4, 1, 1];
        drawGraphWhisker("legsInTripWhiskerGraph",dataArr, "Number of legs", "Legs in trip");
        
        // same for trips
        //console.log(STATS.byTripProp);
        drawGraphPie("fromActGraph","byTripProp","from_activity", null, "Starting activity", "Starting activity");
        drawGraphPie("toActGraph","byTripProp","to_activity", null, "Ending activity", "Ending activity");
        
        // same for legs
        drawGraphPie("legTypeGraph","byLegProp","type", null, "Leg type", "Leg type");
    }

    function drawGraphWhisker(idname,dataArr,ytext,title) {
        var catArr = [title];
        var q = jStat.quartiles(dataArr);
        
        var statArr = [[dataArr.min(), q[0], median(dataArr), q[2], dataArr.max()]];
        //var dataArr = [[minimum, lower_quartile, median, upper_quartile, maximum]];
        var avg = dataArr.avg();
        
        $("#"+idname).css("height","300px");
        var settings = {
	    chart: {
	        type: 'boxplot'
	    },
	    title: {
	        text: title
	    },
	    legend: {
	        enabled: false
	    },
	
	    xAxis: {
	        categories: catArr,
	        title: {
	            text: title
	        }
	    },
	    
	    yAxis: {
	        title: {
	            text: ytext
	        },
	        plotLines: [{
	            value: 932,
	            color: 'red',
	            width: 1,
	            label: {
	                text: 'Theoretical mean: '+avg,
	                align: 'center',
	                style: {
	                    color: 'gray'
	                }
	            }
	        }]  
	    },
	
	    series: [{
	        name: title,
	        data: statArr,
	        tooltip: {
	            headerFormat: '<em>{point.key}</em><br/>'
	        }
	    }/*, {
	        name: 'Outlier',
	        color: Highcharts.getOptions().colors[0],
	        type: 'scatter',
	        data: [ // x, y positions where 0 is the first category
	            [0, 644],
	            [0, 720]
	        ],
	        marker: {
	            fillColor: 'white',
	            lineWidth: 1,
	            lineColor: Highcharts.getOptions().colors[0]
	        },
	        tooltip: {
	            pointFormat: 'Observation: {point.y}'
	        }
	    }*/]
	
	};
        
        $('#'+idname).highcharts( settings );
    }
    function drawGraphBar(idname,source,statname,colors,title) {
        var statTmp = STATS[source];
        var stat = statTmp[statname];
        var dataArr = [];
        var categoriesArr = [];
        
        for(var propertyName in stat) {
            var propertyValue = stat[propertyName];
            //console.log(propertyName+" "+propertyValue);
            
            var lowName = capitaliseFirstLetter( String.toLowerCase(propertyName) );
            lowName = lowName.replaceAll("_"," ");
            
            var dataSlice = [lowName, propertyValue]
            dataArr.push(dataSlice);
            categoriesArr.push(lowName);
        }
        
        $("#"+idname).css("height","300px");
        var settings = {
            chart: {
                type: 'column'
            },
            title: {
                text: title
            },
            xAxis: {
                categories: categoriesArr
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Number of agents'
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y}</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                    //colors: colors
                }
            },
            series: [{
                name: title,
                colorByPoint: true,
                data: dataArr
            }]
        };
        if (colors !== null) {
            settings.plotOptions.column.colors = colors;
        }
        $('#'+idname).highcharts( settings );
    }
    function drawGraphPie(idname,source,statname,colors,graphName,popupname) {
        $("#"+idname).css("height","300px");
        
        var dataArr = [];
        var statTmp = STATS[source];
        var stat = statTmp[statname];
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
                name: popupname,
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