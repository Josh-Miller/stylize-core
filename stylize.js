'use strict';

var diveSync = require('diveSync'),
  fs = require('fs-extra'),
  readYaml = require('read-yaml'),
  _ = require('lodash'),
  path = require('path'),
  Pattern = require('./lib/pattern'),
  Category = require('./lib/category');

/**
 * Creates a new Stylize.
 * @class
 */
var Stylize = function() {

  /**
   * Stores the cli path
   * @type {String}
   */
  this.path = '';

  /**
   * Returns parsed config.yml
   * @return {object}
   */
  this.config = function() {
    return readYaml.sync(this.path + '/config.yml');
  };

  /**
   * A record of all plugins
   * @type {Array}
   */
  this.plugins = [];

  /**
   * @param  {string} name - Extending method
   * @param  {object} plugin - Loaded module
   * @param  {array} settings - Plugin settings
   */
  this.register = function(name, plugin, settings) {
    this.plugins.push({name: name, plugin: plugin, settings: settings});
  };

  /**
   * A compile method for plugins
   * @param  {object} pattern - Pattern object
   * @return {object} Return pattern after being run through plugins
   */
  this._compile = function(pattern) {

    var plugins = this.plugins.filter(function(plugin) {
      return plugin.plugin.extend === '_compile';
    });

    if (plugins.length === 0) {
      throw new Error('No compile plugins found');
    }

    var compiled = plugins.map(function(plugin) {
      var compiled = plugin.plugin.init(pattern, plugin.settings);
      return compiled;
    });

    return compiled[compiled.length - 1];
  };

  this._pattern = function(pattern) {
    var plugins = this.plugins.filter(function(plugin) {
      return plugin.plugin.extend === '_pattern';
    });

    if (plugins.length === 0) {
      return pattern;
    }

    var _pattern = plugins.map(function(plugin) {
      return plugin.plugin.init(pattern, plugin.settings);
    });

    return _pattern[_pattern.length - 1];
  };

  this._getPatterns = function(patterns, cb) {
    var _stylize = this;
    _.forEach(this.plugins, function(n) {
      if (n.plugin.extend === '_getPatterns') {
        n.settings.projectPath = _stylize.path;
        n.plugin.init(patterns, n.settings, function(e) {
          cb(e);
        });
      }
    });

    // Turn this into universal function for plugin checking
    var pluginHooks = this.plugins.map(function(e) {
      var exists = _.some(e, {extend: '_getPatterns'});
      if (exists) return true;
    });

    if (!_.includes(pluginHooks, true)) {
      cb(patterns);
    }
  };

  this._data = function(patternName) {
    var plugins = this.plugins.filter(function(plugin) {
      return plugin.plugin.extend === '_data';
    });
    var patternData = plugins.map(function(plugin) {
      return plugin.plugin.init(patternName);
    });

    return patternData[patternData.length - 1];
  };

  this._export = function(pattern, cb) {
    var plugins = this.plugins.filter(function(plugin) {
      return plugin.plugin.extend === '_export';
    });

    if (plugins.length === 0) {
      cb(pattern);
    }

    var exportedPattern = plugins.map(function(plugin) {
      plugin.plugin.init(pattern, plugin.settings, function(pattern) {
        cb(pattern);
      });
    });
  };

  this.patterns = [];
  this.categories = [];
  this.partials = {};
};

Stylize.prototype.getPlugins = function() {

  var _stylize = this;
  _.forEach(_stylize.config().plugins, function(n, key) {
    var settings = {};

    var plugin = require(path.join(_stylize.path, '/node_modules/') + key);
    if (n) {
      settings = n;
    }

    _stylize.register(key, plugin, settings);
  });
};

/**
 * Gets pattern specific data files
 *
 * @param  {string} patternName Name of pattern
 * @return {object}             Specific patterns data
 */
Stylize.prototype.patternData = function(patternName) {

  var patternData;

  diveSync(path.join(this.path, this.config().dataPatterns), function(err, file){

    if(err){
      throw err;
    }
    var fileArray = file.split('/');
    var fileName = _.last(fileArray).split('.')[0];

    if (fileName === patternName) {
      patternData = readYaml.sync(file);
    }
  });
  return patternData;
};

/**
 * Gets data variables for patterns
 *
 * @param  {string} patternName - Name of pattern
 * @param  {string} context - Compiler context
 * @param  {object} directData - Data passed in for pattern
 * @return {object} data
 */
