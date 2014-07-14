$(document).ready(function() {
    $( "#ButtonGenGraphsTMP" ).click(function() {
        if (STATS.byAgentProp != null) {
            //fooGraphs_PIE_chart_dot_js();
            //fooGraphs_STACKED_chart_dot_js();

            fooGraphs_PIE_highcharts();
            //fooGraphs_STACKED_highcharts();
        }
    });

    function fooGraphs_PIE_highcharts() {
        $("genderGraph").css("height","300px");
        
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

    function fooGraphs_PIE_chart_dot_js() {
        // Chart.js experimentations:
        // FROM STATS.byAgentProp.gender
        
        var dataArr = [];
        
        var colors = ["#F7464A", "#464af7"];
        var colorsHigh = [];
        for (var c in colors) {
            colorsHigh.push(lighter(colors[c]));
        }
        
        //console.log(colors);
        //console.log(colorsHigh);
        
        //var colors = ["#F7464A", "#464af7"];
        //var colorsHigh = ["#FF5A5E", "#5a5eff"]; // lighter ones
        var i = 0;
        
        for(var propertyName in STATS.byAgentProp.gender) {
            var propertyValue = STATS.byAgentProp.gender[propertyName];
            //console.log(propertyName+" "+propertyValue);
            
            var dataSlice = {
                value: propertyValue,
                color: colors[i],
                highlight: colorsHigh[i],
                label: propertyName
            }
            dataArr.push(dataSlice);
            i++;
        }
        


        // Get context with jQuery - using jQuery's .get() method.
        var ctx = $("#myPIE").get(0).getContext("2d");
        var options = {
            animationSteps : 1,
            animateRotate : false
        };
        var myDoughnutChart = new Chart(ctx).Doughnut(dataArr,options);
    }
    
    function fooGraphs_STACKED_chart_dot_js() {
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
        
        //console.log(ArrData);
        
        
        var barChartData = {
            labels: ArrLabels,
            // datasets by {WALK,TELEPORT,PT,CAR}
            datasets: [
                {   //WALK
                    label: "walk",
                    fillColor: "rgba(220,220,220,0.5)",
                    strokeColor: "rgba(220,220,220,0.8)",
                    highlightFill: "rgba(220,220,220,0.75)",
                    highlightStroke: "rgba(220,220,220,1)",
                    data: ArrData[0]
                },
                {   //TELEPORT
                    label: "teleport",
                    fillColor: "rgba(151,187,205,0.5)",
                    strokeColor: "rgba(151,187,205,0.8)",
                    highlightFill: "rgba(151,187,205,0.75)",
                    highlightStroke: "rgba(151,187,205,1)",
                    data: ArrData[1]
                },
                {   //PT
                    label: "public transport",
                    fillColor: "rgba(240,73,73,0.5)",
                    strokeColor: "rgba(240,73,73,0.8)",
                    highlightFill: "rgba(240,73,73,0.75)",
                    highlightStroke: "rgba(240,73,73,1)",
                    data: ArrData[2]
                },
                {   //CAR
                    label: "car",
                    fillColor: "rgba(71,240,73,0.5)",
                    strokeColor: "rgba(71,240,73,0.8)",
                    highlightFill: "rgba(71,240,73,0.75)",
                    highlightStroke: "rgba(71,240,73,1)",
                    data: ArrData[3]
                }
            ]
        };
        
        // clean from before
        
        $("#mySTOCK").parent().html("<canvas id='mySTOCK' height='300' width='600'></canvas><div id='mySTOCK_leg' style='text-align: center'></div>");
        // do your stuff
        var ctx = document.getElementById("mySTOCK").getContext("2d");
        var myBarChart = new Chart(ctx).StackedBar(barChartData, {
            responsive : true,
        });
        
        //myBarChart.addData([1, 1, 1, 1], "August");
        //$("#mySTOCK_leg").html( myBarChart.generateLegend() );
        function legend(parent, data) {
            // inspired by https://github.com/bebraw/Chart.js.legend
            parent.className = 'legend';
            var datas = data.hasOwnProperty('datasets') ? data.datasets : data;

            // remove possible children of the parent
            while(parent.hasChildNodes()) {
                parent.removeChild(parent.lastChild);
            }

            datas.forEach(function(d) {
                var title = document.createElement('span');
                title.className = 'title';
                title.style.borderColor = d.hasOwnProperty('strokeColor') ? d.strokeColor : d.color;
                title.style.borderStyle = 'solid';
                title.style.marginRight = '5px';
                parent.appendChild(title);

                var text = document.createTextNode(d.label);
                title.appendChild(text);
            });
        }
        
        legend(document.getElementById("mySTOCK_leg"), barChartData);


    }
});