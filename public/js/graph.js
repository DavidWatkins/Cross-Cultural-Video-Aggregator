$(function () {

	jQuery.get('data/A.txt', function(matData) {
		jQuery.get('data/visual_meme_index', function(visual_meme_index) {
			jQuery.get('data/Cluster1.txt', function(cluster1) {

				//Value of slider on the screen
				var mySlider = $("input.slider").slider();
				var alphaValue = $("#alpha");
				var numToShowValue = $("#numToShow");

				//Array of 2D arrays holding data
				var fake_data = [];
				var meme_index = {};

				fake_data = parseData(matData);
				calculate_data(fake_data, 50);

				var memeIndex = parseMemeIndex(visual_meme_index);
				meme_index = parsecluster(memeIndex, cluster1);

				mySlider.on('slideStop', function(ev){
					updateChart(fake_data, meme_index);
				});

				//On change from slider, update the chart
				//Generate lots of fake data
				//Slider should dictate how much data is shown
				//

				var histogramX = generateHistogramX(fake_data);
				var histogramY = generateHistogramY(fake_data);
				showHistogram(histogramX, "#histogramX", "Tag Histogram");
				showHistogram(histogramY, "#histogramY", "Visual Meme Histogram");

				histogramX = getDictFrom(histogramX);
				histogramY = getDictFrom(histogramY);
				var newfake_data = filterData(fake_data, histogramX, histogramY, 10);
				updateChart("#real", fake_data, meme_index, mySlider, alphaValue, numToShowValue);
				updateChart("#container", newfake_data, meme_index, mySlider, alphaValue, numToShowValue);
			});
		});
	});
});