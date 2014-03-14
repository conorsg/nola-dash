var c 			=	0;
var fns 		=	[
						getCrimeTypes,
						getNewData,
						getOldData,
						transform,
						compareData,
						drawBar,
						makeCells,
						makeChart
					];
var log			=	d3.select(".log p");
var url 		= 	'https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext,timecreate,type_';
var pastUrl 	= 	'http://data.nola.gov/resource/5fn8-vtui.json?disposition=RTF&$select=typetext,timecreate,type_';
var typesUrl 	= 	'https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext&$group=typetext';
var crimeTypes 	=	[];
var days		=	[];
var cells		=	[];
var data;
var pastData;
var nest;
var pastNest;
var homicides 	= 	[];
var propCrimes 	= 	{
						types: ["65", "65P", "56", "56D", "55", "52", "51", "62", "62C", "62R", "67S", "67A", "67F", "67", "67P"],
						old: 0,
						now: 0
					};
var viCrimes 	= 	{
						types: ["38", "38D", "34S", "35D", "35", "43B", "42", "43", "30S", "37", "37D", "64K", "64J", "64G", "64" ],
						old: 0,
						now: 0 
					};
var rapes 		= 	{
						types: ["42", "43"],
						old: 0,
						now: 0
					};
var guns 		= 	{
						types: ["64G", "95G"],
						old: 0,
						now: 0
					};
var homicides 	= 	{
						types: ["30", "30C", "30S"],
						old: 0,
						now: 0
					};
var colors 		= 	[
						"#fff", "#fef6f4", "#fde8e4", "#fbdbd5", "#facec5", "#f9c1b5", "#f7b4a6", "#f6a796", "#f49a86", "#f38c77", "#f27f67", "#f07258", "#ef6548", "#ee5838", "#ec4b29", "#eb3e19", "#e03714", "#d03312", "#c02f11", "#b12b0f", "#a1280e", "#91240d", "#82200b", "#721c0a", "#631809", "531407", "#431106", "#340d05", "#240903", "#140502", "#050100", "#000"
					];

queue(fns);
log.text('> Getting crime categories...');

// first we make a sequence of calls to get our data, then draw the charts after the data has been retrieved and transformed
function queue(arr) {
	console.log(arr[c].name + ":" + c);
	arr[c]();
	c++;
}

// retrieve 2014 crime types
function getCrimeTypes() {
	d3.json(typesUrl, function(error, json){
		json.forEach(function(d){
			crimeTypes.push(d.typetext);
		});
		queue(fns);
		log.text('> Fetching 2014 data...');
		crimeTypes.done = true;
	});
}

// retrieve 2014 data
function getNewData() {
	d3.json(url, function(error,json) {
		data = json;
		i = 1;

		(function pageData(json) {
			if(json.length === 1000) {
				d3.json(url + '&$offset=' + (i*1000), function(error,json) {
					data = data.concat(json);
					i++;
					pageData(json);
				});
			} else {
				queue(fns);
				log.text('> Fetching 2013 data...');
				data.done = true;
			}
		}) (json);	
	});
}

// retrieve 2013 data
function getOldData() {
	d3.json(pastUrl, function(error,json) {
		pastData = json;
		i = 1;

		(function pageData(json) {
			if(json.length === 1000) {
				d3.json(pastUrl + '&$offset=' + (i*1000), function(error,json) {
					pastData = pastData.concat(json);
					i++;
					pageData(json);
				});
			} else {
				queue(fns);
				log.text('> Transforming data...');
				pastData.done = true;
			}
		}) (json);	
	});	
}

