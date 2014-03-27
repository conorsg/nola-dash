// Distribution of 911 response times

var c = 0;
var fns = [];
var url = 'https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=timecreate,typetext,type_,timedispatch,timeclosed';
var data;


function dataCall() {
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
                console.log(data.length)
            }
        }) (json);
    });
}
