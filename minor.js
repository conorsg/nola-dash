var c 			=	0;
var fns 		=	[
						getCrimeTypes,
						getNewData,
						getOldData
					];
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

queue(fns);

function queue(arr) {
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
				// queue(fns);
				pastData.done = true;
			}
		}) (json);	
	});	
}

function transform(data) {
	data.forEach(function(d){
		d.timecreate = d.timecreate.split(" ")[0]
	});
	
	nest = d3.nest()
		.key(function(d){ return d.timecreate; })
		.key(function(d){ return d.typetext; })
		.entries(data);
}

function makeCells(nest){
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