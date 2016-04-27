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
						title="{{file.data.name}}" \
						target="_self"> \
						<div class="link-name">{{file.data.name}}</div> \
						<div class="link-size">{{file.data.size | bytes}}</div> \
					</a> \
					<i \
						ng-if="!vm.readOnly && file.done" \
						ng-click="vm.unload($index, file)" \
						class="glyphicon glyphicon-remove link-remove"> \
					</i> \
					<div class="file-holder" ng-if="!file.done"> \
						<div class="filename" title="{{file.data.name}}">{{file.data.name}}</div> \
						<span class="link-size">({{file.data.size | bytes}})</span> \
					</div> \
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
				</div> \
					<div ng-repeat="errFile in vm.invalidFiles" class="alert alert-danger" role="alert"> \
					<button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
					<span aria-hidden="true">&times;</span> \
				</button> \
				Error uploading: \'{{errFile.name}}\'({{errFile.size | bytes}}) {{errFile.$error}} {{errFile.$errorParam}} \
				</div> \
				<button \
					class="btn btn-default" \
					ng-if="vm.showUploadBtn && !vm.readOnly" \
					ng-disabled="vm.uploadInProgress" \
					ngf-max-size="vm.maxFileSize" \
					ngf-model-invalid="errorFile" \
					ngf-select="vm.load($files, $invalidFiles)" \
					ngf-multiple="vm.multiple"> \
					<i class="glyphicon glyphicon-paperclip"></i> \
					<span>{{vm.btnText}}</span> \
				</button> \
			</form>';


			return {
				scope: {
					btnText: '<',
					uploadUrl: '<',
					downloadUrl: '<',
					deleteUrl: '<',
					readOnly: '<',
					multiple: '<?',
					maxFileSize: '<?',
					initFiles: '<?',
					onFileUploaded: '=?',
					onFileRemoved: '=?',
					onUploadInit: '=?',
					onUploadEnd: '=?',
					debug: '<?'
				},
				template: template,
				controller: UploaderCtrl,
				controllerAs: 'vm'
			};
		});


	// Controller definition ============================================
	var UploaderCtrl = [
		'$scope',
		'$timeout',
		'$http',
		'Upload',
		function($scope, $timeout, $http, Upload) {
			var vm = this;
			var defaults = {
				btnText: 'Attach file(s)',
				initFiles: [],
				multiple: false,
				maxFileSize: '5MB',
				debug: false
			};

			// set defaults =================================================
			vm.files = [];
			vm.invalidFiles = [];
			vm.btnText = angular.isDefined($scope.btnText)
				? $scope.btnText
				: defaults.btnText;
			vm.initFiles = angular.isDefined($scope.initFiles)
				? $scope.initFiles
				: defaults.initFiles;
			vm.multiple = $scope.multiple = angular.isDefined($scope.multiple)
				? $scope.multiple
				: defaults.multiple;
			vm.maxFileSize = $scope.maxFileSize = angular.isDefined($scope.maxFileSize)
				? $scope.maxFileSize
				: defaults.maxFileSize;
			vm.debug = $scope.debug = angular.isDefined($scope.debug)
				? $scope.debug
				: defaults.debug;
			vm.uploadUrl = $scope.uploadUrl;
			vm.downloadUrl = $scope.downloadUrl;
			vm.deleteUrl = $scope.deleteUrl;
			vm.readOnly = $scope.readOnly;
			vm.showUploadBtn = true;
			vm.localGroupFiles = 0;
			vm.localGroupUploadedFiles = 0;
			vm.uploadInProgress = false;

			// debug watcher ================================================
			if(vm.debug) {
				var watchValues = [
					'multiple',
					'uploadUrl',
					'downloadUrl',
					'maxFileSize'
				];

				$scope.$watchGroup(watchValues, function(newValues, oldValues) {
					vm.multiple = $scope.$eval($scope.multiple);
					vm.uploadUrl = newValues[1];
					vm.downloadUrl = newValues[2];
					vm.maxFileSize = newValues[3];

					if(newValues[0] !== oldValues[0]) {
						vm.files = [];
					}

				});
			}

			var plugFileData = function(file, fileData) {
				file.data = fileData;
				file.done = true;
				file.progress = 100;
				file.isVisible = true;
				file.downloadUrl = vm.downloadUrl.replace(':id', file.data.uuid);
			};

			var setUploadBtnVisibility = function() {
				vm.showUploadBtn = !(vm.multiple === false && vm.files.length > 0);
			};

			if(vm.initFiles.length > 0) {
				angular.forEach(vm.initFiles, function(fileData) {
					var currentFile = {};

					plugFileData(currentFile, fileData);
					vm.files.push(currentFile);
				});

				setUploadBtnVisibility();
			}

			// load / upload files ==========================================
			vm.load = function($files, $invalidFiles) {
				vm.localGroupFiles = $files.length;
				var tempDate = new Date().getTime();

				if(angular.isFunction($scope.onUploadInit) && vm.localGroupFiles > 0) {
					vm.uploadInProgress = true;
					$scope.onUploadInit();
				}

				vm.files = vm.files.concat($files);
				vm.invalidFiles = $invalidFiles;

				angular.forEach($files, function(file, index) {
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
						if(evt.loaded !== evt.total) {
							file.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
						}

					}).success(function(response) {
						plugFileData(file, response);

						setUploadBtnVisibility();
						$scope.$emit('file:uploaded', file.data);

						if(angular.isFunction($scope.onFileUploaded)) {
							$scope.onFileUploaded(file.data);
						}

						if(angular.isFunction($scope.onUploadEnd)) {
							vm.localGroupUploadedFiles++;

							if(vm.localGroupFiles === vm.localGroupUploadedFiles) {
								vm.uploadInProgress = false;
								vm.localGroupFiles = vm.localGroupUploadedFiles = 0;
								$scope.onUploadEnd();
							}
						}

					}).error(function(response, status) {
						if (status > 0) {
							vm.removeElement(index, file);

							var invalidFile = {
								name: file.name,
								size: file.size,
								$error: response
							};

							if(angular.isArray($invalidFiles)) {
								$invalidFiles.push(invalidFile);
							}
							else {
								$invalidFiles = [invalidFile];
							}
						}
					});
				});

			};

			vm.removeElement = function($index, file) {
				file.animated = true;

				$timeout(function() {
					$scope.$emit('file:removed', {file: file.data});

					if(angular.isFunction($scope.onFileRemoved)) {
						$scope.onFileRemoved(file.data);
					}

					if(angular.isFunction($scope.onUploadEnd)) {
						vm.localGroupFiles--;

						if(vm.localGroupFiles === vm.localGroupUploadedFiles) {
							vm.uploadInProgress = false;
							vm.localGroupFiles = vm.localGroupUploadedFiles = 0;
							$scope.onUploadEnd();
						}

					}

					file.isVisible = false;
					vm.files.splice($index, 1);

					setUploadBtnVisibility();
				}, 600);
			};

			// unload files =================================================
			vm.unload = function($index, file) {
				if(!file.done) {
					file.upload.abort();
					vm.removeElement($index, file);
				}
				else {
					$http.delete(vm.deleteUrl.replace(':id', file.data.linkId))
						.success(function() {
							vm.removeElement($index, file);
						});
				}
			};
		}];
})();