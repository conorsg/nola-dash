// Distribution of 911 call dispatch times

var log = d3.select(".log p");
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
var lines = [];
var intNest = [];
var freqTime = [];

init();

function init() {

    log.text(" > Fetching data...")

    d3.json(url, function(error,json) {
        data = json;
        i = 1;

        (function pageData(json) {
            if(json.length === 1000) {
                d3.json(url + '&$offset=' + (i*1000), function(error,json) {
                    data = data.concat(json);
                    i++;
                    d3.select(".log .object-count").text( data.length + " objects retrieved");
                    pageData(json);
                });
            } else {
                timify(data); //call next fn in sequence
            }
        }) (json);
    });
}

function timify(data) {
    log.text(" > Calculating times...")

    data.forEach(function(d) {
        if(d.timedispatch) {
            d.timecreate = new Date(d.timecreate);
            d.timedispatch = new Date(d.timedispatch);
            d.timeclosed = new Date(d.timeclosed);

            d.timeresponse = (d.timedispatch - d.timecreate);
            d.timeint = 0.5 * Math.round( (d.timeresponse/60000)/0.5 ); // rounded to the nearest half minute

            responses.push(d);
        }
    });
    makeChartData();
}

function makeChartData() {
    log.text(" > Transforming data...")

    responses.forEach(function(r) {
        //data points for response time frequencies by date, excluding points that have a 0 ms response time
        if(r.timeresponse > 0) {
            freqDate.push({
                date: months[r.timecreate.getMonth()] + " " + r.timecreate.getDate().toString(),
                timecreate: r.timecreate,
                response: (r.timeresponse/1000), // convert milliseconds to seconds
                int: r.timeint,
                type: r.type_,
                typetext: r.typetext,
                cat: categorize(r.type_)
            });
        }
    });

    // calculate median and 95th percentile for response times for all dispatches for each day
    dateQ = d3.nest()
            .key(function(d) { return d.date })
            .entries(freqDate);

    dateQ.forEach(function(d) {
        var range = [];
        d.values.forEach(function(v) {
            range.push(v.response);
        });
        range.sort(function(a,b) { return (a-b) });

        lines.push({
            name: "median",
            date: new Date(d.key + " 2014"),
            value: d3.quantile(range, .5)
        },
        {
            name: "top-percentile",
            date: new Date(d.key + " 2014"),
            value: d3.quantile(range, .95)
        });
    });

    lines = d3.nest().key(function(d) { return d.name }).entries(lines);

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
            range.push(d.response);
        });
        range.sort(function(a,b) { return (a-b) });
        cutoff = d3.quantile(range, 0.99) //FIXME: this exlcudes the 99th percentile, kind of arbitrarily

        for(var i = data.length -1; i >= 0 ; i--){
            if(data[i].response < 0 || data[i].response > cutoff ){
                data.splice(i, 1);
            }
        }
        data = cleaned;
    }

clean(freqTime);
clean(freqDate);
makeDateChart();
makeDateLine();
}


function makeDateChart() {

    log.text(" > Making charts...")

    var height = 500;
    var width = 900;
    var margin = { top: 50, right: 20, bottom: 50, left: 80 };

    d3.select("#date-chart").select(".title").text("NOPD Call for Service Explorer");
    d3.select("#date-chart").select(".date .outer").text("Date: ");
    d3.select("#date-chart").select(".type .outer").text("Event: ");
    d3.select("#date-chart").select(".time .outer").text("Dispatch time: ");

    var legend = d3.select("#date-chart .legend").append("svg")
                    .attr("height", "30")
                    .attr("width", "700");

    legend.append("rect")
        .attr("height", "20")
        .attr("width", "20")
        .attr("class", "property");

    legend.append("rect")
        .attr("height", "20")
        .attr("width", "20")
        .attr("x", "150")
        .attr("class", "violent");

    legend.append("rect")
        .attr("height", "20")
        .attr("width", "20")
        .attr("x", "275")
        .attr("class", "rape");

    legend.append("rect")
        .attr("height", "20")
        .attr("width", "20")
        .attr("x", "350")
        .attr("class", "gun");

    legend.append("rect")
        .attr("height", "20")
        .attr("width", "20")
        .attr("x", "450")
        .attr("class", "homicide");

    legend.append("rect")
        .attr("height", "20")
        .attr("width", "20")
        .attr("x", "550")
        .attr("class", "other");

    legend.append("text")
        .attr("y", "15")
        .attr("x", "25")
        .text("Property Crimes");

    legend.append("text")
        .attr("y", "15")
        .attr("x", "175")
        .text("Violent Crimes");

    legend.append("text")
        .attr("y", "15")
        .attr("x", "300")
        .text("Rape");

    legend.append("text")
        .attr("y", "15")
        .attr("x", "375")
        .text("Gun Crimes");

    legend.append("text")
        .attr("y", "15")
        .attr("x", "475")
        .text("Homicide");

    legend.append("text")
        .attr("y", "15")
        .attr("x", "575")
        .text("Other");

    var svg = d3.select("#date-chart").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .data(freqDate);

    var x = d3.time.scale()
            .domain([freqDate[0].timecreate, freqDate[freqDate.length -1].timecreate])
            .nice(30)
            .rangeRound([0, width]);

    var y = d3.scale.log()
            .domain([d3.min(freqDate, function(d) { return d.response }), d3.max(freqDate, function(d) { return d.response })])
            .rangeRound([height, 0]);

    var formatTime = d3.time.format("%X"),
        formatMinutes = function(d) { return formatTime(new Date(2014, 1, 0, 0, 0, d)); };

    var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

    var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickFormat(formatMinutes);

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
        .text("Time to dispatch (HH: MM: SS)")
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
        .attr("cy", function(d) { return y(d.response) })
        .on("mouseover", function(d) {
            d3.select("#date-chart").select(".info-panel").classed("hidden", false);
            d3.select("#date-chart").select(".date .inner").text(d.date);
            d3.select("#date-chart").select(".type .inner").text(d.typetext);
            d3.select("#date-chart").select(".time .inner").text(Math.floor(d.response / 60) + " minutes " + d.response % 60 + " seconds");
        });
}

