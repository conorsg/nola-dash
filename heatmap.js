// Written by Conor Gaffney, 2014

var url = "http://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&select=typetext,count(typetext)&$group=typetext";
var data;

d3.json(url, function(error, json) {
	data = json;
});