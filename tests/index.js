var Stylize = require('../stylize'),
    chai = require('chai');

chai.should();
var expect = chai.expect;

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

  describe('build', function() {
    it('should create a file',function(){
      var fs = require('fs-extra');
      var _stylize = new Stylize;
      _stylize.path = __dirname + '/assets';

      _stylize.build(__dirname + '/testPatterns', 'test.html', 'test content');

      expect(fs.existsSync(__dirname + '/testPatterns/test.html')).to.be.true;

      after(function() {
        // Clean up /testPatterns created files
        fs.removeSync(__dirname + '/testPatterns');
      });
    });
  });

  describe('postCompile', function() {
    it('should return a string',function(){
      var _stylize = new Stylize;
      _stylize.path = __dirname + '/assets';

      var pattern = {
        name: 'accordion',
        parents: [ 'molecules', 'components' ],
        fileName: 'accordion.html',
        data: {},
        template: '',
        code: '',
        compiled: '',
        header: '',
        footer: '',
        description: '',
        usedIn: [],
        weight: 0,
        category: 'molecules/components',
        id: 'accordion',
        uri: '/public/molecules/components/accordion.html'
      }

      _stylize.postCompile(pattern).should.be.a('string');
    });
  });

  describe('patternData pattern defined', function() {
    it('should return a data object if pattern has specific variables',function(){
      var _stylize = new Stylize;
      _stylize.path = __dirname + '/assets';

      _stylize.patternData('paragraph').should.be.a('object');
    });
  });

  describe('patternData pattern undefined', function() {
    it('should return undefined if pattern does not have specific variables',function(){
      var _stylize = new Stylize;
      _stylize.path = __dirname + '/assets';

      expect(_stylize.patternData('some-pattern-name')).to.be.an('undefined');
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
