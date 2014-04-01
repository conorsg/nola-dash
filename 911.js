// Distribution of 911 call response times

var c = 0;
var fns = [];
var months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
var url = 'https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=timecreate,typetext,type_,timedispatch,timeclosed';
var data;
var responses = [];
var freqDate = [];
var freqTime = [];

init();

function init() {
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
                timify(data); //call next fn in sequence
            }
        }) (json);
    });
}

function timify(data) {
    data.forEach(function(d) {
        if(d.timedispatch) {
            d.timecreate = new Date(d.timecreate);
            d.timedispatch = new Date(d.timedispatch);
            d.timeclosed = new Date(d.timeclosed);

            d.timeresponse = (d.timedispatch - d.timecreate);
            d.timeint = 0.5 * Math.round( (d.timeresponse/6000)/0.5 ) // rounded to the nearest half minute

            responses.push(d);
        }
    });
    makeChartData();
}

function makeChartData() {
    responses.forEach(function(r) {
        //data points for response time frequencies by date
        freqDate.push({
            date: months[r.timecreate.getMonth()] + " " + r.timecreate.getDate().toString(),
            response: r.timeresponse,
            type: r.type_
        });
    });

    freqTime = d3.nest()
                .key(function(d) { return d.timeint })
                .entries(responses)

    for(f in freqTime) {
        freqTime[f].values = freqTime[f].values.length
    }
}
