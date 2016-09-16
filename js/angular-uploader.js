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
					ng-repeat="(key, file) in files"> \
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
						ng-if="!readOnly && file.done" \
						ng-click="unload($index, file)" \
						class="glyphicon glyphicon-remove link-remove"> \
					</i> \
					<div class="file-holder" ng-if="!file.done"> \
						<div class="filename" title="{{file.data.name}}">{{file.data.name}}</div> \
						<span class="link-size">({{file.data.size | bytes}})</span> \
					</div> \
					<div ng-if="!file.done" class="tool-holder"> \
						<i \
							ng-click="unload($index, file)" \
							class="glyphicon glyphicon-remove link-internal"> \
						</i> \
						<div class="progress">\
							 <div class="progress-bar" role="progressbar" aria-valuenow="file.progress" aria-valuemin="0" aria-valuemax="100" style="width: {{file.progress}}%;">\
							 </div>\
						</div>\
					</div> \
				</div> \
					<div ng-repeat="errFile in invalidFiles" class="alert alert-danger" role="alert"> \
					<button type="button" class="close" data-dismiss="alert" aria-label="Close"> \
					<span aria-hidden="true">&times;</span> \
				</button> \
				Error uploading: \'{{errFile.name}}\'({{errFile.size | bytes}}) {{errFile.$error}} {{errFile.$errorParam}} \
				</div> \
				<button \
					class="btn btn-default" \
					ng-if="showUploadBtn && !readOnly" \
					ng-disabled="uploadInProgress" \
					ngf-max-size="maxFileSize" \
					ngf-pattern="supported"\
					ngf-model-invalid="errorFile" \
					ngf-select="load($files, $invalidFiles)" \
					ngf-multiple="multiple"> \
					<i class="glyphicon glyphicon-paperclip"></i> \
					<span translate>{{btnText}}</span> \
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
					supported: '<?',
					initFiles: '<?',
					onFileUploaded: '=?',
					onFileRemoved: '=?',
					onUploadInit: '=?',
					onUploadEnd: '=?',
					debug: '<?'
				},
				template: template,
				controller: UploaderCtrl
			};
		});


	// Controller definition ============================================
	var UploaderCtrl = [
		'$scope',
		'$timeout',
		'$http',
		'Upload',
		function($scope, $timeout, $http, Upload) {
			var supportedTypes = ['!.exe'];
			var defaults = {
				btnText: 'Attach file(s)',
				initFiles: [],
				multiple: false,
				maxFileSize: '5MB',
				supported: supportedTypes.join(),
				debug: false
			};

			// set defaults =================================================
			$scope.files = [];
			$scope.invalidFiles = [];
			$scope.btnText = angular.isDefined($scope.btnText)
				? $scope.btnText
				: defaults.btnText;
			$scope.initFiles = angular.isDefined($scope.initFiles)
				? $scope.initFiles
				: defaults.initFiles;
			$scope.multiple = angular.isDefined($scope.multiple)
				? $scope.multiple
				: defaults.multiple;
			$scope.maxFileSize = angular.isDefined($scope.maxFileSize)
				? $scope.maxFileSize
				: defaults.maxFileSize;
			$scope.supported = angular.isDefined($scope.supported)
				? $scope.supported
				: defaults.supported;
			$scope.debug = $scope.debug = angular.isDefined($scope.debug)
				? $scope.debug
				: defaults.debug;
			$scope.showUploadBtn = true;
			$scope.localGroupFiles = 0;
			$scope.localGroupUploadedFiles = 0;
			$scope.uploadInProgress = false;

			$scope.$on('uploader:resetFiles', function() {
				$scope.files = [];
			});

			var plugFileData = function(file, fileData) {
				file.data = fileData;
				file.done = true;
				file.progress = 100;
				file.isVisible = true;
				file.downloadUrl = $scope.downloadUrl.replace(':id', file.data.uuid);
			};

			var setUploadBtnVisibility = function() {
				$scope.showUploadBtn = !($scope.multiple === false && $scope.files.length > 0);
			};

			var listenForInitFiles = function(oldValue, newValue) {
				var tempData = angular.isUndefined(newValue) ? oldValue : newValue;

				if(tempData && tempData.length > 0) {
					angular.forEach(tempData, function(fileData) {
						var currentFile = {};

						plugFileData(currentFile, fileData);
						$scope.files.push(currentFile);
					});

					setUploadBtnVisibility();

				}
			};

			$scope.$watch('initFiles', listenForInitFiles);


			// load / upload files ==========================================
			$scope.load = function($files, $invalidFiles) {
				if(angular.isUndefined($files)) {
					return;
				}

				$scope.localGroupFiles = $files.length;
				var tempDate = new Date().getTime();

				if(angular.isFunction($scope.onUploadInit) && $scope.localGroupFiles > 0) {
					$scope.uploadInProgress = true;
					$scope.onUploadInit();
				}

				$scope.invalidFiles = $invalidFiles;

				angular.forEach($files, function(file, index) {
					var fileDate = new Date(tempDate++);

					$scope.files.push(file);
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
						url: $scope.uploadUrl,
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
							$scope.localGroupUploadedFiles++;

							if($scope.localGroupFiles === $scope.localGroupUploadedFiles) {
								$scope.uploadInProgress = false;
								$scope.localGroupFiles = $scope.localGroupUploadedFiles = 0;
								$scope.onUploadEnd();
							}
						}

					}).error(function(response, status) {
						if (status > 0) {
							$scope.removeElement(index, file);

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

			$scope.removeElement = function($index, file) {
				file.animated = true;

				$timeout(function() {
					$scope.$emit('file:removed', {file: file.data});

					if(angular.isFunction($scope.onFileRemoved)) {
						$scope.onFileRemoved(file.data);
					}

					if(angular.isFunction($scope.onUploadEnd)) {
						$scope.localGroupFiles--;

						if($scope.localGroupFiles === $scope.localGroupUploadedFiles) {
							$scope.uploadInProgress = false;
							$scope.localGroupFiles = $scope.localGroupUploadedFiles = 0;
							$scope.onUploadEnd();
						}

					}

					file.isVisible = false;
					$scope.files.splice($index, 1);

					setUploadBtnVisibility();
				}, 600);
			};

			// unload files =================================================
			$scope.unload = function($index, file) {
				if(!file.done) {
					file.upload.abort();
					$scope.removeElement($index, file);
				}
				else {
					$http.delete($scope.deleteUrl.replace(':id', file.data.linkId))
						.success(function() {
							$scope.removeElement($index, file);
						});
				}
			};
		}];
})();