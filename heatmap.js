// Written by Conor Gaffney, 2014

// var zipUrl = "https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=zip,typetext,count(typetext)&$group=typetext,zip";

var log = d3.select('#log');
var url = 'https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext,timecreate,type_';
var typesUrl = "https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext&$group=typetext";
var crimeTypes = [];
var data;
var nest;


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

	var heatMap = svg.append("g").attr("class", "cells")
		.attr("transform", "translate(191,63)")
		.selectAll(".cellg")
		.data(function(d) { return d.values })
		.enter()
		.append("rect")
		.attr("class","cell")
		.attr("x", 12)
		.attr("y", function(d) { return crimeTypes.indexOf(d.key) * cellSize })
		.attr("height", cellSize)
		.attr("width", cellSize);
}
