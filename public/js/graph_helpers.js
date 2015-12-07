//Likelihood of data changing
var THRESHOLD = 0.001;
var US_VIDEO = 0, EU_VIDEO = 1, MIXED_VIDEO = 2;
var US_COLOR = 'rgba(255, 0, 0,', EU_COLOR = 'rgba(0,0,255,', MIXED_COLOR = 'rgba(75,0,130,', GRAY_COLOR = 'rgba(128, 128, 128,';

function calculate_data(fake_data, numToCalculate) {
	/* Display data, but also generate fake data that is based on a random noise applied to initial data */
	for(var i = 1; i < numToCalculate; i++) {
		if(fake_data[i] != null) {
			fake_data[i] = []
		}

		fake_data.push([]);

		for(var y = 0; y < fake_data[i-1].length; y++) {
			fake_data[i].push([]);
			for(var x = 0; x < fake_data[i-1][y].length; x++) {
				var r = Math.random();
				if(r < THRESHOLD)
					fake_data[i][y].push((fake_data[i-1][y][x] + 1) % 2);
				else
					fake_data[i][y].push(fake_data[i-1][y][x]);
			}
		} 
	}
}

function generateHistogramX(data) {

	var histogram = [];
	/* Display data, but also generate fake data that is based on a random noise applied to initial data */
	for(var y = 0; y < data[0].length; y++) {
		for(var x = 0; x < data[0][y].length; x++) {
			if(y == 0) histogram.push(0);
			if(!isNaN(data[0][y][x])) histogram[x] += parseInt(data[0][y][x]);
		}
	} 
	return histogram;
}

function generateHistogramY(data) {

	var histogram = [];
	/* Display data, but also generate fake data that is based on a random noise applied to initial data */
	for(var y = 0; y < data[0].length; y++) {
		histogram.push(0);
		for(var x = 0; x < data[0][y].length; x++) {
			if(!isNaN(data[0][y][x])) histogram[y] += parseInt(data[0][y][x]);
		}
	} 
	return histogram;
}

function getDictFrom(histogram) {
	var dict = {};

	for(var x = 0; x < histogram.length; x++) {
		dict[x] = histogram[x];
	}

	return dict;
}

function getMinValFrom(histogramDict, slice_length) {
	var items = Object.keys(histogramDict).map(function(key) {
	    return [key, histogramDict[key]];
	});
	items.sort(function(first, second) {
	    return first[1] - second[1];
	});
	var temp = items.slice(0, slice_length);
	var max = 0;
	for(var x = 0; x < temp.length; x++) {
		if(temp[x][1] > max) max = temp[x][1];
	}
	return max;
}

function getMaxValFrom(histogramDict, slice_length) {
	var items = Object.keys(histogramDict).map(function(key) {
	    return [key, histogramDict[key]];
	});
	items.sort(function(first, second) {
	    return second[1] - first[1];
	});
	var temp = items.slice(0, slice_length);
	var min = 10000; //TODO FIX THIS
	for(var x = 0; x < temp.length; x++) {
		if(temp[x][1] < min) min = temp[x][1];
	}
	return min;
}

function filterData(fake_data, histogramX, histogramY, slice_length) {
	var maxXVal  = getMaxValFrom(histogramX, slice_length);
	var minXVal  = getMinValFrom(histogramX, slice_length);
	var maxYVal  = getMaxValFrom(histogramY, slice_length);
	var minYVal	 = getMinValFrom(histogramY, slice_length);

	console.log(maxXVal);
	console.log(minXVal);
	console.log(maxYVal);
	console.log(minYVal);

	var newFakeData = [];

	for(var i = 0; i < fake_data.length; i++) {
		newFakeData.push([]);

		for(var y = 0; y < fake_data[i].length; y++) {
			newFakeData[i].push([]);
			for(var x = 0; x < fake_data[i][y].length; x++) {				
				if(histogramY[y] < maxYVal && histogramY[y] > minYVal &&
				   histogramX[x] < maxXVal && histogramX[x] > minXVal)
					newFakeData[i][y].push(fake_data[i][y][x]);
				else
					newFakeData[i][y].push(0);
			}
		}
	} 
	return newFakeData;
}

function parseData(matData) {
	var lines = matData.split('\n');
	var fake_data = [];

	fake_data.push([]);
	for(var y = 0; y < lines.length; y++) {
		var values = lines[y].split(",");
		fake_data[0].push([]);
		values = values.reverse();
		for(var x = 0; x < values.length; x++) {
			fake_data[0][y].push(parseInt(values[x]));
		}
	}

	return fake_data;
}

function showHistogram(histogram, container, name) {
	console.log(histogram);
	$(container).highcharts({
		chart: {
			type: 'column',
		},
		title: {
			text: name
		},
		series: [{
            name: '',
            data: histogram
        }]
	});
}

