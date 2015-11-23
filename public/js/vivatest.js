$(function () {

	var nodeSize = 24;
	var numToCalculate = 20;

	function initGraph() {
		return Viva.Graph.graph();
	}

	function initGraphics(graph) {
		return Viva.Graph.View.svgGraphics();
	}

	function initRenderer(graph, graphics) {
		var layout = Viva.Graph.Layout.forceDirected(graph, {
			springLength : 100,
			springCoeff : 0.0008,
			dragCoeff : 0.02,
			gravity : -20
		});

		return Viva.Graph.View.renderer(graph, {
			layout 	  : layout,
			graphics  : graphics,
			container : document.getElementById('graphContainer')
		});
	}

	function createMarker(id) {
		return Viva.Graph.svg('marker')
		.attr('id', id)
		.attr('viewBox', "0 0 10 10")
		.attr('refX', "10")
		.attr('refY', "5")
		.attr('markerUnits', "strokeWidth")
		.attr('markerWidth', "10")
		.attr('markerHeight', "5")
		.attr('orient', "auto");
	}

	function addNodes(graph, fake_data, histogramX, histogramY) {

		var numToCluster = 1;
		var numToUse = 1;

		var XLength = histogramX.length;
		var YLength = histogramY.length;

		var allTags = new Array(fake_data[0][0].length);
		var numVideos = fake_data[0].length;
		var allVideos = new Array(numVideos);			

		for(var i = 0; i < 1; i++) {
			for(var y = 0; y < fake_data[i].length * numToUse; y += numToCluster) {
				for(var x = 0; x < fake_data[i][y].length * numToUse; x += numToCluster) {
					if(y == 0)
						allTags[x] = [];

					loop1: for(var y1 = y; y1 < y + numToCluster && y1 < fake_data[i].length; y1++) {
						for(var x1 = x; x1 < x + numToCluster && x1 < fake_data[i][y].length; x1++) {
							if(fake_data[i][y1][x1] == 1) {
								if(allVideos[y] === undefined){
									allVideos[y] = true;
									graph.addNode('video' + parseInt(y));
								}

								for(var k = 0; k < allTags[x].length; k++)
									graph.addLink('video' + parseInt(y), allTags[x][k], {id : 0, connectionStrength: (histogramX[x]+histogramY[y])/(XLength + YLength)});
								allTags[x].push('video' + parseInt(y));	
								break loop1; 
							}
						}
					}

					// if(fake_data[i][y][x] == 1) {
					// 	for(var k = 0; k < allTags[x].length; k++)
					// 		graph.addLink('video' + parseInt(y), allTags[x][k], {id : 0});
					// 	allTags[x].push('video' + parseInt(y));						
					// }
				}
			}
		}
	}

	function main(graph, graphics, nodeSize, renderer, fake_data, histogramX, histogramY) {
		graphics.node(function(node) {
			return Viva.Graph.svg('image')
			.attr('width', nodeSize)
			.attr('height', nodeSize)
			.link('https://secure.gravatar.com/avatar/' + node.data);
		}).placeNode(function(nodeUI, pos) {
			nodeUI.attr('x', pos.x - nodeSize / 2).attr('y', pos.y - nodeSize / 2);
		});

		var	marker = createMarker('Triangle');
		marker.append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z');

		var defs = graphics.getSvgRoot().append('defs');
		defs.append(marker);

		var geom = Viva.Graph.geom();

		graphics.link(function(link){
			var label = Viva.Graph.svg('text').attr('id','label_'+link.data.id).text(link.data.id);
			graphics.getSvgRoot().childNodes[0].append(label);

			return Viva.Graph.svg('path')
			.attr('stroke', 'gray')
			.attr('marker-end', 'url(#Triangle)')
			.attr('id', link.data.id);
		}).placeLink(function(linkUI, fromPos, toPos) {
			var toNodeSize = nodeSize,
			fromNodeSize = nodeSize;

			var from = geom.intersectRect(
			fromPos.x - fromNodeSize / 2, // left
			fromPos.y - fromNodeSize / 2, // top
			fromPos.x + fromNodeSize / 2, // right
			fromPos.y + fromNodeSize / 2, // bottom
			fromPos.x, fromPos.y, toPos.x, toPos.y)
			|| fromPos;

			var to = geom.intersectRect(
			toPos.x - toNodeSize / 2, // left
			toPos.y - toNodeSize / 2, // top
			toPos.x + toNodeSize / 2, // right
			toPos.y + toNodeSize / 2, // bottom
			// segment:
			toPos.x, toPos.y, fromPos.x, fromPos.y)
			|| toPos;

			var data = 'M' + from.x + ',' + from.y +
			'L' + to.x + ',' + to.y;

			linkUI.attr("d", data);

			document.getElementById('label_'+linkUI.attr('id'))
			.attr("x", (from.x + to.x) / 2)
			.attr("y", (from.y + to.y) / 2);
		});

		// Finally we add something to the graph:
		addNodes(graph, fake_data, histogramX, histogramY);
		renderer.run();
	}

	jQuery.get('data/A.txt', function(matData) {
		jQuery.get('data/visual_meme_index', function(visual_meme_index) {
			jQuery.get('data/Cluster1.txt', function(cluster1) {

				//Array of 2D arrays holding data
				var fake_data = [];
				var meme_index = {};

				fake_data = parseData(matData);
				calculate_data(fake_data, numToCalculate);

				var histogramX = generateHistogramX(fake_data);
				var histogramY = generateHistogramY(fake_data);
				histogramX = getDictFrom(histogramX);
				histogramY = getDictFrom(histogramY);
				var newfake_data = filterData(fake_data, histogramX, histogramY, 60);

				var memeIndex = parseMemeIndex(visual_meme_index);
				meme_index = parsecluster(memeIndex, cluster1);

				var graph = initGraph();
				var graphics = initGraphics(graph);
				var renderer = initRenderer(graph, graphics);

				$("#pauseButton").click(function() {
					renderer.pause();
				});
				$("#resumeButton").click(function() {
					renderer.resume();
				});
				main(graph, graphics, nodeSize, renderer, newfake_data, histogramX, histogramY);

			});
		});
	});
});
