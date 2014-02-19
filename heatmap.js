// Written by Conor Gaffney, 2014

// var zipUrl = "https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=zip,typetext,count(typetext)&$group=typetext,zip";

var main = d3.select('.main');
var url = 'https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext,timecreate,type_';
var typesUrl = "https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=type_&$group=type_";
var crimeTypes;
var data;
var nest;



// get the data
d3.json(typesUrl, function(error, json){
	crimeTypes = json;
});

d3.json(url, function(error, json){
	data = json;

	// deal with paginated data
	var offset = 0;
	getPagedData(json);
	
	function getPagedData(json) {
		if(json.length == 1000) {
			offset = offset + 1000;
			main.html('<h2>Fetching data...</h2>')

			d3.json(url + '&$offset=' + offset, function(error, json){
				data = data.concat(json);
				getPagedData(json);
			});
		} else {
			main.html('<h2>Data retrieved</h2>')
			transformData(data);
			return false;
		}
	}
});

// transform the data
function transformData(data) {
	main.html('<h2>Analyzing the data...</h2>');

	// get rid of the hours, minutes, seconds
	data.forEach(function(d){
		d.timecreate = d.timecreate.split(" ")[0]
	});
	// aggregate the data by day and then violation type
	nest = d3.nest().key(function(d){return d.timecreate;}).key(function(d){return d.type_;}).entries(data);
	main.html('<h2>Data transformed</h2>');
	return nest;
}