/*jslint node: true*/
'use strict';
var Map = require("../lib/HashMap").HashMap;
var assert = require("assert");

var testPut = function () {
	var s = new Map();

	s.put(1,1);
	//console.log(s.toString());
	assert.ok(s.containsKey(1), "simple");
	assert.ok(s.getSize() === 1, "size 1");
	//console.log(s.toString());

	s.put(2,2);
	assert.ok(s.containsKey(1), "simple");
	assert.ok(s.containsKey(2), "simple");
	assert.ok(s.getSize() === 2, "size 2");
	//console.log(s.toString());

	s.put(2,2);
	assert.ok(s.containsKey(1), "simple");
	assert.ok(s.containsKey(2), "simple");
	assert.ok(s.getSize() === 2, "size 2");
	//console.log(s.toString());

	s.put(3);
	assert.ok(s.containsKey(1), "simple");
	assert.ok(s.containsKey(2), "simple");
	assert.ok(s.containsKey(3), "simple");
	assert.ok(s.getSize() === 3, "size 3");
	//console.log(s.toString());

	s.put(3);
	assert.ok(s.containsKey(1), "simple");
	assert.ok(s.containsKey(2), "simple");
	assert.ok(s.containsKey(3), "simple");
	assert.ok(s.containsKey(3), "simple");
	assert.ok(s.getSize() === 3, "size 3");
	//assert.ok(false, "guarantee fail");

	s.put(1000);
	assert.ok(s.containsKey(1), "simple");
	assert.ok(s.containsKey(2), "simple");
	assert.ok(s.containsKey(3), "simple");
	assert.ok(s.containsKey(1000), "simple");
	assert.ok(s.getSize() === 4, "size 3");
};
var testRemove = function () {
	var s = new Map(),
		i = 0;

	s.put(0);
	s.put(1);
	s.put(2);
	s.put(3);
	s.put(4);
	s.put(5);
	s.put(6);

	for (i = 0; i <= 6; i += 1) {
		assert.ok(s.containsKey(i), "simple");
	}
	assert.ok(s.getSize() === 7, "nothing removed yet");
	s.remove(6);
	s.remove(6);
	for (i = 0; i < 6; i += 1) {
		assert.ok(s.containsKey(i), "simple remove");
	}
	assert.ok(s.getSize() === 6, "removed one element");

	for (i = 0; i < 100; i += 1) {
		s.remove(i);
		assert.ok(s.containsKey(i) === false, "just removed " + i);
	}
	assert.ok(s.getSize() === 0, "remove all");
};
var testEmpty = function () {
	var s = new Map();
	s.put(1);
	s.put(2);
	s.put(3);

	s.empty();
	assert(s.getSize() === 0, "emptied");
	assert(s.containsKey(1) === false, "should not contain enay elements");
	assert(s.containsKey(2) === false, "should not contain enay elements");
	assert(s.containsKey(3) === false, "should not contain enay elements");
	assert(s.containsKey(4) === false, "should not contain enay elements");
};
var testIterate = function () {
	var s = new Map(),
		arr = [1, 2, 3, 4, 5],
		i,
		sb = new Map();
	for (i = 0; i < arr.length; i += 1) {
		s.put(arr[i]);
	}

	s.iterateMap(function (k,v) {
		sb.put(k,v);
	});
	for (i = 0; i < arr.length; i += 1) {
		assert(sb.containsKey(arr[i]), "iteration, checking if iterated on all");
		assert(s.containsKey(arr[i]), "iteration checking if original unaffected");
	}
	assert(s.getSize() === 5, "check size");
	assert(sb.getSize() === 5, "check size other");
};
testPut();
testRemove();
testEmpty();
testIterate();
