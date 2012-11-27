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
	urlPath: '/'
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

    this.app.all(this.options.urlPath + ':resourceName', this.collection());
    this.app.get(this.options.urlPath + ':resourceName', this.collectionGet());

    
    this.app.post(this.options.urlPath + ':resourceName', this.collectionPost());
    
    this.app.all(this.options.urlPath + ':resourceName/:id', this.entity());
    this.app.get(this.options.urlPath + ':resourceName/:id', this.entityGet());

    // You can POST or PUT to update data
    this.app.post(this.options.urlPath + ':resourceName/:id', this.entityPut());
    this.app.put(this.options.urlPath + ':resourceName/:id', this.entityPut());

    this.app.delete(this.options.urlPath + ':resourceName/:id', this.entityDelete());
};

AngularBridge.prototype.addResource = function(singularName, model, pluralName, defaultSort) {
    pluralName = singularName;

    var resource = { singularName: singularName, pluralName: pluralName, model: model };
    this.resources.push(resource);
};

AngularBridge.prototype.getResource = function(name) {
    return _.find(this.resources, function(resource) { 
	return resource.pluralName === name; 
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
	var query = req.resource.model.find();
	
	query.exec(function(err, docs) {
	    if (err) {
		return self.renderError(err, null, req, res, next);
	    }
	    else {	    
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

	var doc = new req.resource.model(req.body);
	
	doc.save(function(err) {
	    if (err) { error(err); return; }
	    res.send(doc);
	});
    }, this); 
};

/*
 * Entity request goes there first
 * It retrieves the resource
 */
AngularBridge.prototype.entity = function() { 
    return _.bind(function(req, res, next) {
	var self = this;
	if (!(req.resource = this.getResource(req.params.resourceName))) { next(); return; }
		
	req.resource.model.findOne({ _id: req.params.id }, function(err, doc) {
	    console.log(err);
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
	
	// Merge 
	_.each(req.body, function(value, name) {
	    req.doc[name] = value;
	});
	
	
	req.doc.save(function(err) {
	    console.log(req.doc);
	    if (err) { 
		return res.send({success:false}); 
	    }
	    return res.send({success:true});
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



