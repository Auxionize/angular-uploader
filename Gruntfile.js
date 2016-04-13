/**
 * Created by yordan on 4/13/16.
 */
module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> (<%= pkg.homepage %>) */\n'
			},
			angularUploader: {
				files: {
					'./js/angular-uploader.min.js': ['./js/angular-uploader.js']
				}
			}
		},
		cssmin: {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> (<%= pkg.homepage %>) */\n'
			},
			minify: {
				files: {
					'css/angular-uploader.min.css': ['css/angular-uploader.css']
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	grunt.registerTask('default', ['build']);
	grunt.registerTask('build', ['uglify', 'cssmin']);
	grunt.registerTask('css', ['cssmin']);
};