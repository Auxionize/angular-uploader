# Angular uploader

## Install

You can install it with bower:

```
 bower install Auxionize/angular-uploader --save(optional)
```

## Usage

Include all Dependencies in your project:

* Bootstrap
* Angular
* Angular UI router
* ng-file-upload
* angular-bootstrap
* angular-animate
* angular-touch
* animate.css

`Dependencies will be installed with angular-uploader`


```
<!DOCTYPE html>
<html lang="en" ng-app="uploaderApp">
<head>
	<!-- all other css dependencies -->
	<link rel="stylesheet" href="bower_components/angular-uploader/css/angular-uploader.min.css">
</head>
<body>
    
    <!-- all other js dependencies -->
    <script src="bower_components/angular-uploader/js/angular-uploader.min.js"></script>
</body>
</html>
```

```
/* example usage */

// @your app you have to inject ui.angular-uploader in order to use it appwide
var app = angular.module('exampleApp', ['ui.angular-uploader']);


// @your view you can use the directive as follows
<angular-uploader
    upload-url="example/url"
    download-url="example/url/:id"
    multiple="true"
    max-file-size="200MB">
</angular-uploader>

```