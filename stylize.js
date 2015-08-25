"use strict";

var diveSync = require('diveSync'),
    fs = require('fs-extra'),
    readYaml = require('read-yaml'),
    _ = require('lodash'),
    Pattern = require('./lib/pattern'),
    Category = require('./lib/category'),
    events = require('events');

var Stylize = function() {

  this.path = '';

  this.config = function() {
    return readYaml.sync(this.path + '/config.yml');
  }

  this.plugins = [];

  this.register = function(name, plugin, settings) {
    this.plugins.push({name: name, plugin: plugin, settings: settings});
  }

  this._compile = function(pattern, cb) {
    _.forEach(this.plugins, function(n, key) {
      if (n.plugin.extend === '_compile') {
        var compiled = n.plugin.init(pattern);
        cb(compiled);
      }
    });

    // Should throw error if no compile plugins found. Need to do object check for val.
    // if (!_.has(this.plugins, '_compile')) {
    //   throw new Error('No compile plugins found');
    // }
  };

  this._pattern = function(pattern, cb) {
    _.forEach(this.plugins, function(n, key) {
      if (n.plugin.extend === '_pattern') {
        n.plugin.init(pattern, function(e) {
          cb(e)
        });
      }
    });
    if (!_.has(this.plugins, '_pattern')) {
      cb(pattern);
    }
  };

  this._getPatterns = function(patterns, cb) {
    _.forEach(this.plugins, function(n, key) {
      if (n.plugin.extend === '_getPatterns') {
        n.plugin.init(patterns, n.settings, function(e) {
          cb(e)
        });
      }
    });
    if (!_.has(this.plugins, '_getPatterns')) {
      cb(patterns);
    }
  };

  this._data = function(patternName, cb) {
    _.forEach(this.plugins, function(n, key) {
      if (n.plugin.extend === '_data') {
        var patternData = n.plugin.init(patternName);
        cb(patternData);
      }
    });
  };

  this._export = function(pattern, cb) {
    _.forEach(this.plugins, function(n, key) {
      if (n.plugin.extend === '_export') {
        n.plugin.init(pattern, n.settings, function(e) {
          cb(e)
        });
      }
    });
    // if (!_.has(this.plugins, '_export')) {
    //   throw new Error('No export plugins found');
    // }
  };

  this.patterns = [];
  this.categories = [];
  this.partials = {};
}

Stylize.prototype.getPlugins = function() {
  _.forEach(_stylize.config().plugins, function(n, key) {
    var settings = {};

    var plugin = require(path + '/node_modules/' + key);
    if (n) {
      settings = n;
    }

    _stylize.register(key, plugin, settings);
  });
}

Stylize.prototype.data = function(patternName, context) {
  var data = readYaml.sync(this.path + this.config().data);

  this._data(patternName, function(patternData) {
    data = _.assign({}, data, patternData);
  });

  if (context === 'export') {
    data = _.assign({}, data, readYaml.sync(this.path + this.config().exportData));
    // data = _.unescape(data);
  }

  return data;
};

Stylize.prototype.createPattern = function(file) {

  var rootPath = __dirname + '/../../';
  var headerPath = this.config().hasOwnProperty('headerPath') ? this.path + '/' + this.config().headerPath : rootPath + _.trim('src/partials/head.hbs'),
      footerPath = this.config().hasOwnProperty('footerPath') ? this.path + '/' + this.config().footerPath : rootPath + _.trim('src/partials/footer.hbs');

  var pattern = new Pattern;
  var category = new Category;

  // Pattern header/footer
  var headerTemplate = fs.readFileSync(headerPath, 'utf8');
  var footerTemplate = fs.readFileSync(footerPath, 'utf8');
  pattern.header = headerTemplate;
  pattern.footer = footerTemplate;

  // Naming
  var fileNameArr = file.split('/');
  var fileNames = _.takeRightWhile(fileNameArr, function(n) {
    return n != 'patterns';
  });

  pattern.name = _.last(fileNames).split('.')[0];
  pattern.id = pattern.name;
  pattern.fileName = _.last(fileNames);
  pattern.parents = fileNames.slice(0, -1);

  // URI
  pattern.uri = this.config().destination + '/' + fileNames.join('/');

  // Categories
  pattern.category = pattern.parents.join('/');

  // Pattern file
  var currentPattern = fs.readFileSync(file, 'utf8');

  // Partials
  this.partials[pattern.name] = currentPattern;

  // Push it
  pattern.template = currentPattern;
  pattern.code = currentPattern;


  var _stylize = this;
  // Future postprocessor of getPatterns()
  this._pattern(pattern, function(pattern) {
    _stylize.patterns.push(pattern);
  });

  // Create category object
  category.id = pattern.category;
  category.name = _.capitalize(_.last(pattern.parents));
  this.categories.push(category);

  this.categories = _.uniq(this.categories, 'name');

  return pattern;
};

Stylize.prototype.getPatterns = function(path, cb) {
  var _stylize = this;

  var rootPath = __dirname + '/../../';
  var headerPath = this.config().hasOwnProperty('headerPath') ? this.path + '/' + this.config().headerPath : rootPath + _.trim('src/partials/head.hbs'),
      footerPath = this.config().hasOwnProperty('footerPath') ? this.path + '/' + this.config().footerPath : rootPath + _.trim('src/partials/footer.hbs');

  diveSync(path + '/' + this.config().patternsRoot, function(err, file){

    if(err){
      console.log(err);
      return;
    }

    _stylize.createPattern(file);

  });

  this._getPatterns(_stylize.patterns, function(patterns) {
    cb(_stylize.patterns);
  });
};

Stylize.prototype.compile = function(template, partials, data, cb) {

  this._compile({template: template, partials: partials, data: data}, function(compiled) {
    cb(compiled);
  });

};

Stylize.prototype.build = function(dest, name, data) {
  fs.outputFileSync(dest + '/' + name, data);
};

Stylize.prototype.export = function(pattern, cb) {
  this._export(pattern, function() {
    cb();
  });
};

module.exports = Stylize;