// now we transform the data to be more manipulable and writeable for charts
function transform() {
	data.forEach(function(d){
		d.timecreate = new Date(d.timecreate.split(" ")[0]);
	});

	nest = d3.nest()
		.key(function(d){ return d.timecreate; })
		.key(function(d){ return d.typetext; })
		.entries(data);

	for(i in nest) { days.push(nest[i].key) }

	typeNest = d3.nest()
			.key(function(d) { return d.type_ })
			.entries(data);

	pastData.forEach(function(d){
		d.timecreate = new Date(d.timecreate.split(" ")[0]);
	});

	pastNest = d3.nest()
				.key(function(d){ return d.timecreate; })
				.key(function(d){ return d.typetext; })
				.entries(pastData);

	pastTypeNest = d3.nest()
					.key(function(d) { return d.type_ })
					.entries(pastData);

	// this is a hacky way of getting data objects that compare to this time last year
	pastNestDelim = pastNest.slice(0, days.length);

	pastDataDelim = [];

	for (i in pastNestDelim) {
		for(l in pastNestDelim[i].values) {
			for(j in pastNestDelim[i].values[l].values)
				pastDataDelim.push(pastNestDelim[i].values[l].values[j]);
		}
	}

	pastTypeNestDelim = d3.nest()
						.key(function(d) { return d.type_ })
						.entries(pastDataDelim);

	// wait a little bit for d3 to make nest objects before calling next function, which requires them
	setTimeout(function() {
		log.text('> Comparing 2013 and 2014 data...');
		queue(fns);
	}, 500);
}

// count specific kinds of crimes for 2014 and 2013
function compareData() {
	countTypes(propCrimes);
	countTypes(viCrimes);
	countTypes(rapes);
	countTypes(guns);
	countTypes(homicides);

	function countTypes(crimes) {
		for(i in crimes.types) {
			var crime = crimes.types[i];

			function getCount(crime, year) {
				var count;
				year.forEach(function(e) {
					if (crime === e.key) {
						count = e.values.length;
					}
				});
				if( isNaN(count) ) { return 0; } else { return count; } // check for undefined values which get returned if the crime is not in the data
			}
			
			crimes.old = crimes.old + getCount(crime, pastTypeNestDelim);
			crimes.now = crimes.now + getCount(crime, typeNest);
		}
	}
	setTimeout(function() {
		queue(fns);
		log.text('> Making chart components...');
	}, 500);
}

