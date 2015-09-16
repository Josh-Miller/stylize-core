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
    it('should return a pattern object', function() {
      var _stylize = new Stylize;
      _stylize.path = __dirname + '/assets';

      _stylize.createPattern(_stylize.path + '/mockSrc/mockPatterns/headings.html').should.be.a('object');
    });
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

  // describe('compile', function() {
  //   it('should throw an error if no compile plugins',function(){
  //     var _stylize = new Stylize;
  //     _stylize.path = __dirname + '/assets';
  //     _stylize.getPlugins();
  //     console.log(_stylize.compile('template string', 'partials string', {}));
  //     _stylize.compile('template string', 'partials string', {}).should.throw(Error, /No compile plugins found/);
  //   });
  // });

});
