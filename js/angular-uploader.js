/**
 * Created by yordan on 4/13/16.
 */

(function() {
	'use strict';

	// Directive definition =============================================
	angular.module('ui.angular-uploader', [
			'ngFileUpload',
			'ui.bootstrap'
		])
		.filter('bytes', function() {
			return function(bytes, precision) {
				if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
				if (typeof precision === 'undefined') precision = 1;
				var units = ['bytes', 'kb', 'MB', 'GB', 'TB', 'PB'],
					number = Math.floor(Math.log(bytes) / Math.log(1024));
				return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
			}
		})
		.directive('angularUploader', function() {

			var template = '\
			<form name="myForm"> \
				<div \
					ng-if="file.isVisible" \
					class="upload-element animated" \
					ng-class="{zoomOut: file.animated}" \
					role="alert" \
					ng-repeat="(key, file) in vm.files"> \
				<a \
					class="file-link" \
					ng-if="file.done" \
					href="{{file.downloadUrl}}" \
					target="_self"> \
					<div class="link-name">{{file.data.name}}</div> \
					<div class="link-size">({{file.data.size | bytes}})</div> \
				</a> \
				<div class="filename" ng-if="!file.done">{{file.data.name}}</div> \
				<span class="link-size" ng-if="!file.done">({{file.data.size | bytes}})</span> \
				<div ng-if="!file.done" class="tool-holder"> \
					<i \
						ng-click="vm.unload($index, file)" \
						class="glyphicon glyphicon-remove link-internal"> \
					</i> \
					<uib-progressbar \
						max="100" \
						value="file.progress"> \
					</uib-progressbar> \
					</div> \
					<i \
						ng-if="file.done" \
						ng-click="vm.unload($index, file)" \
						class="glyphicon glyphicon-remove link-remove"> \
					</i> \
					</div> \
					<div ng-repeat="errFile in vm.invalidFiles" class="alert alert-danger" role="alert"> \
					<button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
					<span aria-hidden="true">&times;</span> \
				</button> \
				Error uploading: \'{{errFile.name}}\'({{errFile.size | bytes}}) {{errFile.$error}} {{errFile.$errorParam}} \
				</div> \
				<button \
					class="btn btn-default" \
					ng-if="vm.showUploadBtn" \
					ngf-max-size="vm.maxFileSize" \
					ngf-model-invalid="errorFile" \
					ngf-select="vm.load($files, $invalidFiles)" \
					ngf-multiple="vm.multiple"> \
					<i class="glyphicon glyphicon-paperclip"></i> \
					<span ng-if="vm.multiple">Attach Files</span> \
					<span ng-if="!vm.multiple">Attach File</span> \
				</button> \
			</form>';


			return {
				scope: {
					uploadUrl: '<',
					downloadUrl: '<',
					multiple: '<?',
					maxFileSize: '<?',
					initFiles: '<?',
					debug: '<?'
				},
				template: template,
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