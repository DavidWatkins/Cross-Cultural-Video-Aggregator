app.controller('highchartController', 
	function highchartController($scope, $q, loadData, parseService) {
		$scope.alpha = 0.1;
		$scope.count = 1;
		$scope.numToShow = 1;
		$scope.numToCalculate = 1;
		$scope.threshold = 60;
		$scope.randomThreshold = 0.0001;
		$scope.radius = 4;
		$scope.filterWithHistogram = true;
		$scope.generateData = false;
		$scope.blockDiagonalize = false;
		$scope.diceThreshold = 0.4;

		$scope.filterType = 1;
		$scope.noFilter = 1;
		$scope.histogramFilter = 2;
		$scope.diceFilter = 3;
		$scope.filters = [
			{ id: $scope.noFilter, name: 'No Filter' },
			{ id: $scope.histogramFilter, name: 'Histogram Filter' },
			{ id: $scope.diceFilter, name: 'Dice Filter' }
		];

		$scope.dataFilteredWithHistogram = [];
		$scope.meme_index = [];

		$scope.updateChart = function(name, fake_data, meme_index) {

			var EUSeries = {name:'EU Videos', color: parseService.EU_COLOR + ($scope.alpha).toString() + ')', data: []};
			var USSeries = {name:'US Videos', color: parseService.US_COLOR + ($scope.alpha).toString() + ')', data: []};
			var mixedSeries = {name:'Both Type Videos', color: parseService.MIXED_COLOR + ($scope.alpha).toString() + ')', data: []};
			var noTypeSeries = {name:'No Type Videos', color: parseService.GRAY_COLOR + ($scope.alpha).toString() + ')', data: []};

			for(var i = 0; i < $scope.numToCalculate; i++) {
				for(var y = 0; y < fake_data[i].length; y++) {
					for(var x = 0; x < fake_data[i][y].length; x++) {
						if(fake_data[i][y][x] == 1) {
							if(meme_index[x] == parseService.US_VIDEO)
								USSeries.data.push([x,y]);
							else if(meme_index[x] == parseService.EU_VIDEO)
								EUSeries.data.push([x,y]);
							else if(meme_index[x] == parseService.MIXED_VIDEO)
								mixedSeries.data.push([x,y]);						
							else
								noTypeSeries.data.push([x,y]);
						}
					}
				}
			}

			var series = [USSeries, EUSeries, mixedSeries, noTypeSeries];
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
							radius: $scope.radius,
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

		function getDataFromService(next) {
			    var q1 = $q.defer(),
				    q2 = $q.defer(),
				    q3 = $q.defer(),
				    p1 = q1.promise, 
				    p2 = q2.promise,	
				    p3 = q3.promise;

			loadData.getMatrix($scope, "matrix", q1);
			loadData.getVisualMemeIndex($scope, "visual_meme_index", q2);
			loadData.getCluster1($scope, "cluster1", q3);

			var promises = [
				p1, p2, p3
			];

			$q.all(promises).then(next);
		}

		function generateHistograms() {
			var histogramX = parseService.generateHistogramX($scope.incomingData);
			var histogramY = parseService.generateHistogramY($scope.incomingData);

			$scope.histogramX = parseService.getDictFrom(histogramX);
			$scope.histogramY = parseService.getDictFrom(histogramY);
		}

		$scope.initGraph = function() {
			$scope.incomingData =  parseService.parseData($scope.matrix);
			if($scope.generateData)
				$scope.incomingData = parseService.calculate_data($scope.incomingData, $scope.numToCalculate, $scope.randomThreshold);

			generateHistograms();

			//Apply filters
			if($scope.filterType == $scope.histogramFilter)
				$scope.incomingData = parseService.filterData($scope.incomingData, $scope.histogramX, $scope.histogramY, $scope.threshold);
			else if($scope.filterType == $scope.diceFilter)
				$scope.incomingData = parseService.diceFilter($scope.incomingData, $scope.diceThreshold);

			//Apply Block Diagonalization
			if($scope.blockDiagonalize)
				$scope.incomingData = parseService.blockDiagonalize($scope.incomingData);

			$scope.memeIndex = parseService.parseMemeIndex($scope.visual_meme_index);
			$scope.meme_index = parseService.parsecluster($scope.memeIndex, $scope.cluster1);

			displayData();
		}

		function displayData() {
			$scope.updateChart("#container", $scope.incomingData, $scope.meme_index);
		}

		$scope.init = function() {
			getDataFromService($scope.initGraph);
		}
	}
); 