//draw dem graphs!
function drawBar() {
	setTimeout(function() {
		log.text('> Charts complete');
		queue(fns);
	}, 500);

	var data 			=	[propCrimes, viCrimes, guns];
	var labels			=	["Property Crimes", "Violent Crimes", "Gun-related Crimes"];
	var textData		=	[rapes, homicides];
	var	textLabels		=	["Rapes", "Homicides"];
	var margin			=	50;
	var height 			=	400;
	var width 			= 	600;
	var padding			=	30;
	var barWidth		=	(width - (padding * data.length -1) )/(data.length * 2);
	var heightScalar 	=	height/ d3.max(data, function(d) { return +d.now });
	var	currentDay		=	new Date(days[days.length -1]);
	var currDayCopy 	= 	new Date(days[days.length -1]);

	currDayCopy.setFullYear(2013);

	d3.select("#hist-stats #title").text("Compared to this time last year:")
	d3.select("#hist-stats #sub").text("Crimes up to " + currDayCopy.toDateString() + " and up to " + currentDay.toDateString() )

	var svg = d3.select("#hist-stats .bar-chart").append("svg")
				.attr("height", height + margin)
				.attr("width", width + padding);

	var bars = svg.append("g")
				.attr("transform", "translate(" + padding+ ",0)")
				.attr("class", "bars-group")
				.selectAll("rect")
				.data(data)
				.enter();

			bars.append("rect")
				.attr("class", "now")
				.attr("width", barWidth)
				.attr("height", function(d) { return d.now * heightScalar })
				.attr("x", function(d,i) { return ((i + (i + 1 ) ) * barWidth) + (i * padding) }) // odds
				.attr("y", height)
				.attr("stroke", "#eee")
				.transition()
		      		.duration(500)
		      		.ease("out")
		      		.attr("y", function(d) { return height - (d.now * heightScalar) });

			bars.append("rect")
				.attr("class", "old")
				.attr("width", barWidth)
				.attr("height", function(d) { return d.old * heightScalar })
				.attr("x", function(d,i) { return ((i*2) * barWidth) + (i * padding)  }) // evens
				.attr("y", height)
				.attr("stroke", "#eee")
				.transition()
		      		.duration(500)
		      		.ease("out")
		      		.attr("y", function(d) { return height - (d.old * heightScalar) });

	svg.append("line")
		.attr("x1", 0)
		.attr("x2", width + padding)
		.attr("y1", height)
		.attr("y2", height)
		.attr("stroke", "#4a4a4a");

	var nums = svg.select(".bars-group")
					.selectAll("text")
					.data(data)
					.enter();

		nums.append("text")
				.text(function(d) { return d.now })
				.attr("x", function(d,i) { return ((i + (i + 1 ) ) * barWidth) + (i * padding) })
				.attr("y", function(d) { return height - (d.now * heightScalar) })
				.attr("dx", 30)
				.attr("dy", 15)
				.attr("text-anchor", "start")
				.attr("opacity", 0)
				.transition()
					.duration(1000)
					.attr("opacity", 1);

		nums.append("text")
				.text(function(d) { return d.old })
				.attr("x", function(d,i) { return ((i*2) * barWidth) + (i * padding) })
				.attr("y", function(d) { return height - (d.old * heightScalar) })
				.attr("dx", 30)
				.attr("dy", 15)
				.attr("text-anchor", "start")
				.attr("opacity", 0)
				.transition()
					.duration(1000)
					.attr("opacity", 1);

	var labels = svg.append("g")
					.attr("transform", "translate(" + (padding + padding/2)  + "," + (height + (margin/2) ) + ")")
					.attr("class", "label")
					.selectAll(".label")
					.data(labels)
					.enter()
					.append("text")
					.text(function(d) {return d })
					.attr("x", function(d,i) { return i * (barWidth * 2 + padding) })
					.style("text-anchor", "start");

	var legend = svg.append("g")
					.attr("class", "legend")
					.attr("transform", "translate(" + (width - 100) + ",50)")
					.attr("height", "200")
					.attr("width", "100");

		legend.append("rect")
			.attr("height", "20")
			.attr("width", "20")
			.attr("class", "old");

		legend.append("rect")
			.attr("height", "20")
			.attr("width", "20")
			.attr("y", "25")
			.attr("class", "now");

		legend.append("text")
			.attr("x", "35")
			.attr("y", "15")
			.style("color", "#4e4e4e")
			.style("font-size", "18")
			.text("2013");

		legend.append("text")
			.attr("x", "35")
			.attr("y", "40")
			.style("color", "#4e4e4e")
			.style("font-size", "18")
			.text("2014");

	d3.select("#hist-stats .text-stats")
		.html('<h2 class="big-stat"><span class="thirteen">' + textData[0].old + '</span> : <span class="fourteen">' + textData[0].now + '</span></h2>\
				<h4 class="subtitle">' + textLabels[0] + ' this time of year, <span class="thirteen">2013</span> and <span class="fourteen">2014</span></h4>\
				<h2 class="big-stat"><span class="thirteen">' + textData[1].old + '</span> : <span class="fourteen">' + textData[1].now + '</span></h2>\
				<h4 class="subtitle">' + textLabels[1] + ' this time of year, <span class="thirteen">2013</span> and <span class="fourteen">2014</span></h4>');
}

// make cells for heat grid
function makeCells(){
	setTimeout(function() {
		queue(fns);
	}, 500);

	for(i in nest) {
		for(j in nest[i].values){
			var cell = {
				date: nest[i].key,
				crime: nest[i].values[j].key,
				count: nest[i].values[j].values.length
			}
			cells.push(cell);
		}
	}
}

