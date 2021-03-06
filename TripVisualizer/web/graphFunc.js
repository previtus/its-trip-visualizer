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
            // Hide graph fields and show message
            $(".graphMessage").show();
            $(".graphDrawingArea").hide();
            
            return;
        }
        // else hide message and continue with the good work...
        $(".graphMessage").hide();
        $(".graphDrawingArea").show();
        
        /* in STATS.byAgentProp we have:
         * drivers_licence, economic_activity, education, gender, marital_status, pt_discount_card, age (in categories)
         */
        var redBlue = ["#F7464A", "#464af7"]; 
        var greenRed = ["#0ed209", "#d2090e"];
        var oneColor = ["#555555"];
        // PIE
        drawGraphPie("genderGraph","byAgentProp","gender", redBlue, "Gender", "Gender");
        drawGraphPie("driversGraph","byAgentProp","drivers_licence", greenRed, "Driver's<br>licence", "Driver's licence");
        drawGraphPie("economicGraph","byAgentProp","economic_activity", null, "Economic<br>activity", "Economic activity");
        drawGraphPie("educationGraph","byAgentProp","education", null, "Education", "Education");
        drawGraphPie("maritalGraph","byAgentProp","marital_status", null, "Marital<br>status", "Marital status");
        drawGraphPie("ptcardGraph","byAgentProp","pt_discount_card", greenRed, "Public<br>transport card", "Public transport card");
        drawGraphPie("ageGraph","byAgentProp","age", null, "Age", "Age");
        
        // BOX
        drawGraphBar("ptcardGraph","byAgentProp","pt_discount_card", greenRed, "Public transport card", 'Number of agents', "agents");
        
        // box + time dist for Trips
        
        prepForGraph = {};
        for (var i = 0; i < numberOfTimeCategories; i++) {
            prepForGraph[ categoryNameFromCat(i) ] = STATS.byTimeDist[i];
        }
        STATS.byTimeDist.prepForGraph = prepForGraph;
        //console.log(STATS.byTimeDist.prepForGraph);
        drawGraphBar("timeTripGraph","byTimeDist","prepForGraph", oneColor, "Time distribution", 'Number of trips', "trips");
        // BTW: muze vykreslovat 1 u kategorie, ktera je jiz mimo casovy usek a to tehdy, kdyz existuje leg, ktery se ve filtrovanem casovem useku vyskytuje
        //      jelikoz tento graf bere v potaz cely casovy zacatek a konec TRIPu, staci i leg nekdy ze zacatku aby byla vyplnena kategorie jina
        // BTW2: soucet sloupcu grafu muze byt vetsi nez pocet vykreslenych tripu a to tehdy, kdyz jeden trip nalezi do vice casovych intervalu
        //      (snadno se stane, kdyz je "numberOfTimeCategories" ve statsFunc.js moc velky). Je to tak spravne!
        
        // box + time dist for Legs
        prepLegTimeForGraph = {};
        for (var i = 0; i < numberOfLegTimeCategories; i++) {
            prepLegTimeForGraph[ categoryNameFromLegCat(i) ] = STATS.byLegTimeDist[i];
        }
        STATS.byLegTimeDist.prepLegTimeForGraph = prepLegTimeForGraph;
        drawGraphBar("timeLegTripGraph","byLegTimeDist","prepLegTimeForGraph", oneColor, "Time distribution", 'Number of legs', "legs");
        
        // WHISKER
        //STATS.Trips[trip_id].numerOfLegs
        var dataArr = []; // number of legs per trip
        for (var t in STATS.Trips) {
            var trip = STATS.Trips[t];
            dataArr.push( trip.numberOfLegs );
        }
        drawGraphWhisker("legsInTripWhiskerGraph",dataArr, "Number of legs", "Legs in trip");
        
        // same for trips
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
	    }]
	
	};
        
        $('#'+idname).highcharts( settings );
    }
    function drawGraphBar(idname,source,statname,colors,title, yTitle, serTitle) {
        var statTmp = STATS[source];
        var stat = statTmp[statname];
        var dataArr = [];
        var categoriesArr = [];
        
        for(var propertyName in stat) {
            var propertyValue = stat[propertyName];
            //console.log(propertyName+" "+propertyValue);
            
            var lowName = capitaliseFirstLetter( makeLowerCase(propertyName) );
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
                    text: yTitle
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
                name: serTitle,
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
            
            var lowName = capitaliseFirstLetter( makeLowerCase(propertyName) );
            lowName = lowName.replaceAll("_"," ");
            if (lowName.length > 8) {
                lowName = lowName.replace(/ /g, "<br>");
            }
            
            var dataSlice = ["<span style='text-align: center;'>"+lowName+"</span>", propertyValue]
            dataArr.push(dataSlice);
        }
        
        //console.log(dataArr);
        if (colors !== null) {
            var n = colors.length;
            for (var i = 0; i < n; i++) {
                colors.push(lighter(colors[i]));
            }    
        }
        
        var settings = {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: 0,
                plotShadow: false
            },
            title: {
                text: null,
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.y}</b>',
                formatter: function() {
                    return '<strong>' + this.point.y + '</strong> (' + this.point.percentage.toFixed(2) + '%)' ;
                    //return '<b>'+ this.point.name +'</b>: '+ this.point.y + '(' + this.percentage + ')' ;
                }
            },
            plotOptions: {
                pie: {
                    dataLabels: {
                        enabled: true,
                        formatter:  function() {
                            return this.point.name+"</strong><br>("+Math.round(this.percentage*100)/100 + '%)';
                            //return "<div style='text-align: center;'><strong>"+this.point.name+"</strong><br>"+Math.round(this.percentage*100)/100 + '%</div>';
                        },
                        align: 'center'
                    }
                }
            },
            series: [{
                type: 'pie',
                name: popupname,
                data: dataArr
            }]
        };
        
        if (colors !== null) {
            settings.plotOptions.pie.colors = colors;
        }
        
        $('#'+idname).highcharts( settings );

    }
});