/* Graph generation from data recieved from server, done after jQuery is ready*/

$(document).ready(function() {
    $( "#ButtonGenGraphsTMP" ).click(function() {
        if (STATS.byAgentProp != null) {
            fooGraphs_PIE_highcharts();
            //fooGraphs_STACKED_highcharts();
        }
    });

    function fooGraphs_PIE_highcharts() {
        $("#genderGraph").css("height","300px");
        
        var dataArr = [];
        for(var propertyName in STATS.byAgentProp.gender) {
            var propertyValue = STATS.byAgentProp.gender[propertyName];
            //console.log(propertyName+" "+propertyValue);
            
            var dataSlice = [propertyName, propertyValue]
            dataArr.push(dataSlice);
        }
        
        //console.log(dataArr);
        
        var colors = ["#F7464A", "#464af7"];
        var n = colors.length;
        for (i = 0; i < n; i++) {
            colors.push(lighter(colors[i]));
        }
        
        $('#genderGraph').highcharts({
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false
            },
            title: {
                text: 'Gender',
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
                    center: ['50%', '75%'],
                    colors:  colors
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
        });

    }
    
    
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
});