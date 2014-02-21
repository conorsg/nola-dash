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
			log.html('<h2>Fetching data...</h2>')

			d3.json(url + '&$offset=' + offset, function(error, json){
				data = data.concat(json);
				getPagedData(json);
			});
		} else {
			log.html('<h2>Data retrieved</h2>')
			transformData(data);
			makeCells();
			// create array object of days
			for(i in nest) { days.push(nest[i].key) }
			return false;
		}
	}
});


// transform the data
function transformData(data) {
	log.html('<h2>Analyzing the data...</h2>');

	// get rid of the hours, minutes, seconds
	data.forEach(function(d){
		d.timecreate = d.timecreate.split(" ")[0]
	});

	// aggregate the data by day and then violation type
	nest = d3.nest()
		.key(function(d){ return d.timecreate; })
		.key(function(d){ return d.typetext; })
		.entries(data);
	log.html('<h2>Data transformed</h2>');
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
	var cellSize = 10;
	var rowNum = crimeTypes.length;
	var colNum = 52; //weeks in the year
	var width = cellSize * colNum;
	var height = cellSize * rowNum + 60;

	var svg = d3.select('#chart').append("svg")
		.attr("width", width)
		.attr("height", height)
		.data(nest);

	var rowLabels = svg.append("g")
		.attr("transform", "translate(200,60)")
		.selectAll(".rowLabelg")
		.data(crimeTypes)
		.enter()
		.append("text")
		.text(function(d) { return d })
		.style("text-anchor","end")
		.attr("class", "graph-label")
		.attr("x", 0)
		.attr("y", function(d,i) { return (i+1) * cellSize });

	var colLabels = svg.append("g")
		.attr("transform", "translate(200,60)")
		.selectAll(".colLabelg")
		.data(nest)
		.enter()
		.append("text")
		.text(function(d) { return d.key })
		.attr("y", function(d,i) { return (i+1) * cellSize })
		.attr("x", 0)
		.attr("class", "graph-label")
		.attr("transform", "rotate(-90)");

	var colorScale = d3.scale.ordinal()
		.domain([0, crimeTypes.length])
		.range(colorbrewer.RdBu[9]);

	var heatMap = svg.append("g").attr("class", "cells")
		.attr("transform", "translate(202,60)")
		.selectAll(".cellg")
		.data(cells)
		.enter()
		.append("rect")
		.attr("class","cell")
		.attr("x", function(d) { return (days.indexOf(d.date)) * cellSize } )
		.attr("y", function(d,i) { return (crimeTypes.indexOf(d.crime)) * cellSize } )
		.attr("height", cellSize)
		.attr("width", cellSize)
		.attr("fill", function(d) { return colorScale(d.count) });
}