Stylize.prototype.data = function(patternName, context, directData) {
  var data = readYaml.sync(this.path + this.config().data);

  // Get Plugin data
  var pluginData = this._data(patternName);
  data = _.assign({}, data, pluginData);

  // Get pattern specific data
  if (this.config().dataPatterns) {
    var patternData = this.patternData(patternName);
    data = _.assign({}, data, patternData);
  }

  if (context === 'export') {
    data = _.assign({}, data, readYaml.sync(this.path + this.config().exportData));
    // data = _.unescape(data);
  }

  if (directData) {
    data = _.assign({}, data, directData);
  }

  return data;
};

/**
 * Creates a pattern object
 *
 * @param  {string} file - Path to file
 * @return {object} pattern - Pattern object
 */
Stylize.prototype.createPattern = function(file) {

  var headerPath = this.config().hasOwnProperty('headerPath') ? path.join(this.path, this.config().headerPath) : path.join(this.path, _.trim('src/partials/head.hbs')),
    footerPath = this.config().hasOwnProperty('footerPath') ? path.join(this.path, this.config().footerPath) : path.join(this.path, _.trim('src/partials/footer.hbs'));

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
  pattern.uri =  '/patterns/' + fileNames.join('/');

  // Categories
  pattern.category = pattern.parents.join('/');

  // Pattern file
  var currentPattern = fs.readFileSync(file, 'utf8');

  // Partials
  this.partials[pattern.name] = currentPattern;

  // Push it
  pattern.template = currentPattern;
  pattern.code = currentPattern;

  // Create category object
  category.id = pattern.category;
  category.name = _.capitalize(_.last(pattern.parents));
  this.categories.push(category);

  this.categories = _.uniq(this.categories, 'name');

  return this._pattern(pattern);
};

/**
 * Loops through patterns
 *
 * @param {string} cmdPath - Root path of command
 * @param {requestCallback} cb - Returns patterns object
 */
Stylize.prototype.getPatterns = function(cmdPath, cb) {
  var _stylize = this;

  diveSync(path.join(cmdPath, this.config().patternsRoot), function(err, file){

    if(err){
      throw err;
    }

    var pattern = _stylize.createPattern(file);
    _stylize.patterns.push(pattern);
  });

  this._getPatterns(_stylize.patterns, function() {
    cb(_stylize.patterns);
  });
};

/**
 * Compiles patterns
 *
 * @param  {string} template - String of pattern data
 * @param  {string} partials - String of partial data
 * @param  {object} data - Data variables for pattern
 * @return {string} compiled
 */
Stylize.prototype.compile = function(template, partials, data) {

  var compiled = this._compile({template: template, partials: partials, data: data});

  return compiled;
};

/**
 * Parses compiled header html to create relative paths
 * @param  {object} pattern - Pattern object
 * @return {string} Return modified html
 */
Stylize.prototype.postCompile = function(pattern) {
  var parse5 = require('parse5');

  var Parser = parse5.Parser;
  var parser = new Parser();
  var document = parser.parse(pattern.header);

  function findEl(obj, node, attr) {
    obj.forEach(function(value) {
      if (value.nodeName === node) {
        value.attrs.forEach(function(value) {
          if (value.name === attr) {
            var patternPath = pattern.uri.split('/');
            patternPath.pop();

            value.value = path.relative('.'+patternPath.join('/'), value.value);
          }
        });
        return value;
      }
      if (value.childNodes) {
        return findEl(value.childNodes, node, attr);
      }
      return;
    });
  }

  findEl(document.childNodes, 'link', 'href');
  findEl(document.childNodes, 'script', 'src');

  var serializer = new parse5.Serializer();
  var html = serializer.serialize(document);

  return html;
};

/**
 * Writes data to file
 *
 * @param  {string} dest - Destination to outputted file
 * @param  {string} name - File name
 * @param  {object} data - File contents
 */
Stylize.prototype.build = function(dest, name, data) {
  fs.outputFileSync(path.join(dest, name), data);
};

/**
 * @param  {object} pattern - Pattern data
 * @param  {Function} cb - Fires when all export plugins are complete
 */
Stylize.prototype.export = function(pattern, cb) {
  this._export(pattern, function(pattern) {
    cb(pattern);
  });
};

module.exports = Stylize;
