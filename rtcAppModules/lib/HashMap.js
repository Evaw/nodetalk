/*jslint node: true, nomen: true*/
'use strict';

var hasOwnPropertyFn = Object.prototype.hasOwnProperty;
var hasOwnPropertyLocal = function(obj, key) {
  return hasOwnPropertyFn.call(obj, key);
};

var HashMap = function () {
	this._container = Object.create(null);
	this._size = 0;
};

/**
*/
HashMap.prototype.put = function (k,v) {
	if(!this.containsKey(k)){
		this._size +=1;
	}
	this._container[k] = v;
};
HashMap.prototype.remove = function (k) {
	if(this.containsKey(k)){
		this._size -=1;
	}
	delete this._container[k];
};

HashMap.prototype.containsKey = function (k) {
	return hasOwnPropertyLocal(this._container, k)
};
HashMap.prototype.empty = function () {
	this._container = Object.create(null);
	this._size = 0;
};
HashMap.prototype.getSize = function () {
	return this._size;
};
HashMap.prototype.get = function (k) {
	return this._container[k];
};
/**
	returns string with keys of map. 
	@param max number max number of entries to return 
**/
HashMap.prototype.toString = function(max) {
	var arr = [];
	var k, i=0;
	max = max || 10;
	for(k in this._container){
		arr.push(k);
		i+=1;
		if(i>max){
			if(this.getSize()>max){
				arr[arr.length] = "...";
			}
			break;
		}
	}
	return this.getSize() + ":" +"["+arr.join(',')+"]";
};
/**
	@param fn = function(value)
	do not recommend to iterate and add/remove stuff
*/
HashMap.prototype.iterate = function(fn) {
	var k;
	for(k in this._container){
		fn(this._container[k]);
	}
};
/**
	@param fn = function(key, value)
	do not recommend to iterate and add/remove stuff
*/	
HashMap.prototype.iterateMap = function (fn){
	var k;
	for(k in this._container){
		fn(k, this._container[k]);
	}
};
exports.HashMap = HashMap;