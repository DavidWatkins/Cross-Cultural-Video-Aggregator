app.controller('highchartController', 
	function highchartController($scope, $q, loadService, parseService) {
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

		$scope.orderType = 1;
		$scope.noOrder = 1;
		$scope.XOrder = 2;
		$scope.YOrder = 3;
		$scope.bothOrder = 4;
		$scope.orders = [
			{ id: $scope.noOrder, name: 'No RCM' },
			{ id: $scope.XOrder, name: 'Tag RCM' },
			{ id: $scope.YOrder, name: 'Visual RCM' },
			{ id: $scope.bothOrder, name: 'Both RCM' }
		];

		$scope.US_COLOR = 'rgba(255, 0, 0,'; 
		$scope.EU_COLOR = 'rgba(0,0,255,'; 
		$scope.MIXED_COLOR = 'rgba(75,0,130,'; 
		$scope.GRAY_COLOR = 'rgba(128, 128, 128,';

		$scope.updateChart = function(name, fake_data, meme_index) {

			var EUSeries = {name:'EU Videos', color: $scope.EU_COLOR + ($scope.alpha).toString() + ')', data: []};
			var USSeries = {name:'US Videos', color: $scope.US_COLOR + ($scope.alpha).toString() + ')', data: []};
			var mixedSeries = {name:'Both Type Videos', color: $scope.MIXED_COLOR + ($scope.alpha).toString() + ')', data: []};
			var noTypeSeries = {name:'No Type Videos', color: $scope.GRAY_COLOR + ($scope.alpha).toString() + ')', data: []};

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
					showLastLabel: true,
					tickInterval: 1
				},
				yAxis: {
					title: {
						text: 'Tags?'
					},
					tickInterval: 1
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

		$scope.initGraph = function() {
			$scope.incomingData =  parseService.parseData($scope.matrix);
			if($scope.generateData)
				$scope.incomingData = parseService.calculate_data($scope.incomingData, $scope.numToCalculate, $scope.randomThreshold);

			//Generate histograms
			var histogramX = parseService.generateHistogramX($scope.incomingData);
			var histogramY = parseService.generateHistogramY($scope.incomingData);

			$scope.histogramX = parseService.getDictFrom(histogramX);
			$scope.histogramY = parseService.getDictFrom(histogramY);

			//Apply filters
			if($scope.filterType == $scope.histogramFilter)
				$scope.incomingData = parseService.filterData($scope.incomingData, $scope.histogramX, $scope.histogramY, $scope.threshold);
			else if($scope.filterType == $scope.diceFilter)
				$scope.incomingData = parseService.diceFilter($scope.incomingData, $scope.diceThreshold);

			//Block Diagonalize
			if($scope.orderType == $scope.XOrder) {
				$scope.incomingData = parseService.rcm($scope.incomingData, true, false);
			}
			else if($scope.orderType == $scope.YOrder) {
				$scope.incomingData = parseService.rcm($scope.incomingData, false, true);
			}
			else if($scope.orderType == $scope.bothOrder) {
				$scope.incomingData = parseService.rcm($scope.incomingData, true, true);
			}

			//Apply Block Diagonalization
			if($scope.blockDiagonalize)
				$scope.incomingData = parseService.rcm($scope.incomingData);

			$scope.memeIndex = parseService.parseMemeIndex($scope.visual_meme_index);
			$scope.meme_index = parseService.parsecluster($scope.memeIndex, $scope.cluster1);

			displayData();
		}

		function displayData() {
			$scope.updateChart("#container", $scope.incomingData, $scope.meme_index);
		}

		$scope.init = function() {
			loadService
				.getAllData($scope, "matrix", "visual_meme_index", "cluster1")
				.then($scope.initGraph);
		}
	}
); 