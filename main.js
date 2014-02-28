// Written by Conor Gaffney, 2014
// This is a mess

var chartLog = d3.select('#heat-grid .log');
var barLog = d3.select('#hist-stats .log');
var offset = 0;
var url = 'https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext,timecreate,type_';
var typesUrl = "https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext&$group=typetext";
var zipUrl = "https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=zip,count(zip)&$group=zip";
var zipCrimes = [];
var crimeTypes = [];
var days = [];
var offset = 0;
var data;
var nest;
var cells = [];
var homicides = [];
var colors = ["#fff", "#fef6f4", "#fde8e4", "#fbdbd5", "#facec5", "#f9c1b5", "#f7b4a6", "#f6a796", "#f49a86", "#f38c77", "#f27f67", "#f07258", "#ef6548", "#ee5838", "#ec4b29", "#eb3e19", "#e03714", "#d03312", "#c02f11", "#b12b0f", "#a1280e", "#91240d", "#82200b", "#721c0a", "#631809", "531407", "#431106", "#340d05", "#240903", "#140502", "#050100", "#000"];


// get the data
d3.json(typesUrl, function(error, json){
	json.forEach(function(d){
		crimeTypes.push(d.typetext);
	});
});

d3.json(zipUrl, function(error, json){
	json.forEach(function(d){
		zipCrimes.push(d);
	});
});

d3.json(url, function(error, json){
	data = json;
	pageData(json, url, data, chartLog);
});


// retrieval and transform fns

function pageData(json,url,arr,log) {
	if(json.length == 1000) {
		offset = offset + 1000; // use offest param to page through data 
		// log.html('<p>> Fetching data...</p>');
		
		d3.json(url + '&$offset=' + offset, function(error,response){
			arr.concat(response);
			pageData(json);
		});
	} else {
		// log.html('<p>> Data retrieved</p>');
		offset = 0; // reset offset
		return false;
	}
}

// function getPagedData(json) {
// 	if(json.length == 1000) {
// 		offset = offset + 1000;
// 		chartLog.html('<p>> Fetching data...</p>')

// 		d3.json(url + '&$offset=' + offset, function(error, json){
// 			data = data.concat(json);
// 			getPagedData(json);
// 		});
// 	} else {
// 		chartLog.html('<p>> Data retrieved</p>')
// 		offset = 0;
// 		drawAll();
// 		return false;
// 	}
// }


// transform the data
function transformData(data) {
	chartLog.html('<p>> Analyzing the data...</p>');

	// get rid of the hours, minutes, seconds
	data.forEach(function(d){
		d.timecreate = d.timecreate.split(" ")[0]
	});

	// aggregate the data by day and then violation type
	nest = d3.nest()
		.key(function(d){ return d.timecreate; })
		.key(function(d){ return d.typetext; })
		.entries(data);
	chartLog.html('<p>> Data transformed</p>');

	// count homicides
	for(i in data) {
		if(data[i].type_ === "30S") {
			homicides.push(data[i])
		}
	}

	// turn zipCrimes into numbers
	for(i in zipCrimes) {
		if(zipCrimes[i].zip == null || zipCrimes[i].count_zip == null) {
			zipCrimes.splice(i,1);
		} else{}
		zipCrimes[i].count_zip = Number(zipCrimes[i].count_zip);
		zipCrimes[i].zip = Number(zipCrimes[i].zip);
	}
}

// create flatter data object for heatmap chart
function makeCells(){
	for(i in nest) {
		for(c in nest[i].values){
			var cell = {
				date: nest[i].key,
				crime: nest[i].values[c].key,
				count: nest[i].values[c].values.length
			}
			cells.push(cell);
		}
	}
}

function drawAll() {
	transformData(data);
	makeCells();
	for(i in nest) { days.push(nest[i].key) }
	makeChart();
	makeTopStats();
	makeDonut();
}

// make the chart
function makeChart() {
	var cellSize = 12;
	var rowNum = crimeTypes.length;
	var colNum = days.length
	var width = (cellSize) * colNum + 200;
	var height = cellSize * rowNum + 66;

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
		.text(function(d) { return d.key })
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
                .html("<p>Date: " + d.date + "</p><p>Crime: " + d.crime + "</p>Count: " + d.count + "</p>");
            d3.select("#tooltip").classed("hidden", false);
		})
		.on("mouseout", function() {
			d3.select("#tooltip").classed("hidden", true);
		});
	chartLog.html('<p>> Chart complete</p>');
}

// make top stats charts

function makeTopStats() {
	d3.select(".homicides").html('<h2>Homicides:</h2><h1 class="count">' + homicides.length + '</h1><h3 class="sub-title">Population: 369,250');
}

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