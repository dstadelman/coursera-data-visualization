//# dc.js Getting Started and How-To Guide
'use strict';

/* jshint globalstrict: true */
/* global dc,d3,crossfilter,colorbrewer */

var dateChart = dc.barChart('#date-chart');
var hourChart = dc.barChart('#hour-chart');
//var countChart = dc.pieChart('#count-chart');
var countChart = dc.rowChart('#count-chart');

d3.csv('twitter-name.json', function (data) {

    var formatDate = d3.time.format("%a %b %e %H:%M:%S %Z %Y");

    data.forEach(function (d) {
        d.dd = formatDate.parse(d.date);
        d.day = d3.time.day(d.dd); // pre-calculate day for better performance
        d.hour = d3.time.hour(d.dd); // pre-calculate day for better performance
        d.item = d.TWITTER_NAME;
    });

    var ndx = crossfilter(data);
    var all = ndx.groupAll();

    // date-chart
    var dimensionDay = ndx.dimension(function(d) { return d.day; });
    var groupDay = dimensionDay.group();

    // hour-chart
    var dimensionHour = ndx.dimension(function(d) { return d.dd.getHours() + d.dd.getMinutes() / 60; });
    var groupHour = dimensionHour.group(Math.floor);

    // dimension by year
    var dimensionItem = ndx.dimension(function (d) { return d.item; });
    var groupItem = dimensionItem.group();

    var groupItemTopK = {
      all: function() {
        var k = 25;
        return groupItem.top(k);
      }
    };

    var oneDay = 24*60*60*1000;

    var dayDataStart = new Date(formatDate.parse("Fri May 15 06:59:49 +0000 2015"));
    dayDataStart.setHours(0);
    dayDataStart.setMinutes(0);
    dayDataStart.setMilliseconds(0);

    var dayDataEnd = new Date(formatDate.parse("Fri May 22 14:29:45 +0000 2015"));
    dayDataEnd.setHours(23);
    dayDataEnd.setMinutes(59);
    dayDataEnd.setMilliseconds(999);

    var convertFrom24h = function(hour_, minutes_, short) {
      var hour = +hour_;
      var minutes = (minutes_ !== undefined) ? ':' + minutes_ : '';
      var suffix;
      if (hour > 12) {
        hour = hour - 12;
        suffix = (short) ? 'a' : 'am';
      } else {
        if (hour === 0)
          hour = 12;
        suffix = (short) ? 'p' : 'pm';
      }
      return hour + minutes + suffix;
    };

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
      return (v.getMonth() + 1) + '/' + v.getDate();
    });
    dateChart.yAxis().ticks(5);

    console.log(dateChart.colors());

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
          return convertFrom24h(filters[0][0]) + ' -> ' + convertFrom24h(filters[0][1]);
      });

    // Customize axis
    hourChart.xAxis().tickFormat(function (v) {
      return convertFrom24h(v, undefined, true);
    });
    hourChart.yAxis().ticks(5);

    countChart.width(960)
        .height(500)
        .margins({top: 20, left: 10, right: 10, bottom: 20})
        .group(groupItemTopK)
        .dimension(dimensionItem)
        // assign colors to each value in the x scale domain
        .ordinalColors(['#1f77b4'])
        .label(function (d) {
            return d.key;
        })
        // title sets the row text
        .title(function (d) {
            return d.value;
        })
        //.colors(colorbrewer.RdBu[9])
        .elasticX(true)
        .xAxis().ticks(4);

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
