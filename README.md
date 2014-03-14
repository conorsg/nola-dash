##NOLA Crime Stats Dashboard

Visualizations of data from [data.nola.gov](https://data.nola.gov/) made using [d3.js](http://d3js.org/)

See it at [s3.conorgaffney.com/what-dat](http://s3.conorgaffney.com/what-dat/)

###Notes

<<<<<<< HEAD
Build full dataset through paginated calls to get:
 * counts of crimes by type for each week for last 52 weeks for big heatmap

Drag to select cells gives some basic info on selection (time period selected, types of crimes and totals for time period)?
Sorting function on cells, by cluster of high values?
How to group dates once we get more days in the year?

####Other charts
 * Donut chart showing proportion of crimes by ZIP, click on segment to bring up polygon of ZIP on small map
 * Histograms showing cumulative count of specific crimes (homicide, rape, shooting) for this year AND this time last year
=======
The data are calls for service with the disposition of "report to follow." This means that NOPD dispatched a unit to invesitgate an incident and the officers dispatched filed a report about what they found. A report usually means there was an actual crime the officers were dispatched to, but of course can mean just about anything. However, that's about as close as we can get to verified crimes with these data. 

Socrata has a query-able API, however there are two annoying issues with the API and the data that forced me to make multiple calls and build big data arrays on the page, and thus make this code much messier. The first is that Socrata only returns a maximum of 1000 datapoints, causing you to have to page through the dataset. The second issue is that time (an important sorting criteria for these graphs) is returned as a string, rather than as a more sortable data object. So, you cannot send a request to Socrata with a meaningful date query. 

####Other charts
 * Donut chart showing proportion of crimes by ZIP, click on segment to bring up polygon of ZIP on small map
>>>>>>> dev

###Issues

 * Cannot sort by day using SoQL because of dumb timecreate format
 * Pulling all data by cycling through paginated data is resource intensive
 * Should heatmap be granular, like a grid, or continuous?

###To-do

 * Refactor js to move styles to CSS
 * Make more robust height scalar for bar graphs
 * Reformat heat grid dates from days to weeks