// make the heat grid
function makeChart() {

	d3.select("#heat-grid h2").text("All crimes reported to NOPD, 2014:");

	var cellSize 	=	12;
	var rowNum 		= 	crimeTypes.length;
	var colNum 		= 	days.length
	var width 		= 	cellSize * colNum + 200;
	var height 		= 	cellSize * rowNum + 66;

	var svg = d3.select('#heat-grid').append("svg")
		.attr("width", width)
		.attr("height", height)
		.data(nest);

	var rowLabels = svg.append("g")
		.attr("transform", "translate(200,60)")
		.attr("class", "rowLabels")
		.selectAll(".rowLabel")
		.data(crimeTypes)
		.enter()
		.append("text")
		.text(function(d) { return d })
		.style("text-anchor","end")
		.attr("class", "graph-label")
		.attr("x", 0)
		.attr("y", function(d,i) { return (i+1) * cellSize });

	var colLabels = svg.append("g")
		.attr("transform", "translate(198,60)")
		.attr("class", "colLabels")
		.selectAll(".colLabel")
		.data(nest)
		.enter()
		.append("text")
		.text(function(d) { return new Date(d.key).toDateString() })
		.attr("y", function(d,i) { return (i+1) * cellSize })
		.attr("x", 0)
		.attr("class", "graph-label")
		.attr("transform", "rotate(-90)");

	var vertGrid = svg.append("g")
		.attr("transform", "translate(200,60)")
		.attr("class", "vert-grid")
		.selectAll(".vert-grid")
		.data(days)
		.enter()
		.append("line")
		.attr("x1", function(d,i) { return (i) * cellSize + 2 })
		.attr("x2", function(d,i) { return (i) * cellSize + 2 })
		.attr("y1", 0)
		.attr("y2", height)
		.attr("stroke", "#eee");

	var horzGrid = svg.append("g")
		.attr("transform", "translate(200,60)")
		.attr("class", "horz-grid")
		.selectAll(".horz-grid")
		.data(crimeTypes)
		.enter()
		.append("line")
		.attr("y1", function(d,i) { return (i) * cellSize + 2 })
		.attr("y2", function(d,i) { return (i) * cellSize + 2 })
		.attr("x1", 0)
		.attr("x2", width)
		.attr("stroke", "#eee");

	var colorScale = d3.scale.quantize()
		.domain([0, 50])
		.range(colors);

	var heatMap = svg.append("g")
		.attr("class", "cells")
		.attr("transform", "translate(202,60)")
		.selectAll(".cell")
		.data(cells)
		.enter()
		.append("rect")
		.attr("class","cell")
		.attr("x", function(d) { return (days.indexOf(d.date)) * cellSize } )
		.attr("y", function(d,i) { return (crimeTypes.indexOf(d.crime)) * cellSize + 2 } )
		.attr("height", cellSize)
		.attr("width", cellSize)
		.attr("stroke", "#eee")
		.attr("fill", function(d) { return colorScale(d.count) })
		.on("mouseover", function(d) {
			d3.select("#tooltip")
				.style("left", (d3.event.pageX+10) + "px")
                .style("top", (d3.event.pageY-10) + "px")
                .select("#value")
                .html("<p>Date: " + new Date(d.date).toDateString() + "</p><p>Crime: " + d.crime + "</p>Count: " + d.count + "</p>");
            d3.select("#tooltip").classed("hidden", false);
		})
		.on("mouseout", function() {
			d3.select("#tooltip").classed("hidden", true);
		});
}

// donut chart to be
function makeDonut() {
	var width = 300;
	var height = 300;
	var radius = Math.min(width, height) / 2;

	var colorScale = d3.scale.quantize()
		.domain([0, d3.max(zipCrimes, function(d) { return d.count_zip })])
		.range(colors);

	var svg = d3.select(".zips").append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
    	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	var arc = d3.svg.arc()
		.outerRadius(radius)
		.innerRadius(radius - 70);

	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d){ return d.count_zip });

	var g = svg.selectAll(".arc")
		.data(pie(zipCrimes))
    	.enter()
    	.append("g")
		.attr("class", "arc")
		.append("path")
		.attr("d", arc)
		.attr("stroke", "eee")
		.data(zipCrimes)
		.attr("fill", function(d) {  return colorScale(d.count_zip) });

	g.append("text")
		.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
		.attr("dy", ".35em")
		.style("text-anchor", "middle")
		.text(function(d) { return d.zip; });
}