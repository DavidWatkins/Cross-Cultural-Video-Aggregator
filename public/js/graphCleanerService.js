app.factory("parseService", function() {
	var US_VIDEO = 0, EU_VIDEO = 1, MIXED_VIDEO = 2;
	var service = {};
  	//Likelihood of data changing

	service.US_VIDEO = 0;
	service.EU_VIDEO = 1;
	service.MIXED_VIDEO = 2;

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

	service.rcm = function(data, orderX, orderY) {

		Array.prototype.argSort = function() {
			var indexes = new Array(this.length);
			var self = this;
	        for (var i = 0; i < indexes.length; i++) {
	            indexes[i] = i;
	        }

	        indexes = indexes.sort(function(x, y) {
	        	if(self[x] > self[y]) {
	        		return 1;
	        	} else if (self[x] < self[y]) {
	        		return -1;
	        	} else {
	        		return 0;
	        	}
	        });

	        return indexes;
		};

		Array.prototype.max = function() {
		  return Math.max.apply(null, this);
		};

		Array.prototype.min = function() {
		  return Math.min.apply(null, this);
		};

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

		function transpose(arr) {
			var nArr = new Array(arr.length);
		  for (var i = 0; i < arr.length; i++) {
		  	nArr[i] = new Array(arr[i].length);
		    for (var j = 0; j < arr[i].length; j++) {
		      //swap element[i,j] and element[j,i]
		      nArr[i][j] = arr[j][i];
		    }
		  }

		  return nArr;
		}

		function multiply(a, b) {
		  var aNumRows = a.length, aNumCols = a[0].length,
		      bNumRows = b.length, bNumCols = b[0].length,
		      m = new Array(aNumRows);  // initialize array of rows

		  for (var r = 0; r < aNumRows; ++r) {
		    m[r] = new Array(bNumCols); // initialize the current row
		    for (var c = 0; c < bNumCols; ++c) {
		      m[r][c] = 0;             // initialize the current cell
		      for (var i = 0; i < aNumCols; ++i) {
		        m[r][c] += a[r][i] * b[i][c];
		      }
		    }
		  }
		  return m;
		}

		function returnYOrdered(order, mat) {
			var newMat = new Array(mat.length);
			for(var i = 0; i < mat.length; i++) {
				newMat[i] = mat[order[i]];
			}
			return newMat;
		}

		function returnXOrdered(order, mat) {
			var newMat = new Array(mat.length);
			for(var y = 0; y < mat.length; y++) {
				newMat[y] = new Array(mat[y].length);
				for(var x = 0; x < mat[y].length; x++) {
					newMat[y][x] = mat[y][order[x]];
				}
			}
			return newMat;
		}

		function display(m) {
		  for (var r = 0; r < m.length; ++r) {
		    document.write('&nbsp;&nbsp;'+m[r].join(' ')+'<br />');
		  }
		}

		function convertToCSR(mat) {
			var indices = [];
			var indptr = [0];
			var index = 0;
			for(var y = 0; y < mat.length; y++) {
				for(var x = 0; x < mat[y].length; x++) {
					if(mat[y][x] == 1) {
						indices.push(x);
						index++;
					}
				}
				indptr.push(index);
			}

			return {indices: indices, indptr: indptr};
		}

		// function CSRtoMat(ind, ptr) {
		// 	for(var i = 0; i < )
		// }

		function rcm(ind, ptr, num_rows) {
			var N = 0, N_old, seed, level_start, level_end;
			var zz, i, j, ii, jj, kk, ll, level_len, temp, temp2;

			var order = new Array(num_rows);
			zero(order);
			var degree = node_degrees(ind, ptr, num_rows);
			var inds = degree.argSort();
			var rev_inds = inds.argSort();
			var temp_degrees = new Array(degree.max());
			zero(temp_degrees);

			for(zz = 0; zz < num_rows; zz++) {
				if(inds[zz] != -1) { //Do BFS with seed=inds[zz]
					seed = inds[zz];
					order[N] = seed;
					N += 1;
					inds[rev_inds[seed]] = -1;
					level_start = N - 1;
					level_end = N;

					while(level_start < level_end) {
						for(ii = level_start; ii < level_end; ii++) {
		                    i = order[ii];
		                    N_old = N;

		                    // add unvisited neighbors
		                    for(jj=ptr[i]; jj < ptr[i+1]; jj++) {
		                        // j is node number connected to i
		                        j = ind[jj];
		                        if(inds[rev_inds[j]] != -1) {
		                            inds[rev_inds[j]] = -1;
		                            order[N] = j;
		                            N += 1;
		                        }
		                    }

		                    // Add values to temp_degrees array for insertion sort
		                    level_len = 0;
		                    for(kk = N_old; kk < N; kk++) {
		                        temp_degrees[level_len] = degree[order[kk]];
		                        level_len += 1;
		                    }

		                    // Do insertion sort for nodes from lowest to highest degree
		                    for(kk = 1; kk < level_len; kk++) {
		                        temp = temp_degrees[kk];
		                        temp2 = order[N_old+kk];
		                        ll = kk;
		                        while((ll > 0) && (temp < temp_degrees[ll-1])) {
		                            temp_degrees[ll] = temp_degrees[ll-1];
		                            order[N_old+ll] = order[N_old+ll-1];
		                            ll -= 1;
		                        }
		                        temp_degrees[ll] = temp;
		                        order[N_old+ll] = temp2;
		                    }
		                }

		                // set next level start and end ranges
		                level_start = level_end;
		                level_end = N;
					}
				}
				if(N == num_rows)
					break;
			}

    		// return reversed order for RCM ordering
		    return order.reverse();
		}

		var mat = data[0];
		//display(mat);
		var transpose_mat = transpose(mat);
		//display(transpose_mat);
		var AAT = multiply(mat, transpose_mat);
		var ATA = multiply(transpose_mat, mat);
		//display(AAT);
		var csrAAT = convertToCSR(AAT);
		var csrATA = convertToCSR(ATA);
		var orderAAT = rcm(csrAAT.indices, csrAAT.indptr, AAT.length);
		var orderATA = rcm(csrATA.indices, csrATA.indptr, ATA.length);

		if(orderY)
		 	mat = returnYOrdered(orderAAT, mat);
		if(orderX)
			mat = returnXOrdered(orderATA, mat);

		data[0] = mat;
		return data;
	}

	return service;
});