app.factory('loadService', function($http, $q) {

	var matrixURL = 'data/A.txt';
	var visual_meme_indexURL = 'data/visual_meme_index';
	var cluster1URL = 'data/Cluster1.txt';
	
	var service = {};
	service.getMatrix = function($scope, id, q) {
		$http.get(matrixURL).then(function(response) {$scope[id] = response.data; q.resolve();});
	}

	service.getVisualMemeIndex = function($scope, id, q) {
		$http.get(visual_meme_indexURL)
		.then(function(response) {$scope[id] = response.data; q.resolve();});
	}

	service.getCluster1 = function($scope, id, q) {
		$http.get(cluster1URL)
		.then(function(response) {$scope[id] = response.data; q.resolve();});
	}

	service.getAllData = function($scope, matrixID, VMIID, clusterID) {
		var q1 = $q.defer(),
			q2 = $q.defer(),
			q3 = $q.defer(),
			p1 = q1.promise, 
			p2 = q2.promise,  
			p3 = q3.promise;

		service.getMatrix($scope, matrixID, q1);
		service.getVisualMemeIndex($scope, VMIID, q2);
		service.getCluster1($scope, clusterID, q3);

		var promises = [
			p1, p2, p3
		];

		var a = $q.all(promises);
		return a;
	}

	return service;
});