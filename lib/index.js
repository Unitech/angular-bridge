/*!
 * Angular Bridge
 */

/**
 * Module dependencies.
 */
var _ = require('underscore');
var util = require('util');

var AngularBridge = function(app, options) {
  this.app = app;
  this.options = _.extend({
    urlPrefix: '/'
  }, options || {});
  this.resources = [ ];
  this.registerRoutes();
};

/**
 * Exporting the Class
 */
module.exports = exports = AngularBridge;

/**
 * Registers all REST routes with the provided `app` object.
 */
AngularBridge.prototype.registerRoutes = function() {
  this.app.all(this.options.urlPrefix + ':resourceName', this.collection());
  this.app.get(this.options.urlPrefix + ':resourceName', this.collectionGet());
  this.app.post(this.options.urlPrefix + ':resourceName', this.collectionPost());
  
  this.app.all(this.options.urlPrefix + ':resourceName/:id', this.entity());
  this.app.get(this.options.urlPrefix + ':resourceName/:id', this.entityGet());

  // You can POST or PUT to update data
  this.app.post(this.options.urlPrefix + ':resourceName/:id', this.entityPut());
  this.app.put(this.options.urlPrefix + ':resourceName/:id', this.entityPut());

  this.app.delete(this.options.urlPrefix + ':resourceName/:id', this.entityDelete());
};

AngularBridge.prototype.addResource = function(resource_name, model, options) {
  var resource = { 
    resource_name: resource_name, 
    model: model,
    options : options || null
  };

  this.resources.push(resource);
};

AngularBridge.prototype.getResource = function(name) {
  return _.find(this.resources, function(resource) { 
    return resource.resource_name === name; 
  });
};

AngularBridge.prototype.renderError = function (err, redirectUrl, req, res, next) {
  res.send(400, err);
};

AngularBridge.prototype.renderCollection = function(docs, req, res, next) {
  res.send(docs);
};

AngularBridge.prototype.renderEntity = function (doc, req, res, next) {
  res.send(doc);
};

AngularBridge.prototype.redirect = function (address, req, res, next) {
  res.send(address);
};

/**
 * All entities rest functions have to go through this first.
 */
AngularBridge.prototype.collection = function() { 
  return _.bind(function(req, res, next) {
    req.resource = this.getResource(req.params.resourceName);
    return next();
  }, this); 
};

/**
 * Renders a view with the list of all docs.
 */
AngularBridge.prototype.collectionGet = function() { 
  return _.bind(function(req, res, next) {
    if (!req.resource) { 
      return next();
    }
    
    var self = this, dbQueryOptions = {};
    var hidden_fields = this.generateHiddenFields(req.resource);
    if (req.resource.options && req.resource.options.query) {
      if (typeof req.resource.options.query === 'string') dbQueryOptions = eval( '(' + req.resource.options.query + ')');
      else if (typeof req.resource.options.query !== 'object') dbQueryOptions = req.resource.options.query;
    }
    var query = req.resource.model.find(dbQueryOptions).select(hidden_fields);

    query.exec(function(err, docs) {
      if (err) {
	return self.renderError(err, null, req, res, next);
      } else {
	if(req.resource.model.schema.methods.query) req.resource.model.schema.methods.query(docs);
	res.send(docs);
      }
      return false;
    });
    return false;
  }, this); 
};

AngularBridge.prototype.collectionPost = function() { 
  return _.bind(function(req, res, next) {
    if (!req.resource) { next(); return; }
    if (!req.body) throw new Error('Nothing submitted.');

    var epured_body = this.epureRequest(req, req.resource);
    var doc = new req.resource.model(epured_body);
    var self = this;

    doc.save(function(err) {
      if (err) {
        self.renderError(err, null, req, res, next);
        return;
      }

      if (doc.schema.methods.post) 
        doc.schema.methods.post(doc);

      res.send(doc);
    });
  }, this); 
};

/**
 * Generate an object of fields to not expose
 */
AngularBridge.prototype.generateHiddenFields = function(resource) {
  var hidden_fields = {};

  if (!resource.options || typeof resource.options.hide == 'undefined')
    return {};

  resource.options.hide.forEach(function(dt) {
    hidden_fields[dt] = false;
  });
  return hidden_fields;
};


/** Sec issue
 * Epure incoming data to avoid overwritte and POST request forgery
 * and disallows writing to read-only fields
 */
AngularBridge.prototype.epureRequest = function(req, resource) {
  var req_data = req.body;

  if (resource.options === null || (typeof resource.options.hide == 'undefined' && typeof resource.options.readOnly == 'undefined' && typeof resource.options.force == 'undefined'))
    return req_data;
  
  for(var key in resource.options.force) {
    req_data[key] = eval('('+resource.options.force[key]+')');
  }

  var hidden_fields = _.union(resource.options.hide, resource.options.readOnly);
  _.each(req_data, function(num, key) {	
    _.each(hidden_fields, function(fi) {
      if (fi == key)
	delete req_data[key];
    });
  });

  return req_data;
};


/*
 * Entity request goes there first
 * It retrieves the resource
 */
AngularBridge.prototype.entity = function() { 
  return _.bind(function(req, res, next) {
    if (!(req.resource = this.getResource(req.params.resourceName))) { next(); return; }
    
    var hidden_fields = this.generateHiddenFields(req.resource);

    //
    // select({_id : false}) invert the select process (hidde the _id field)
    //
    var query = req.resource.model.findOne({ _id: req.params.id }).select(hidden_fields);
    
    query.exec(function(err, doc) {
      if (err) {
	return res.send({
	  success : false, 
	  err : util.inspect(err)
	});
      }
      else if (doc === null) {
	return res.send({
	  success : false, 
	  err : 'Record not found'
	});
      }
      req.doc = doc;
      return next();
    });
  }, this); 
};

/**
 * Gets a single entity
 * 
 * @return {Function} The function to use as route
 */
AngularBridge.prototype.entityGet = function() {     
  return _.bind(function(req, res, next) {
    if (!req.resource) { 
      return next(); 
    }
    if(req.doc.schema.methods.get) req.doc.schema.methods.get(req.doc);
    return res.send(req.doc);
  }, this); 
};

AngularBridge.prototype.entityPut = function() { 
  return _.bind(function(req, res, next) {
    if (!req.resource) { next(); return; }
    
    if (!req.body) throw new Error('Nothing submitted.');

    var epured_body = this.epureRequest(req, req.resource);
    
    // Merge 
    _.each(epured_body, function(value, name) {
      req.doc[name] = value;
    });
    
    req.doc.save(function(err) {
      if (err) { 
	return res.send({success:false}); 
      }
      if (req.doc.schema.methods.put) req.doc.schema.methods.put(req.doc);
      return res.send(req.doc);
    });
  }, this); 
};

AngularBridge.prototype.entityDelete = function() { 
  return _.bind(function(req, res, next) {
    if (!req.resource) { next(); return; }
    
    req.doc.remove(function(err) {
      if (err) {
	return res.send({success : false}); 
      }
      if (req.doc.schema.methods.delete) req.doc.schema.methods.delete(req.doc);
      return res.send({success : true});
    });
  }, this); 
};