function parseMemeIndex(visual_meme_index) {

	var memeIndex = {};

	var lines = visual_meme_index.split('\n');
	var re = /Cluster([0-9]+):\s\s([0-9]+)/;
	for(var y = 0; y < lines.length; y++) {
		var values = lines[y].replace(re, "$1,$2").split(",");
		memeIndex[values[0]] = parseInt(values[1]) + 1;
	}

	return memeIndex;
}

function parsecluster(memeIndex, cluster1) {
	var meme_index = {};
	var cluster_re = /Cluster([0-9]+):/;
	var US_re = /([0-9]+)\(\.\.\/US_videos[.]*/;
	var EU_re = /([0-9]+)\(\.\.\/Europe_videos[.]*/;	

	var lines = cluster1.split('\n');

	var currentClusterNum = -1;
	var currentClusterType = -1;
	for(var y = 0; y < lines.length; y++) {
		var isUS = US_re.test(lines[y]);
		var isCluster = cluster_re.test(lines[y]);
		var isEU = EU_re.test(lines[y]);

		if(isCluster) {
			var value = lines[y].replace(cluster_re, "$1");
			if(currentClusterNum != -1)
				meme_index[memeIndex[currentClusterNum]] = currentClusterType;
			currentClusterNum = parseInt(value);
			currentClusterType = -1;
		}
		else if((isUS && currentClusterType == EU_VIDEO) || (isEU && currentClusterType == US_VIDEO))
			currentClusterType = MIXED_VIDEO;
		else if(isUS)
			currentClusterType = US_VIDEO;
		else if(isEU)
			currentClusterType = EU_VIDEO;
	}
	if(currentClusterNum != -1)
		meme_index[memeIndex[currentClusterNum]] = currentClusterType;

	return meme_index;
}

function updateChart(name, fake_data, meme_index, mySlider, alphaValue, numToShowValue) {
	//var value = mySlider.slider( "getValue" );

	var alpha = 0.1;
	//if(alphaValue.val() != null && alphaValue.val() != 0 && !isNaN(alphaValue.val())) {
	//	alpha = alphaValue.val();
	//}

	var value = 1;

	numToShow = 50;

	var EUSeries = {name:'EU Videos', color: EU_COLOR + (alpha).toString() + ')', data: []};
	var USSeries = {name:'US Videos', color: US_COLOR + (alpha).toString() + ')', data: []};
	var mixedSeries = {name:'Both Type Videos', color: MIXED_COLOR + (alpha).toString() + ')', data: []};
	var noTypeSeries = {name:'No Type Videos', color: GRAY_COLOR + (alpha).toString() + ')', data: []};

	var numToShow = 1;
	//if(numToShowValue.val() != null && numToShowValue.val() != 0) {
	//	numToShow = numToShowValue.val();
	//}


	for(var i = value; i < value + 1; i++) {
		for(var y = 0; y < fake_data[i].length; y++) {
			for(var x = 0; x < fake_data[i][y].length; x++) {
				if(fake_data[i][y][x] == 1) {
					if(meme_index[x] == US_VIDEO)
						USSeries.data.push([x,y]);
					else if(meme_index[x] == EU_VIDEO)
						EUSeries.data.push([x,y]);
					else if(meme_index[x] == MIXED_VIDEO)
						mixedSeries.data.push([x,y]);						
					else
						noTypeSeries.data.push([x,y]);
				}
			}
		}
	}

	var series = [USSeries, EUSeries, mixedSeries, noTypeSeries];
	console.log(series);

	$(name).highcharts({
		chart: {
			type: 'scatter',
			zoomType: 'xy'
		},
		title: {
			text: 'Coclustering'
		},
		subtitle: {
			text: 'Coclustering data provided by matlab'
		},
		xAxis: {
			title: {
				enabled: true,
				text: 'Memes?'
			},
			startOnTick: true,
			endOnTick: true,
			showLastLabel: true
		},
		yAxis: {
			title: {
				text: 'Tags?'
			}
		},
		legend: {
			layout: 'vertical',
			align: 'left',
			verticalAlign: 'top',
			x: 100,
			y: 70,
			floating: true,
			backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
			borderWidth: 1
		},
		plotOptions: {
			scatter: {
				marker: {
					radius: 4,
					states: {
						hover: {
							enabled: true,
							lineColor: 'rgb(100,100,100)'
						}
					}
				},
				states: {
					hover: {
						marker: {
							enabled: false
						}
					}
				},
				tooltip: {
					headerFormat: '<b>{series.name}</b><br>',
					pointFormat: 'Meme {point.x}, Tag {point.y}'
				}
			}
		},
		series: series
	});
}