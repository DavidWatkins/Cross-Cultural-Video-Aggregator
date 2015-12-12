app.controller('histogramController', function($scope, loadService, parseService) {        
	$scope.showHistogram = function(histogram, container, name, axis_name) {
		$(container).highcharts({
			chart: {
				type: 'column',
			},
			title: {
				text: name
			},
			series: [{
				name: axis_name,
				data: histogram
			}]
		});
	}

	$scope.loadHistograms = function() {
		var incomingData = parseService.parseData($scope.matrix);
		var histogramX = parseService.generateHistogramX(incomingData);
		var histogramY = parseService.generateHistogramY(incomingData);
		$scope.showHistogram(histogramX, "#histogramX", "Tag Histogram", "Tag ID");
		$scope.showHistogram(histogramY, "#histogramY", "Visual Meme Histogram", "Visual Meme ID");
	}

	$scope.init = function() {
		loadService
			.getAllData($scope, "matrix", "visual_meme_index", "cluster1")
			.then($scope.loadHistograms);
	}
}); 