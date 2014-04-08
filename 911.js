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
        //data points for response time frequencies by date, excluding points that have a 0 ms response time
        if(r.timeresponse > 0) {
            freqDate.push({
                date: months[r.timecreate.getMonth()] + " " + r.timecreate.getDate().toString(),
                timecreate: r.timecreate,
                response: (r.timeresponse/1000),
                int: r.timeint,
                type: r.type_,
                cat: categorize(r.type_)
            });
        }
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
    // remove outliers and negative dispatch times on interval properties
    function clean(data) {
        var cleaned;
        var range = [];

        data.forEach(function(d) {
            range.push(d.int);
        });
        range.sort(function(a,b) { return (a-b) });
        cutoff = d3.quantile(range, 0.99) //FIXME: this exlcudes the 99th percentile, kind of arbitrarily

        for(var i = data.length -1; i >= 0 ; i--){
            if(data[i].int < 0 || data[i].int > cutoff ){
                data.splice(i, 1);
            }
        }

        data = cleaned;
    }

clean(freqTime);
clean(freqDate);
makeDateChart();
}


function makeDateChart() {

    // var daysNest = d3.nest().key(function(d) { return d.date }).entries(freqDate);
    // var days = [];
    // daysNest.forEach(function(d) { days.push(d.key); });

    var height = 600;
    var width = 960;
    var margin = { top: 50, right: 0, bottom: 50, left: 50 };

    var svg = d3.select("#date-chart").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .data(freqDate);

    var x = d3.time.scale()
            .domain([freqDate[0].timecreate, freqDate[freqDate.length -1].timecreate])
            .rangeRound([0, width]);

    var y = d3.scale.log()
            .domain([d3.min(freqDate, function(d) { return d.response }), d3.max(freqDate, function(d) { return d.response })])
            .rangeRound([height, 0])
            .nice(1);

    var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

    var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(3, "g");

    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + (height + margin.top) + ")")
        .call(xAxis)
        .attr("class", "x axis");

    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(yAxis)
        .attr("class", "y axis")
        .append("text")
        .attr("class", "title")
        .text("Seconds to dispatch")
        .attr("transform", "rotate(-90)")
        .attr("dy", "-" + (margin.left - 10) + "")
        .attr("dx", "-" + (height + margin.top + margin.bottom)/2 + "");

    svg.append("g")
        .attr("class", "points")
        .attr("transform", "translate(" + (margin.left + 3) + "," + (margin.top - 3) + ")")
        .selectAll(".point")
        .data(freqDate)
        .enter()
        .append("circle")
        .attr("class", function(d) { return d.cat })
        .attr("r", 3)
        .attr("cx", function(d) { return x(d.timecreate) })
        .attr("cy", function(d) { return y(d.response) });
}
