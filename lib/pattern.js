"use strict";

var pattern = function() {
  this.name = '';
  this.parents = [];
  this.fileName = '';
  this.data = {};
  this.template = '';
  this.code = '';
  this.compiled = '';
  this.header = '';
  this.footer = '';
  this.description = '';
  this.usedIn = [];
  this.weight = 0;
  this.category = '';
  this.id = '';
  this.uri = '';
};

module.exports = pattern;
