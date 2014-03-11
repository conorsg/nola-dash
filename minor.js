var c 			=	0;
var fns 		=	[
						getCrimeTypes,
						getNewData,
						getOldData,
						transform,
						makeCells
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
var colors 		= 	[
						"#fff", "#fef6f4", "#fde8e4", "#fbdbd5", "#facec5", "#f9c1b5", "#f7b4a6", "#f6a796", "#f49a86", "#f38c77", "#f27f67", "#f07258", "#ef6548", "#ee5838", "#ec4b29", "#eb3e19", "#e03714", "#d03312", "#c02f11", "#b12b0f", "#a1280e", "#91240d", "#82200b", "#721c0a", "#631809", "531407", "#431106", "#340d05", "#240903", "#140502", "#050100", "#000"
					];

queue(fns);

// first we make a sequence of calls to get our data
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
				queue(fns);
				pastData.done = true;
			}
		}) (json);	
	});	
}

// now we transform the data to be more manipulable and writeable for charts
function transform() {
	data.forEach(function(d){
		d.timecreate = d.timecreate.split(" ")[0]
	});
	
	nest = d3.nest()
		.key(function(d){ return d.timecreate; })
		.key(function(d){ return d.typetext; })
		.entries(data);

	typeNest = d3.nest()
			.key(function(d) { return d.type_ })
			.entries(data);

	pastData.forEach(function(d){
		d.timecreate = d.timecreate.split(" ")[0]
	});
	
	pastNest = d3.nest()
				.key(function(d){ return d.timecreate; })
				.key(function(d){ return d.typetext; })
				.entries(pastData);

	pastTypeNest = d3.nest()
					.key(function(d) { return d.type_ })
					.entries(pastData);

	// wait a little bit for d3 to make nest objects before calling next function, which requires them
	setTimeout(function() {
		queue(fns);
	}, 3000);
}

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