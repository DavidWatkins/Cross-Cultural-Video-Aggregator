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

				updateChart(fake_data, meme_index, mySlider, alphaValue, numToShowValue);
			});
		});
	});
});