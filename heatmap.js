// Written by Conor Gaffney, 2014

// var zipUrl = "https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=zip,typetext,count(typetext)&$group=typetext,zip";

var log = d3.select('#log');
var url = 'https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext,timecreate,type_';
var typesUrl = "https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext&$group=typetext";
var crimeTypes = [];
var days = [];
var data;
var nest;
var cells = [];


// get the data
d3.json(typesUrl, function(error, json){
	json.forEach(function(d){
		crimeTypes = crimeTypes.concat(d.typetext);
	});
});

d3.json(url, function(error, json){
	data = json;

	// deal with paginated data
	var offset = 0;
	getPagedData(json);
	
	function getPagedData(json) {
		if(json.length == 1000) {
			offset = offset + 1000;
			log.html('<p>> Fetching data...</p>')

			d3.json(url + '&$offset=' + offset, function(error, json){
				data = data.concat(json);
				getPagedData(json);
			});
		} else {
			log.html('<p>> Data retrieved</p>')
			// call all functions to transform data and make chart
			transformData(data);
			makeCells();
			// create array object of days
			for(i in nest) { days.push(nest[i].key) }
			makeChart();
			return false;
		}
	}
});


// transform the data
function transformData(data) {
	log.html('<p>> Analyzing the data...</p>');

	// get rid of the hours, minutes, seconds
	data.forEach(function(d){
		d.timecreate = d.timecreate.split(" ")[0]
	});

	// aggregate the data by day and then violation type
	nest = d3.nest()
		.key(function(d){ return d.timecreate; })
		.key(function(d){ return d.typetext; })
		.entries(data);
	log.html('<p>> Data transformed</p>');
	return nest;
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


// make the chart
function makeChart() {
	var cellSize = 12;
	var rowNum = crimeTypes.length;
	var colNum = days.length
	var width = (cellSize) * colNum + 200;
	var height = cellSize * rowNum + 66;
	var colors = ["#fff", "#fef6f4", "#fde8e4", "#fbdbd5", "#facec5", "#f9c1b5", "#f7b4a6", "#f6a796", "#f49a86", "#f38c77", "#f27f67", "#f07258", "#ef6548", "#ee5838", "#ec4b29", "#eb3e19", "#e03714", "#d03312", "#c02f11", "#b12b0f", "#a1280e", "#91240d", "#82200b", "#721c0a", "#631809", "531407", "#431106", "#340d05", "#240903", "#140502", "#050100", "#000"]

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
	log.html('<p>> Chart complete</p>');
}
