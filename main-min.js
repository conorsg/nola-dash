function queue(e){e[c]();c++}function logObjects(){if(!data.done||!pastData.done){d3.select(".log .object-count").text("("+(data.length+pastData.length)+" data objects retrieved)");setTimeout(function(){logObjects()},100)}else{d3.select(".log .object-count").text("("+(data.length+pastData.length)+" data objects retrieved)");return false}}function getCrimeTypes(){d3.json(typesUrl,function(e,t){t.forEach(function(e){crimeTypes.push(e.typetext)});queue(fns);log.text("> Fetching 2014 data...");crimeTypes.done=true})}function getNewData(){d3.json(url,function(e,t){data=t;i=1;(function n(e){if(e.length===1e3){d3.json(url+"&$offset="+i*1e3,function(e,t){data=data.concat(t);i++;n(t)})}else{queue(fns);log.text("> Fetching 2013 data...");data.done=true}})(t)})}function getOldData(){d3.json(pastUrl,function(e,t){pastData=t;i=1;(function n(e){if(e.length===1e3){d3.json(pastUrl+"&$offset="+i*1e3,function(e,t){pastData=pastData.concat(t);i++;n(t)})}else{queue(fns);log.text("> Transforming data...");pastData.done=true}})(t)})}function transform(){data.forEach(function(e){e.timecreate=new Date(e.timecreate.split(" ")[0])});nest=d3.nest().key(function(e){return e.timecreate}).key(function(e){return e.typetext}).entries(data);for(i in nest){days.push(nest[i].key)}typeNest=d3.nest().key(function(e){return e.type_}).entries(data);pastData.forEach(function(e){e.timecreate=new Date(e.timecreate.split(" ")[0])});pastNest=d3.nest().key(function(e){return e.timecreate}).key(function(e){return e.typetext}).entries(pastData);pastTypeNest=d3.nest().key(function(e){return e.type_}).entries(pastData);pastNestDelim=pastNest.slice(0,days.length);pastDataDelim=[];for(i in pastNestDelim){for(l in pastNestDelim[i].values){for(j in pastNestDelim[i].values[l].values)pastDataDelim.push(pastNestDelim[i].values[l].values[j])}}pastTypeNestDelim=d3.nest().key(function(e){return e.type_}).entries(pastDataDelim);setTimeout(function(){log.text("> Comparing 2013 and 2014 data...");queue(fns)},500)}function compareData(){function e(e){for(i in e.types){var t=e.types[i];function n(e,t){var n;t.forEach(function(t){if(e===t.key){n=t.values.length}});if(isNaN(n)){return 0}else{return n}}e.old=e.old+n(t,pastTypeNestDelim);e.now=e.now+n(t,typeNest)}}e(propCrimes);e(viCrimes);e(rapes);e(guns);e(homicides);setTimeout(function(){queue(fns);log.text("> Making chart components...")},500)}function drawBar(){setTimeout(function(){log.text("> Charts complete");queue(fns)},500);var e=[propCrimes,viCrimes,guns];var t=["Property Crimes","Violent Crimes","Gun-related Crimes"];var n=[rapes,homicides];var r=["Rapes","Homicides"];var i=50;var s=400;var o=600;var u=30;var a=(o-(u*e.length-1))/(e.length*2);var f=s/d3.max(e,function(e){return+e.now});var l=new Date(days[days.length-1]);var c=new Date(days[days.length-1]);c.setFullYear(2013);d3.select("#hist-stats #title").text("Compared to this time last year:");d3.select("#hist-stats #sub").text("Crimes up to "+c.toDateString()+" and up to "+l.toDateString());var h=d3.select("#hist-stats .bar-chart").append("svg").attr("height",s+i).attr("width",o+u);var p=h.append("g").attr("transform","translate("+u+",0)").attr("class","bars-group").selectAll("rect").data(e).enter();p.append("rect").attr("class","now").attr("width",a).attr("height",function(e){return e.now*f}).attr("x",function(e,t){return(t+(t+1))*a+t*u}).attr("y",s).attr("stroke","#eee").transition().duration(500).ease("out").attr("y",function(e){return s-e.now*f});p.append("rect").attr("class","old").attr("width",a).attr("height",function(e){return e.old*f}).attr("x",function(e,t){return t*2*a+t*u}).attr("y",s).attr("stroke","#eee").transition().duration(500).ease("out").attr("y",function(e){return s-e.old*f});h.append("line").attr("x1",0).attr("x2",o+u).attr("y1",s).attr("y2",s).attr("stroke","#4a4a4a");var d=h.select(".bars-group").selectAll("text").data(e).enter();d.append("text").text(function(e){return e.now}).attr("x",function(e,t){return(t+(t+1))*a+t*u}).attr("y",function(e){return s-e.now*f}).attr("dx",30).attr("dy",15).attr("text-anchor","start").attr("opacity",0).transition().duration(1e3).attr("opacity",1);d.append("text").text(function(e){return e.old}).attr("x",function(e,t){return t*2*a+t*u}).attr("y",function(e){return s-e.old*f}).attr("dx",30).attr("dy",15).attr("text-anchor","start").attr("opacity",0).transition().duration(1e3).attr("opacity",1);var t=h.append("g").attr("transform","translate("+(u+u/2)+","+(s+i/2)+")").attr("class","label").selectAll(".label").data(t).enter().append("text").text(function(e){return e}).attr("x",function(e,t){return t*(a*2+u)}).style("text-anchor","start");var v=h.append("g").attr("class","legend").attr("transform","translate("+(o-100)+",50)").attr("height","200").attr("width","100");v.append("rect").attr("height","20").attr("width","20").attr("class","old");v.append("rect").attr("height","20").attr("width","20").attr("y","25").attr("class","now");v.append("text").attr("x","35").attr("y","15").style("color","#4e4e4e").style("font-size","18").text("2013");v.append("text").attr("x","35").attr("y","40").style("color","#4e4e4e").style("font-size","18").text("2014");d3.select("#hist-stats .text-stats").html('<h2 class="big-stat"><span class="thirteen">'+n[0].old+'</span> : <span class="fourteen">'+n[0].now+'</span></h2>				<h4 class="subtitle">'+r[0]+' this time of year, <span class="thirteen">2013</span> and <span class="fourteen">2014</span></h4>				<h2 class="big-stat"><span class="thirteen">'+n[1].old+'</span> : <span class="fourteen">'+n[1].now+'</span></h2>				<h4 class="subtitle">'+r[1]+' this time of year, <span class="thirteen">2013</span> and <span class="fourteen">2014</span></h4>')}function makeCells(){setTimeout(function(){queue(fns)},500);for(i in nest){for(j in nest[i].values){var e={date:nest[i].key,crime:nest[i].values[j].key,count:nest[i].values[j].values.length};cells.push(e)}}}function drawGrid(){d3.select("#heat-grid h2").text("All crimes reported to NOPD, 2014:");var e=12;var t=crimeTypes.length;var n=days.length;var r=e*n+200;var i=e*t+66;var s=d3.select("#heat-grid").append("svg").attr("width",r).attr("height",i).data(nest);var o=s.append("g").attr("transform","translate(200,100)").attr("class","rowLabels").selectAll(".rowLabel").data(crimeTypes).enter().append("text").text(function(e){return e}).style("text-anchor","end").attr("class","graph-label").attr("x",0).attr("y",function(t,n){return(n+1)*e});var u=s.append("g").attr("transform","translate(198,100)").attr("class","colLabels").selectAll(".colLabel").data(nest).enter().append("text").text(function(e){return(new Date(e.key)).toDateString()}).attr("y",function(t,n){return(n+1)*e}).attr("x",0).attr("class","graph-label").attr("transform","rotate(-90)");var a=s.append("g").attr("transform","translate(200,100)").attr("class","vert-grid").selectAll(".vert-grid").data(days).enter().append("line").attr("x1",function(t,n){return n*e+2}).attr("x2",function(t,n){return n*e+2}).attr("y1",0).attr("y2",i).attr("stroke","#eee");var f=s.append("g").attr("transform","translate(200,100)").attr("class","horz-grid").selectAll(".horz-grid").data(crimeTypes).enter().append("line").attr("y1",function(t,n){return n*e+2}).attr("y2",function(t,n){return n*e+2}).attr("x1",0).attr("x2",r).attr("stroke","#eee");var l=d3.scale.quantize().domain([0,50]).range(colors);var c=s.append("g").attr("class","cells").attr("transform","translate(202,100)").selectAll(".cell").data(cells).enter().append("rect").attr("class","cell").attr("x",function(t){return days.indexOf(t.date)*e}).attr("y",function(t,n){return crimeTypes.indexOf(t.crime)*e+2}).attr("height",e).attr("width",e).attr("stroke","#eee").attr("fill",function(e){return l(e.count)}).on("mouseover",function(e){d3.select("#tooltip").style("left",d3.event.pageX+10+"px").style("top",d3.event.pageY-10+"px").select("#value").html("<p>Date: "+(new Date(e.date)).toDateString()+"</p><p>Crime: "+e.crime+"</p>Count: "+e.count+"</p>");d3.select("#tooltip").classed("hidden",false)}).on("mouseout",function(){d3.select("#tooltip").classed("hidden",true)})}function makeDonut(){var e=300;var t=300;var n=Math.min(e,t)/2;var r=d3.scale.quantize().domain([0,d3.max(zipCrimes,function(e){return e.count_zip})]).range(colors);var i=d3.select(".zips").append("svg").attr("width",e).attr("height",t).append("g").attr("transform","translate("+e/2+","+t/2+")");var s=d3.svg.arc().outerRadius(n).innerRadius(n-70);var o=d3.layout.pie().sort(null).value(function(e){return e.count_zip});var u=i.selectAll(".arc").data(o(zipCrimes)).enter().append("g").attr("class","arc").append("path").attr("d",s).attr("stroke","eee").data(zipCrimes).attr("fill",function(e){return r(e.count_zip)});u.append("text").attr("transform",function(e){return"translate("+s.centroid(e)+")"}).attr("dy",".35em").style("text-anchor","middle").text(function(e){return e.zip})}var c=0;var fns=[getCrimeTypes,getNewData,getOldData,transform,compareData,drawBar,makeCells,drawGrid];var log=d3.select(".log p");var url="https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext,timecreate,type_";var pastUrl="http://data.nola.gov/resource/5fn8-vtui.json?disposition=RTF&$select=typetext,timecreate,type_";var typesUrl="https://data.nola.gov/resource/jsyu-nz5r.json?disposition=RTF&$select=typetext&$group=typetext";var crimeTypes=[];var days=[];var cells=[];var data=[];var pastData=[];var nest;var pastNest;var homicides=[];var propCrimes={types:["65","65P","56","56D","55","52","51","62","62C","62R","67S","67A","67F","67","67P"],old:0,now:0};var viCrimes={types:["38","38D","34S","35D","35","43B","42","43","30S","37","37D","64K","64J","64G","64"],old:0,now:0};var rapes={types:["42","43"],old:0,now:0};var guns={types:["64G","95G"],old:0,now:0};var homicides={types:["30","30C","30S"],old:0,now:0};var colors=["#fff","#fef6f4","#fde8e4","#fbdbd5","#facec5","#f9c1b5","#f7b4a6","#f6a796","#f49a86","#f38c77","#f27f67","#f07258","#ef6548","#ee5838","#ec4b29","#eb3e19","#e03714","#d03312","#c02f11","#b12b0f","#a1280e","#91240d","#82200b","#721c0a","#631809","531407","#431106","#340d05","#240903","#140502","#050100","#000"];queue(fns);log.text("> Getting crime categories...");logObjects()