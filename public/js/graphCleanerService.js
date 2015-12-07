app.factory("parseService", function() {
	var US_VIDEO = 0, EU_VIDEO = 1, MIXED_VIDEO = 2;
	var service = {};
  //Likelihood of data changing

	service.US_VIDEO = 0;
	service.EU_VIDEO = 1;
	service.MIXED_VIDEO = 2;

	service.US_COLOR = 'rgba(255, 0, 0,'; 
	service.EU_COLOR = 'rgba(0,0,255,'; 
	service.MIXED_COLOR = 'rgba(75,0,130,'; 
	service.GRAY_COLOR = 'rgba(128, 128, 128,';

	service.calculate_data = function(incoming_data, numToCalculate, threshold) {

		var new_data = [];
		/* Display data, but also generate fake data that is based on a random noise applied to initial data */
		for(var i = 1; i < numToCalculate; i++) {
			if(new_data[i] != null) {
				new_data[i] = []
			}

			new_data.push([]);

			for(var y = 0; y < incoming_data.length; y++) {
				new_data[i].push([]);
				for(var x = 0; x < incoming_data[y].length; x++) {
					var r = Math.random();
					if(r < threshold)
						new_data[i][y].push((incoming_data[y][x] + 1) % 2);
					else
						new_data[i][y].push(incoming_data[y][x]);
				}
			} 
		}

		return new_data;
	};

	service.generateHistogramX = function(data) {

		var histogram = [];
		/* Display data, but also generate fake data that is based on a random noise applied to initial data */
		for(var y = 0; y < data[0].length; y++) {
			for(var x = 0; x < data[0][y].length; x++) {
				if(y == 0) histogram.push(0);
				if(!isNaN(data[0][y][x])) histogram[x] += parseInt(data[0][y][x]);
			}
		} 
		return histogram;
	};

	service.generateHistogramY = function(data) {

		var histogram = [];
		/* Display data, but also generate fake data that is based on a random noise applied to initial data */
		for(var y = 0; y < data[0].length; y++) {
			histogram.push(0);
			for(var x = 0; x < data[0][y].length; x++) {
				if(!isNaN(data[0][y][x])) histogram[y] += parseInt(data[0][y][x]);
			}
		} 
		return histogram;
	};

	service.getDictFrom = function(histogram) {
		var dict = {};

		for(var x = 0; x < histogram.length; x++) {
			dict[x] = histogram[x];
		}

		return dict;
	};

	service.getMinValFrom = function(histogramDict, slice_length) {
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
	};

	service.getMaxValFrom = function(histogramDict, slice_length) {
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
	};

	service.filterData = function(fake_data, histogramX, histogramY, slice_length) {
		var maxXVal  = service.getMaxValFrom(histogramX, slice_length);
		var minXVal  = service.getMinValFrom(histogramX, slice_length);
		var maxYVal  = service.getMaxValFrom(histogramY, slice_length);
		var minYVal	 = service.getMinValFrom(histogramY, slice_length);

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
	};

	service.parseData = function(matData) {
		var lines = matData.split('\n');
		var incoming_data = [];

		incoming_data.push([]);
		for(var y = 0; y < lines.length; y++) {
			var values = lines[y].split(",");
			incoming_data[0].push([]);
			values = values.reverse();
			for(var x = 0; x < values.length; x++) {
				incoming_data[0][y].push(parseInt(values[x]));
			}
		}

		return incoming_data;
	};


	service.parseMemeIndex = function(visual_meme_index) {

		var memeIndex = {};

		var lines = visual_meme_index.split('\n');
		var re = /Cluster([0-9]+):\s\s([0-9]+)/;
		for(var y = 0; y < lines.length; y++) {
			var values = lines[y].replace(re, "$1,$2").split(",");
			memeIndex[values[0]] = parseInt(values[1]) + 1;
		}

		return memeIndex;
	};

	service.parsecluster = function(memeIndex, cluster1) {
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
	};

	service.dice_coefficient = function(col1, col2) {
		function dot(v1, v2) {
			var dot_product = 0;
	        for(var i = 0; i < v1.length && i < v2.length; i++) {
	        	dot_product += v1[i] * v2[i];
	        }
	        return dot_product;
		}

        //base case
        if(col1.length == 0 || col2.length == 0)
        {
            return 0;
        }       

        var num = 2 * dot(col1, col2);
        var den = dot(col1, col1) + dot(col2, col2);
        var ret_val = num/den;

        if(den = 0) return 1;
        return ret_val;
	}

	service.Xdice_coefficient = function(mat, x_val, x_val2) {
		function dot(mat, v1, v2) {
			var dot_product = 0;
	        for(var i = 0; i < mat.length; i++) {
	        	var x = 0;
	        	var x2 = 0;
	        	if(!isNaN(mat[i][v1])) x = mat[i][v1];
	        	if(!isNaN(mat[i][v2])) x2 = mat[i][v2];
	        	dot_product += x * x2;
	        }
	        return dot_product;
		}

        //base case
        if(mat.length == 0)
        {
            return 0;
        }       

        var num = 2 * dot(mat, x_val, x_val2);
        var den = dot(mat, x_val, x_val) + dot(mat, x_val2, x_val2);
        var ret_val = num/den;

        console.log(num);
        console.log(den);

        if(den = 0) return 1;
        return ret_val;
	}

	service.diceFilter = function(data, diceThreshold) {
		var newFakeData = [];

		function zero(length) {
			var a = new Array(length);
			for(var i = 0; i < a.length; i++) {
				a[i] = 0;
			}
			return a;
		}

		for(var i = 0; i < data.length; i++) {
			newFakeData.push([]);
			var temp = [];

			for(var y = 0; y < data[i].length - 1; y++) {
				var dice = service.dice_coefficient(data[i][y], data[i][y+1])
				if(dice < diceThreshold)
					temp.push(y);
			}

			var temp2 = [];
			for(var x = 0; x < data[i][0].length - 1; x++) {				
				var dice = service.Xdice_coefficient(data[i], x, x + 1)
				if(dice < diceThreshold)
					temp2.push(x);
			}

			newFakeData[i] = new Array(temp.length);
			for(var y = 0; y < temp.length; y++) {
				newFakeData[i][y] = new Array(temp2.length);
				for(var x = 0; x < temp2.length; x++) {
					newFakeData[i][y][x] = data[i][temp[y]][temp2[x]];
				}
			}
		} 
		return newFakeData;
	}

	service.cuthillMckee = function(data) {

		//http://codereview.stackexchange.com/questions/19088/implementing-the-cuthill-mckee-algorithm
		function zero(array) {
			for(var i = 0; i < array.length; i++) {
				array[i] = 0;
			}
		}

		function node_degrees(ind, ptr, num_rows) {
			var ii, jj;
			var degree = new Array(num_rows);
			zero(degree);
			for(ii = 0; ii < num_rows; ii++) {
				degree[ii] = ptr[ii + 1] - ptr[ii];
				for(jj = ptr[ii]; jj < ptr[ii+1]; jj++) {
					if(ind[jj] == ii) {
						//Add one if the diagnonal is in row ii
						degree[ii] += 1;
						break;
					}
				}
			}
			return degree;
		}

		function reverse_cuthill_mckee(ind, ptr, num_rows) {
			var N = 0, N_old, seed, level_start, level_end;
			var zz, i, j, ii, jj, kk, ll, level_len, temp, temp2;

			var order = new Array(num_rows);
			zero(order);
			var degree = node_degrees(ind, ptr, num_rows);
			var inds
		}

		return data;
	}

	return service;
});