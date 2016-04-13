/**
 * Created by yordan on 4/13/16.
 */
(function() {
	'use strict';

	// Directive definition =============================================
	angular.module('ui.angular-uploader')
		.directive('angularUploader', function() {
			return {
				scope: {
					uploadUrl: '<',
					downloadUrl: '<',
					multiple: '<?',
					maxFileSize: '<?',
					initFiles: '<?',
					debug: '<?'
				},
				templateUrl: 'template/angular-uploader.tpl.html',
				controller: UploaderCtrl,
				controllerAs: 'vm'
			};
		});


	// Controller definition ============================================
	var UploaderCtrl = ['$scope', '$timeout', 'Upload', function($scope, $timeout, Upload) {
		var vm = this;

		// set defaults =================================================
		vm.files = $scope.initFiles = angular.isDefined($scope.initFiles) ? $scope.initFiles : [];
		vm.invalidFiles = [];
		vm.uploadUrl = $scope.uploadUrl;
		vm.downloadUrl = $scope.downloadUrl;
		vm.multiple = $scope.multiple = angular.isDefined($scope.multiple) ? $scope.multiple : false;
		vm.maxFileSize = $scope.maxFileSize = angular.isDefined($scope.maxFileSize) ? $scope.maxFileSize : '2GB';
		vm.showUploadBtn = true;
		vm.debug = $scope.debug = angular.isDefined($scope.debug) ? $scope.debug : false;

		// debug watcher ================================================
		if(vm.debug) {
			var watchValues = [
				'multiple',
				'uploadUrl',
				'downloadUrl',
				'maxFileSize'
			];

			$scope.$watchGroup(watchValues, function(newValues) {
				vm.multiple = $scope.$eval($scope.multiple);
				vm.uploadUrl = newValues[1];
				vm.downloadUrl = newValues[2];
				vm.maxFileSize = newValues[3];
			});
		}

		// load / upload files ==========================================
		vm.load = function($files, $invalidFiles) {
			var tempDate = new Date().getTime();

			vm.files = vm.files.concat($files);
			vm.invalidFiles = $invalidFiles;

			angular.forEach($files, function(file) {
				var fileDate = new Date(tempDate++);

				file.data = {
					date: fileDate,
					name: file.name,
					size: file.size
				};
				file.done = false;
				file.isVisible = true;
				file.animated = false;
				file.progress = 0;

				file.upload = Upload.upload({
					url: vm.uploadUrl,
					method: 'POST',
					file: file
				}).progress(function(evt) {
					file.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
				}).success(function(response) {
					file.data = response[0];
					file.done = true;
					file.progress = 100;
					file.downloadUrl = vm.downloadUrl.replace(':id', file.data.uuid);

				}).error(function(response, status) {
					if (status > 0) {
						console.error(response);
					}
				});
			});

			vm.showUploadBtn = !(vm.multiple === false && $files.length > 0);
		};

		// unload files =================================================
		vm.unload = function($index, file) {
			if(!file.done) {
				file.upload.abort();
			}

			file.animated = true;

			$timeout(function() {
				file.isVisible = false;
				vm.files.splice($index, 1);

				vm.showUploadBtn = !(vm.multiple === false && vm.files.length > 0);
			}, 600);
		};

	}];
})();