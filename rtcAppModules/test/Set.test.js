/*jslint node: true*/
'use strict';
var Set = require("../lib/Set").Set;
var assert = require("assert");

var testAdd = function () {
	var s = new Set();

	s.add(1);
	//console.log(s.toString());
	assert.ok(s.contains(1), "simple");
	assert.ok(s.getSize() === 1, "size 1");
	//console.log(s.toString());

	s.add(2);
	assert.ok(s.contains(1), "simple");
	assert.ok(s.contains(2), "simple");
	assert.ok(s.getSize() === 2, "size 2");
	//console.log(s.toString());

	s.add(2);
	assert.ok(s.contains(1), "simple");
	assert.ok(s.contains(2), "simple");
	assert.ok(s.getSize() === 2, "size 2");
	//console.log(s.toString());

	s.add(3);
	assert.ok(s.contains(1), "simple");
	assert.ok(s.contains(2), "simple");
	assert.ok(s.contains(3), "simple");
	assert.ok(s.getSize() === 3, "size 3");
	//console.log(s.toString());

	s.add(3);
	assert.ok(s.contains(1), "simple");
	assert.ok(s.contains(2), "simple");
	assert.ok(s.contains(3), "simple");
	assert.ok(s.contains(3), "simple");
	assert.ok(s.getSize() === 3, "size 3");
	//assert.ok(false, "guarantee fail");

	s.add(1000);
	assert.ok(s.contains(1), "simple");
	assert.ok(s.contains(2), "simple");
	assert.ok(s.contains(3), "simple");
	assert.ok(s.contains(1000), "simple");
	assert.ok(s.getSize() === 4, "size 3");
};
var testRemove = function () {
	var s = new Set(),
		i = 0;

	s.add(0);
	s.add(1);
	s.add(2);
	s.add(3);
	s.add(4);
	s.add(5);
	s.add(6);

	for (i = 0; i <= 6; i += 1) {
		assert.ok(s.contains(i), "simple");
	}
	assert.ok(s.getSize() === 7, "nothing removed yet");
	s.remove(6);
	s.remove(6);
	for (i = 0; i < 6; i += 1) {
		assert.ok(s.contains(i), "simple remove");
	}
	assert.ok(s.getSize() === 6, "removed one element");

	for (i = 0; i < 100; i += 1) {
		s.remove(i);
		assert.ok(s.contains(i) === false, "just removed " + i);
	}
	assert.ok(s.getSize() === 0, "remove all");
};
var testEmpty = function () {
	var s = new Set();
	s.add(1);
	s.add(2);
	s.add(3);

	s.empty();
	assert(s.getSize() === 0, "emptied");
	assert(s.contains(1) === false, "should not contain enay elements");
	assert(s.contains(2) === false, "should not contain enay elements");
	assert(s.contains(3) === false, "should not contain enay elements");
	assert(s.contains(4) === false, "should not contain enay elements");
};
var testWithObj = function () {
	var s = new Set(),
		arr = [{
			o: 1
		}, {
			o: 2
		}, {
			o: 3
		}, {
			o: 4
		}],
		i;
	for (i = 0; i < arr.length; i += 1) {
		s.add(arr[i]);
	}
	for (i = 0; i < arr.length; i += 1) {
		assert.ok(s.contains(arr[i]), "contains obj");
	}
};
var testWithEqFn = function () {
	var s = new Set(function (a, b) {
		return a.o === b.o;
	}),
		arr = [{
			o: 1
		}, {
			o: 1
		}, {
			o: 1
		}, {
			o: 2
		}],
		i;
	for (i = 0; i < arr.length; i += 1) {
		s.add(arr[i]);
	}
	for (i = 0; i < arr.length; i += 1) {
		assert.ok(s.contains(arr[i]), "contains obj");
	}
	assert(s.getSize() === 2, "adding objs with eqnFn true so they get replaced in set");
};
var testObjWithEqFn = function () {
	var s = new Set(),
		eqfn = function (other) {
			return other && other.o === this.o;
		},
		arr = [{
			o: 1,
			equals: eqfn
		}, {
			o: 1,
			equals: eqfn
		}, {
			o: 1,
			equals: eqfn
		}, {
			o: 2,
			equals: eqfn
		}],
		i;
	for (i = 0; i < arr.length; i += 1) {
		s.add(arr[i]);
	}
	for (i = 0; i < arr.length; i += 1) {
		assert.ok(s.contains(arr[i]), "contains obj");
	}
	assert(s.getSize() === 2, "adding objs with eqnFn true so they get replaced in set");
};
var testIterate = function () {
	var s = new Set(),
		arr = [1, 2, 3, 4, 5],
		i,
		sb = new Set();
	for (i = 0; i < arr.length; i += 1) {
		s.add(arr[i]);
	}

	s.iterate(function (elt) {
		sb.add(elt);
	});
	for (i = 0; i < arr.length; i += 1) {
		assert(sb.contains(arr[i]), "iteration, checking if iterated on all");
		assert(s.contains(arr[i]), "iteration checking if original unaffected");
	}
	assert(s.getSize() === 5, "check size");
	assert(sb.getSize() === 5, "check size other");
};
var testContainsAll = function () {
	var s = new Set(),
		arr = [1, 2, 3, 4, 5],
		i,
		sb = new Set();
	for (i = 0; i < arr.length; i += 1) {
		s.add(arr[i]);
	}

	s.iterate(function (elt) {
		sb.add(elt);
	});
	assert(sb.containsAll(s), "check containsAll when true");
	s.add(6);
	assert(sb.containsAll(s), "check containsAll when false");
	assert(s.containsAll(sb), "check containsAll when true and self is superset of sb");
};
testAdd();
testRemove();
testEmpty();
testWithObj();
testWithEqFn();
testObjWithEqFn();
testIterate();
testContainsAll();