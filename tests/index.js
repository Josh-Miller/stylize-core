var Stylize = require('../stylize'),
    chai = require('chai');

chai.should();

describe('Stylize', function () {
  describe('getPatterns', function() {
    it('should get an array of Patterns',function(){
      var _stylize = new Stylize;
      _stylize.path = __dirname + '/assets';

      _stylize.getPatterns(_stylize.path, function(patterns) {
        patterns.should.be.a('array');
      });
    });
  });

  describe('createPattern', function() {
    it('should return a pattern object')
      var _stylize = new Stylize;
      _stylize.path = __dirname + '/assets';

      var pattern = _stylize.createPattern(_stylize.path + '/mockSrc/mockPatterns/headings.html');
      console.log(pattern);
      pattern.should.be.a('object');
  });

  describe('data', function() {
    it('should get an object of Data',function(){
      var _stylize = new Stylize;
      _stylize.path = __dirname + '/assets';

      _stylize.data().should.be.a('object');
    });
  });

  describe('config', function() {
    it('should return a config object',function(){
      var _stylize = new Stylize;
      _stylize.path = __dirname + '/assets';

      _stylize.config().should.be.a('object');
    });
  });

  // WIP: tests for API functions
  // describe('_compile', function() {
  //   var _stylize = new Stylize;

  //   _.forEach(_stylize.config().plugins, function(n, key) {
  //     var settings = {};

  //     var plugin = require('../plugins/' + key);
  //     if (n) {
  //       settings = n;
  //     }

  //     _stylize.register(key, plugin, settings);
  //   });

  //   _stylize._compile({template: template, partials: partials, data: data}, function(compiled) {
  //     cb(compiled);
  //   });
  // });
});
