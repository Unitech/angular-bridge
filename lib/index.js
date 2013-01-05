/*!
 * Angular Bridge
 */

/**
 * Module dependencies.
 */
var _ = require('underscore');
var util = require('util');

var AngularBridge = function(app, options, dontRegisterRoutes) {
	this.app = app;
	this.options = _.extend({
		urlPrefix: '/',	
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
	res.send(err);
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
		if (!(req.resource = this.getResource(req.params.resourceName))) { 
			return next();
		}
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
	
		var self = this;
		var hidden_fields = this.generateHiddenFields(req.resource);
		var query = req.resource.model.find().select(hidden_fields);
	
		query.exec(function(err, docs) {
			if (err) {
				return self.renderError(err, null, req, res, next);
			} else {	    
				res.send(docs);
			}
		});
	}, this); 
};

AngularBridge.prototype.collectionPost = function() { 
	return _.bind(function(req, res, next) {
		if (!req.resource) { next(); return; }
		var self = this;
		if (!req.body) throw new Error('Nothing submitted.');

		var epured_body = this.epureRequest(req.body, req.resource);
		var doc = new req.resource.model(epured_body);
		
		doc.save(function(err) {
			if (err) { error(err); return; }
			res.send(doc);
		});
	}, this); 
};

/**
 * Generate an object of fields to not expose
 */
AngularBridge.prototype.generateHiddenFields = function(resource) {
	var hidden_fields = {};

	if (resource.options == null || typeof resource.options['hide'] == 'undefined')
	return {};

	resource.options.hide.forEach(function(dt) {
		hidden_fields[dt] = false;	    
	});
	return hidden_fields;
}


/** Sec issue
 * Epure incoming data to avoid overwritte and POST request forgery
 */
AngularBridge.prototype.epureRequest = function(req_data, resource) {


	if (resource.options == null || typeof resource.options['hide'] == 'undefined')
	return req_data;

	var hidden_fields = resource.options.hide;

	_.each(req_data, function(num, key) {	
		_.each(hidden_fields, function(fi) {	    
			if (fi == key)
			delete req_data[key];
		});
	});

	return req_data;
}


/*
 * Entity request goes there first
 * It retrieves the resource
 */
AngularBridge.prototype.entity = function() { 
	return _.bind(function(req, res, next) {
		var self = this;
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
			else if (doc == null) {
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

		return res.send(req.doc);
	}, this); 
};


AngularBridge.prototype.entityPut = function() { 
	return _.bind(function(req, res, next) {
		if (!req.resource) { next(); return; }
		
		var self = this;
		
		if (!req.body) throw new Error('Nothing submitted.');

		var epured_body = this.epureRequest(req.body, req.resource);
		
		// Merge 
		_.each(epured_body, function(value, name) {
			req.doc[name] = value;
		});
		

		
		req.doc.save(function(err) {
			if (err) { 
				return res.send({success:false}); 
			}
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
			return res.send({success : true});
		});
	}, this); 
};



