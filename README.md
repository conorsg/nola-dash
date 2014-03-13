##NOLA Crime Stats Dashboard

Visualizations of data from [data.nola.gov](https://data.nola.gov/) made using [d3.js](http://d3js.org/)

See it at [s3.conorgaffney.com/what-dat](http://s3.conorgaffney.com/what-dat/)

###Notes

Build full dataset through paginated calls to get:
 * counts of crimes by type for each week for last 52 weeks for big heatmap

Drag to select cells gives some basic info on selection (time period selected, types of crimes and totals for time period)?
Sorting function on cells, by cluster of high values?
How to group dates once we get more days in the year?

####Other charts
 * Donut chart showing proportion of crimes by ZIP, click on segment to bring up polygon of ZIP on small map

###Issues

 * Cannot sort by day using SoQL because of dumb timecreate format
 * Pulling all data by cycling through paginated data is resource intensive
 * Should heatmap be granular, like a grid, or continuous?