// Distribution of 911 call response times

var months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
var url = "https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=timecreate,typetext,type_,timedispatch,timeclosed";
var property = ["67P", "55", "67F", "67A", "67", "56", "62", "67S", "62C", "62R", "67B", "56D", "62B", "65", "67E", "67C", "65P", "60", "65J"];
var violent = ["35D", "64G", "35", "34", "34S", "37", "34D", "34C", "37D", "38D"];
var homicide = ["30", "30S", "30C", "30D"];
var rape = ["42", "43"];
var gun = ["64G", "94", "95", "95G"];
var data;
var responses = [];
var freqDate = [];
var intNest = [];
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
            d.timeint = 0.5 * Math.round( (d.timeresponse/60000)/0.5 ) // rounded to the nearest half minute

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
            type: r.type_,
            cat: categorize(r.type_)
        });
    });
    // master nested object for reponse time interval series
    intNest = d3.nest()
                .key(function(d) { return d.timeint })
                .entries(responses)

    intNest.forEach(function(n) {

        counts = count(n.values);

        freqTime.push({
            int: n.key,
            property: counts.property,
            violent: counts.violent,
            rape: counts.rape,
            homicide: counts.homicide,
            gun: counts.gun,
            other: counts.other
        });
    });

    //categorizes types of crimes
    function categorize(type) {
        var result;

        property.forEach(function(t) {
            if( type == t) { result = "property"; }
        });
        violent.forEach(function(t) {
            if( type == t) { result = "violent"; }
        });
        rape.forEach(function(t) {
            if( type == t) { result = "rape"; }
        });
        homicide.forEach(function(t) {
            if( type == t) { result = "homicide"; }
        });
        gun.forEach(function(t) {
            if( type == t) { result = "gun"; }
        });

        if(!result) { result = "other"; }

        return result;
    }

    // count types of crimes by categories
    function count(array) {
        var counts = {
            property: 0,
            violent: 0,
            rape: 0,
            homicide: 0,
            gun: 0,
            other: 0
        };
        array.forEach(function(a) {
            property.forEach(function(t) {
                    if(a.type_ == t) { counts.property++; }
            });
            violent.forEach(function(t) {
                    if(a.type_ == t) { counts.violent++; }
            });
            rape.forEach(function(t) {
                    if(a.type_ == t) { counts.rape++; }
            });
            homicide.forEach(function(t) {
                    if(a.type_ == t) { counts.homicide++; }
            });
            gun.forEach(function(t) {
                    if(a.type_ == t) { counts.gun++; }
            });
        });

        counts.other = array.length - (counts.property + counts.violent + counts.rape + counts.homicide + counts.gun);

        return counts;
    }
}

function makeDateChart() {

    var days = d3.nest().key(function(d) { return d.date }).entries(freqDate);

    var height = 600;
    var width = 960;
    var bandWidth = width/days.length //FIXME: hack for horizontal scale

    var svg = d3.select("#date-chart").append("svg")
                .attr("width", width)
                .attr("height", height)
                .data(freqDate);

    var xLabels = svg.append("g")
                    .attr("width", width)
                    .attr("height", 100)
                    .attr("class", "x-labels")
                    .selectAll("x-label")
                    .data(days)
                    .enter()
                    .append("text")
                    .text(function(d) { return d.key })
                    .attr("x", 0)
                    .attr("y", function(d,i) { return (i * bandWidth) })
                    .attr("class", "label")
                    .attr("transform", "rotate(-90)");
}