function makeDateLine() {

    d3.select("#date-chart-line .title").text("Median and 95th percentile dispatch times");
    d3.select("#date-chart-line .date .outer").text("Date: ");
    d3.select("#date-chart-line .median .outer").text("Median: ");
    d3.select("#date-chart-line .top-percentile .outer").text("95th Percentile: ");

    var height = 600;
    var width = 900;
    var margin = { top: 50, right: 80, bottom: 50, left: 80 };

    var svg = d3.select("#date-chart-line")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .data(freqDate);

    var x = d3.time.scale()
            .domain([freqDate[0].timecreate, freqDate[freqDate.length -1].timecreate])
            .nice(30)
            .rangeRound([0, width]);

    var y = d3.scale.log()
            .domain([d3.min(freqDate, function(d) { return d.response }), d3.max(freqDate, function(d) { return d.response })])
            .rangeRound([height, 0]);

    var formatTime = d3.time.format("%X"),
        formatMinutes = function(d) { return formatTime(new Date(2014, 1, 0, 0, 0, d)); };

    var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

    var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left")
                .tickFormat(formatMinutes);

    var line = d3.svg.line()
                .interpolate("basis")
                .x(function(d) { return x(d.date); })
                .y(function(d) { return y(d.value); });

    var color = d3.scale.category20();

    function tooltip(xVal) {
        //destroy old line
        d3.select(".guideline").remove();
        d3.select(".bead").remove();

        //draw new line
        var guideline = d3.select("#date-chart-line .wrap")
                        .append("line")
                        .attr("class", "guideline")
                        .attr("x1", xVal + 3)
                        .attr("x2", xVal + 3)
                        .attr("y1", height)
                        .attr("y2", 0)
                        .style("stroke", "grey");

        //draw beads on lines
        // var bead = d3.select("#date-chart-line .wrap")
        //             .selectAll(".bead")
        //             .data(lines)
        //             .enter()
        //             .append("circle")
        //             .attr("class", "bead")
        //             .attr("r", 6)
        //             .attr("cx", xVal)
        //             .attr("cy", function(d) {
        //                 i = lookup(xVal);
        //                 return y(lines[0].values[i].value);
        //             });

        //draw data in info window
        var date = d3.select("#date-chart-line .info-panel .date .inner").text(function(d) { i = lookup(xVal); return lines[1].values[i].date.toDateString(); });
        var median = d3.select("#date-chart-line .info-panel .median .inner").text(function(d) { i = lookup(xVal); return Math.floor((lines[0].values[i].value) / 60) + " minutes " + Math.floor(lines[0].values[i].value % 60) + " seconds"; });
        var topP = d3.select("#date-chart-line .info-panel .top-percentile .inner").text(function(d) { i = lookup(xVal); return Math.floor((lines[1].values[i].value) / 60) + " minutes " + Math.floor(lines[1].values[i].value % 60) + " seconds"; });

        //lookup data object by graph x value
        function lookup(num) {
            index = 0;
            i = 0;
            do {
                index = x(lines[1].values[i].date);
                i++;
            } while (index < num)
            return i - 1;
        }
    }

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
        .text("Time to dispatch (HH: MM: SS)")
        .attr("transform", "rotate(-90)")
        .attr("dy", "-" + (margin.left - 10) + "")
        .attr("dx", "-" + (height + margin.top + margin.bottom)/2 + "");

    var wrap = svg.append("g")
                .attr("class", "wrap")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    wrap.append("rect")
        .attr("height", height)
        .attr("width", width)
        .attr("opacity", 0);

    var qLines = wrap.selectAll(".line")
                .data(lines)
                .enter()
                .append("g")
                .attr("class", "line")
                .append("path")
                .attr("class", function(d) { return d.key; })
                .attr("d", function(d) { return line(d.values); })
                .style("stroke", function(d) { return color(d.key); });

    wrap.append("text")
        .text("Median")
        .attr("x", 3)
        .attr("dy", ".35em")
        .attr("transform", "translate(" + x(lines[0].values[lines[0].values.length - 1].date) + "," + y(lines[0].values[lines[0].values.length - 1].value) + ")");

    wrap.append("text")
        .text("95th percentile")
        .attr("x", 3)
        .attr("dy", ".35em")
        .attr("transform", "translate(" + x(lines[1].values[lines[1].values.length - 1].date) + "," + y(lines[1].values[lines[1].values.length - 1].value) + ")");

    wrap.on("mousemove", function(d) {
        d3.select("#date-chart-line .info-panel").classed("hidden", false);
        tooltip(d3.mouse(this)[0]);
    });

    d3.select("#date-chart-line .info-panel .title").text("Median and 95th Percentile Dispatch Times");

    log.text(" > Charts complete")
}
