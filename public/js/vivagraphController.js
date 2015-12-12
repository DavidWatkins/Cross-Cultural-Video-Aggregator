app.controller('vivaController',                  
	function vivaController($scope, $q, loadService, parseService) { 
		$scope.alpha = 0.1;
		$scope.count = 1;
		$scope.numToShow = 1;
		$scope.numToCalculate = 1;
		$scope.threshold = 60;
		$scope.randomThreshold = 0.0001;
		$scope.radius = 4;
		$scope.generateData = false;
		$scope.blockDiagonalize = false;
		$scope.diceThreshold = 0.4;

		$scope.filterType = 2;
		$scope.noFilter = 1;
		$scope.histogramFilter = 2;
		$scope.diceFilter = 3;
		$scope.filters = [
			{ id: $scope.noFilter, name: 'No Filter' },
			{ id: $scope.histogramFilter, name: 'Histogram Filter' },
			{ id: $scope.diceFilter, name: 'Dice Filter' }
		];

		$scope.VisualNodes = true;
		$scope.TagNodes = false;

		$scope.graphType = 1;
		$scope.visualNodeGraph = 1;
		$scope.tagNodeGraph = 2;
		$scope.bothNodeGraph = 3;

		$scope.graphs = [
			{ id: $scope.visualNodeGraph, name: 'Visual Nodes' },
			{ id: $scope.tagNodeGraph, name: 'Tag Nodes' },
			{ id: $scope.bothNodeGraph, name: 'Both Tags and Visual are Nodes' }
		];

		$scope.numToUse = 1;
		$scope.numToCluster = 1;

		$scope.currentSVG = null;

		function rgb(r,g,b) { return {r: r, g: g, b: b }; }

		function nodeColor(visual_meme_index, old_color) {
			if($scope.meme_index[visual_meme_index] == parseService.US_VIDEO)
				return rgb(old_color.r + 255, old_color.g, old_color.b);
			else if($scope.meme_index[visual_meme_index] == parseService.EU_VIDEO)
				return rgb(old_color.r, old_color.g, old_color.b + 255);
			else if($scope.meme_index[visual_meme_index] == parseService.MIXED_VIDEO)
				return rgb(old_color.r + 75, old_color.g, old_color.b + 130);						
			else
				return rgb(old_color.r + 128, old_color.g + 128, old_color.b + 128);
		}

		function averageColor(color, total) {
			return d3.rgb(color.r/total, color.g/total, color.b/total);
		}

		$scope.createGraph = function (data, histogramX, histogramY) {
			var g = {
				links: [],
				nodes: []
			};

			if($scope.graphType == $scope.bothNodeGraph) {
				var numVideos = $scope.incomingData[0].length;
				var numTags = $scope.incomingData[0][0].length;
				var allNodes = new Array(numTags + numVideos);
				var index = 0;

				for(var i = 0; i < 1; i++) {
					for(var y = 0; y < $scope.incomingData[i].length * $scope.numToUse; y += $scope.numToCluster) {

						var color = averageColor(nodeColor(y, rgb(0,0,0)), 1);
						allNodes[numTags + y] = {weight:1, name: 'video', radius: 1, color: color};
						g.nodes.push(allNodes[numTags + y]);

						for(var x = 0; x < $scope.incomingData[i][y].length * $scope.numToUse; x += $scope.numToCluster) {

							if(allNodes[x] === undefined){
								allNodes[x] = {weight:1, name: 'tag', radius: 1, color: d3.rgb(0,0,0)};
								g.nodes.push(allNodes[x]);
							}

							if($scope.incomingData[i][y][x] == 1) {
								var source = allNodes[x];
								var target = allNodes[numTags + y];
								g.links.push({source: source, target: target, value: 1, weight: 1, color: d3.rgb(0,0,0)});
							}	
						}
					}
				}

			} else if($scope.graphType == $scope.visualNodeGraph) {
				var allTags = new Array($scope.incomingData[0][0].length);
				var numVideos = $scope.incomingData[0].length;
				var allVideos = new Array(numVideos);

				var index = 0;

				for(var i = 0; i < 1; i++) {
					for(var y = 0; y < $scope.incomingData[i].length * $scope.numToUse; y += $scope.numToCluster) {
						for(var x = 0; x < $scope.incomingData[i][y].length * $scope.numToUse; x += $scope.numToCluster) {
							if(y == 0)
								allTags[x] = [];

							var internalLinks = 0;
							var internalLinkStrength = new Array($scope.numToCluster);
							var color = rgb(0,0,0);

							for(var y1 = y; y1 < y + $scope.numToCluster && y1 < $scope.incomingData[i].length; y1++) {
								internalLinkStrength[y1-y] = 0;
								for(var x1 = x; x1 < x + $scope.numToCluster && x1 < $scope.incomingData[i][y].length; x1++) {
									if($scope.incomingData[i][y1][x1] == 1) {
										color = nodeColor(x1, color);
										internalLinks++;
										internalLinkStrength[y1-y]++;
									}
								}
							}

							if(internalLinks > 0) {
								if(allVideos[y] === undefined){
									allVideos[y] = {weight:1, name: 'video', radius: internalLinks, color: averageColor(color, $scope.numToCluster)};
									g.nodes.push(allVideos[y]);
								}

								for(var k = 0; k < allTags[x].length; k++){
									var source = allVideos[y];
									var target = allVideos[allTags[x][k]];
									if(source == null || target == null)
										continue;
									g.links.push({source: source, target: target, value: histogramX[x]/histogramX.length, weight: 1, color: d3.rgb(0,0,0)});
								}

								index++;
								allTags[x].push(y);	
							}
						}
					}
				}
			} else if($scope.graphType == $scope.tagNodeGraph) {
				var allTags = new Array($scope.incomingData[0][0].length);
				var numVideos = $scope.incomingData[0].length;
				var allVideos = new Array(numVideos);

				var index = 0;

				for(var i = 0; i < 1; i++) {
					for(var y = 0; y < $scope.incomingData[i].length * $scope.numToUse; y += $scope.numToCluster) {
						for(var x = 0; x < $scope.incomingData[i][y].length * $scope.numToUse; x += $scope.numToCluster) {
							if(x == 0)
								allVideos[y] = [];

							var internalLinks = 0;
							var internalLinkStrength = new Array($scope.numToCluster);
							var color = rgb(0,0,0);

							for(var y1 = y; y1 < y + $scope.numToCluster && y1 < $scope.incomingData[i].length; y1++) {
								internalLinkStrength[y1-y] = 0;
								for(var x1 = x; x1 < x + $scope.numToCluster && x1 < $scope.incomingData[i][y].length; x1++) {
									if($scope.incomingData[i][y1][x1] == 1) {
										color = nodeColor(x1, color);
										internalLinks++;
										internalLinkStrength[x1-x]++;
									}
								}
							}

							if(internalLinks > 0) {
								if(allTags[x] === undefined){
									allTags[x] = {weight:1, name: 'tag', radius: internalLinks, color: d3.rgb(0,0,0)};
									g.nodes.push(allTags[x]);
								}

								for(var k = 0; k < allVideos[y].length; k++){
									var source = allTags[x];
									var target = allTags[allVideos[y][k]];
									if(source == null || target == null)
										continue;
									g.links.push({source: source, target: target, value: histogramY[y]/histogramY.length, weight: 1, color: averageColor(color, $scope.numToCluster)});
								}

								index++;
								allVideos[y].push(x);	
							}
						}
					}
				}
			}

			return g;
		}


		$scope.initD3 = function(G) {
			if($scope.currentSVG != null)
				$scope.currentSVG.remove();

			var par = document.getElementById('#vivaholder');
			var width =1200, height = 800;
			var svg = d3.select("#mynetwork").append("svg")
			.attr("width", width)
			.attr("height", height);
			$scope.currentSVG = svg;

			var force = d3.layout.force()
			.charge(-120)
			.linkDistance(30)
			.size([width, height])
			.nodes(G.nodes)
			.links(G.links)
			.start();

			var link = svg.selectAll(".link")
			.data(G.links)
			.enter().append("line")
			.style("stroke", function(d) {return d.color;})
			.attr("class", "link")
			.style("stroke-width", function(d) { return Math.sqrt(d.value); });

			var node = svg.selectAll(".node")
			.data(G.nodes)
			.enter().append("circle")
			.attr("class", "node")
			// .attr("r", 5)
			.attr("r", function(d) { return d.radius * 5; })
			.attr("fill", function(d) { return d.color; })
			.call(force.drag);

			node.append("title")
			.text(function(d) {
				return d.name;
			});

			force.on("tick", function() {
				link.attr("x1", function(d) {
					return d.source.x;
				})
				.attr("y1", function(d) {
					return d.source.y;
				})
				.attr("x2", function(d) {
					return d.target.x;
				})
				.attr("y2", function(d) {
					return d.target.y;
				});
				node.attr("cx", function(d) {
					return d.x;
				})
				.attr("cy", function(d) {
					return d.y;
				});
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

			//Apply Block Diagonalization
			if($scope.blockDiagonalize)
				$scope.incomingData = parseService.blockDiagonalize($scope.incomingData);

			$scope.memeIndex = parseService.parseMemeIndex($scope.visual_meme_index);
			$scope.meme_index = parseService.parsecluster($scope.memeIndex, $scope.cluster1);

			var g = $scope.createGraph($scope.incomingData, $scope.histogramX, $scope.histogramY, $scope.meme_index);
			$scope.initD3(g);
		}

		
		$scope.init = function() {
			loadService
			.getAllData($scope, "matrix", "visual_meme_index", "cluster1")
			.then($scope.initGraph);
		}
	}
); 