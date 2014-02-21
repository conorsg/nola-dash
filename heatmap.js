// Written by Conor Gaffney, 2014

// var zipUrl = "https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=zip,typetext,count(typetext)&$group=typetext,zip";

var log = d3.select('#log');
var url = 'https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext,timecreate,type_';
var typesUrl = "https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext&$group=typetext";
var crimeTypes = [];
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
	var cellSize = 12;
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

	// var colorScale = d3.scale.quantile()
	// 	.domain([0, crimeTypes.length])
	// 	.range(colors);

	var heatMap = svg.append("g").attr("class", "cells")
		.attr("transform", "translate(191,63)")
		.selectAll(".cellg")
		.data()
		.enter()
		.append("rect")
		.attr("class","cell")
		.attr("x", function(d,i) { return (i+1) * cellSize } )
		.attr("y", function(d,i) { return (i+1) * cellSize } )
		.attr("height", cellSize)
		.attr("width", cellSize)
		.attr("stroke", "#eee");
		// .attr("fill",);
}
