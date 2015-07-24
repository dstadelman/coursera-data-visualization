//# dc.js Getting Started and How-To Guide
'use strict';

/* jshint globalstrict: true */
/* global dc,d3,crossfilter,colorbrewer */

var dateChart = dc.barChart('#date-chart');
var hourChart = dc.barChart('#hour-chart');

d3.csv('twitter-name.json', function (data) {

    var formatDate = d3.time.format("%a %b %e %H:%M:%S %Z %Y")

    data.forEach(function (d) {
        d.dd = formatDate.parse(d.date);
        d.day = d3.time.day(d.dd); // pre-calculate day for better performance
        d.hour = d3.time.hour(d.dd); // pre-calculate day for better performance
        d.TWITTER_NAME = d.TWITTER_NAME;
    });

    var ndx = crossfilter(data);
    var all = ndx.groupAll();

    // date-chart
    var dimensionDay = ndx.dimension(function(d) { return d.day; });
    var groupDay = dimensionDay.group();

    // hour-chart
    var dimensionHour = ndx.dimension(function(d) { return d.dd.getHours() + d.dd.getMinutes() / 60; });
    var groupHour = dimensionHour.group(Math.floor);

    /*
    // dimension by year
    var yearlyDimension = ndx.dimension(function (d) {
        return d3.time.year(d.dd).getFullYear();
    });
    // maintain running tallies by year as filters are applied or removed
    var yearlyPerformanceGroup = yearlyDimension.group().reduce(
        // callback for when data is added to the current filter results
        function (p, v) {
            ++p.count;
            p.absGain += v.close - v.open;
            p.fluctuation += Math.abs(v.close - v.open);
            p.sumIndex += (v.open + v.close) / 2;
            p.avgIndex = p.sumIndex / p.count;
            p.percentageGain = (p.absGain / p.avgIndex) * 100;
            p.fluctuationPercentage = (p.fluctuation / p.avgIndex) * 100;
            return p;
        },
        // callback for when data is removed from the current filter results
        function (p, v) {
            --p.count;
            p.absGain -= v.close - v.open;
            p.fluctuation -= Math.abs(v.close - v.open);
            p.sumIndex -= (v.open + v.close) / 2;
            p.avgIndex = p.sumIndex / p.count;
            p.percentageGain = (p.absGain / p.avgIndex) * 100;
            p.fluctuationPercentage = (p.fluctuation / p.avgIndex) * 100;
            return p;
        },
        // initialize p
        function () {
            return {
                count: 0,
                absGain: 0,
                fluctuation: 0,
                fluctuationPercentage: 0,
                sumIndex: 0,
                avgIndex: 0,
                percentageGain: 0
            };
        }
    );

    var yearlyPerformanceGroupFiltered = {
      top: function (k) {
          return yearlyPerformanceGroup.top(k).filter(function(d) { return d.value.absGain > 0; });
      }
    };
    */

    var oneDay = 24*60*60*1000;

    var dayDataStart = new Date(formatDate.parse("Fri May 15 06:59:49 +0000 2015"));
    dayDataStart.setHours(0);
    dayDataStart.setMinutes(0);
    dayDataStart.setMilliseconds(0);

    var dayDataEnd = new Date(formatDate.parse("Fri May 22 14:29:45 +0000 2015"));
    dayDataEnd.setHours(23);
    dayDataEnd.setMinutes(59);
    dayDataEnd.setMilliseconds(999);

    dateChart.width(420)
      .height(180)
      .margins({top: 10, right: 50, bottom: 30, left: 40})
      .dimension(dimensionDay)
      .group(groupDay)
      .elasticY(true)
      // (optional) whether bar should be center to its x value. Not needed for ordinal chart, :default=false
      //.centerBar(true)
      // (optional) set gap between bars manually in px, :default=2
      .gap(5)
      // (optional) set filter brush rounding
      .round(d3.time.day.round)
      .xUnits(d3.time.days)
      .alwaysUseRounding(true)
      .x(d3.time.scale().domain([new Date(dayDataStart.getTime() - oneDay), new Date(dayDataEnd.getTime() + oneDay)]))
      .renderHorizontalGridLines(true);

    // Customize axis
    dateChart.xAxis().tickFormat(function (v) {
      return v.getDate();
    });
    dateChart.yAxis().ticks(5);

    hourChart.width(420)
      .height(180)
      .margins({top: 10, right: 50, bottom: 30, left: 40})
      .dimension(dimensionHour)
      .group(groupHour)
      .elasticY(true)
      // (optional) whether bar should be center to its x value. Not needed for ordinal chart, :default=false
      //.centerBar(true)
      // (optional) set gap between bars manually in px, :default=2
      .gap(5)
      // (optional) set filter brush rounding
      .round(dc.round.floor)
      .alwaysUseRounding(true)
      .x(d3.scale.linear().domain([0, 24]))
      .renderHorizontalGridLines(true)
      .filterPrinter(function (filters) {
          var filters = filters[0];
          var labels = [];
          for (var i = 0; i < filters.length; i++) {
            if (filters[i] > 12)
              labels[i] = filters[i] - 12 + ':00pm';
            else {
              labels[i] = filters[i];
              if (filters[i] == 0)
                labels[i] = 12;
              labels[i] = labels[i] + ':00am';
            }
          }
          return labels[0] + ' -> ' + labels[1];
      });

    // Customize axis
    hourChart.xAxis().tickFormat(function (v) {
      return v;
    });
    hourChart.yAxis().ticks(5);

    dc.dataCount('.dc-data-count')
        .dimension(ndx)
        .group(all)
        // (optional) html, for setting different html for some records and all records.
        // .html replaces everything in the anchor with the html given using the following function.
        // %filter-count and %total-count are replaced with the values obtained.
        .html({
            some:'<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
                ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'\'>Reset All</a>',
            all:'All records selected. Please click on the graph to apply filters.'
        });

    //#### Rendering
    //simply call renderAll() to render all charts on the page
    dc.renderAll();

});

//#### Version
//Determine the current version of dc with `dc.version`
d3.selectAll('#version').text(dc.version);
