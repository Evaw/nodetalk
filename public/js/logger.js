/*global define:false, window:false, require:false*/
define([], function(){
	'use strict';
	var o = {},
		i,
		emptyFn = function () {
		},
		createConsoleFnWrapper = function (fnName) {
			var propName = fnName;
			return function() {
				window.console[propName].apply(window.console, arguments);
			};
		},
		knownProps = [
			'memory',
			'profiles',
			'debug',
			'error',
			'info',
			'log',
			'warn',
			'dir',
			'dirxml',
			'table',
			'trace',
			'assert',
			'count',
			'markTimeline',
			'profile',
			'profileEnd',
			'time',
			'timeEnd',
			'timeStamp',
			'group',
			'groupCollapsed',
			'groupEnd',
			'clear'];
	if(window.console) {
		for (i in window.console) {
			if( typeof window.console[i] === 'function'){
				// if(window.console.hasOwnProperty(i)){
					o[i] = createConsoleFnWrapper(i);
				// }
			}
		}
	} else {
		for(i = 0;i<knownProps.length;i+=1){
			o[i] = emptyFn;
		}
	}
	return o;
});