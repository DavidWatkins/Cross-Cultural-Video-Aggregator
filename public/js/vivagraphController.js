app.controller('vivaController',                  
	function vivaController($scope, $q, loadData, parseService) { 

		$scope.numToCalculate = 1;
		$scope.threshold = 60;
		$scope.randomThreshold = 0.001;

		$scope.VisualNodes = true;
		$scope.TagNodes = false;

		function createNodes(data) {
			return [{
					name: "Node 1"
				}, {
					name: "Node 2"
				}, {
					name: "Node 3"
				}, {
					name: "Node 4"
				}, {
					name: "Node 5"
				}];
		}

		function createLinks(data) {
			return [{
					source: 0,
					target: 1
				}, {
					source: 0,
					target: 2
				}, {
					source: 1,
					target: 3
				}, {
					source: 1,
					target: 4
				}];
		}

		function initGraph(initD3) {
			$q.all([
			    loadData.getMatrix($scope, "matrix"),
			    loadData.getVisualMemeIndex($scope, "visual_meme_index"),
			    loadData.getCluster1($scope, "cluster1")
			  ]).then(function() {
			  	console.log($scope.matrix);

				var fake_data = parseService.parseData($scope.matrix);
				parseService.calculate_data(fake_data, numToCalculate, $scope.randomThreshold);

				var histogramX = parseService.generateHistogramX(fake_data);
				var histogramY = parseService.generateHistogramY(fake_data);
				histogramX = parseService.getDictFrom(histogramX);
				histogramY = parseService.getDictFrom(histogramY);
				var newfake_data = parseService.filterData(fake_data, histogramX, histogramY, $scope.threshold);

				var memeIndex = parseService.parseMemeIndex(visual_meme_index);
				var meme_index = parseService.parsecluster(memeIndex, cluster1);
				var g = {
					nodes: createNodes(newfake_data),
					links: createLinks(newfake_data)
				}
				initD3(g);
			  });
		}

		function initD3(G) {
			var par = document.getElementById('#vivaholder');
			var width =800, height = 800;
			var svg = d3.select("#mynetwork").append("svg")
				.attr("width", width)
				.attr("height", height);

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
				.style("stroke", function(d) {return "#"+"000";})
				.attr("class", "link");

			var node = svg.selectAll(".node")
				.data(G.nodes)
				.enter().append("circle")
				.attr("class", "node")
				.attr("r", 5)
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

		$scope.init = function() {
			initGraph(initD3);
		}
}); 