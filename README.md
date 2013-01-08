# Angular Bridge

It's a bridge for resources (REST schema) between front-end and back-end when you are using :

- Mongoose for the models
- Express for the routing
- AngularJS as the front-end framework

## Sample code

db.js 

```javascript
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/brabra');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var PizzaSchema = new Schema({
    author : {
	type : String,
    },
    color : {
	type : String
    },
    size : {
        type : Number
    },  
    password : {   // You can hide it from read and write ! (check after)
        type : String 
    }
});

// You can optionally add a method to schema.methods that is executed based
// on the type of HTTP request with the names "query", "get", "put", "post", and "delete"
PizzaSchema.methods.query = function() {
  console.log("Queried.");
};
PizzaSchema.methods.get = function() {
  console.log("Got.")
}
PizzaSchema.methods.put = function() {
  console.log("Put.")
}
PizzaSchema.methods.post = function() {
  console.log("Posted.")
}
PizzaSchema.methods.delete = function() {
  console.log("Deleted.")
}

exports.Pizza = mongoose.model('pizzas', PizzaSchema);
```

add in app.js :

```javascript
var db = require('./db.js');

var angularBridge = new (require('angular-bridge'))(app, {
    urlPrefix : '/api/'
});

angularBridge.addResource('pizzas', db.Pizza);

// You can hide fields...
angularBridge.addResource('toppings', db.Toppings, { hide : ['_id', 'password']});

// You can specify read-only fields... (sent to client, but will not write to database)
angularBridge.addResource('jaboodies', db.Jaboody, { readOnly: ['_id', 'cantChangeMe']});

// You can force a mongoose query... (to restrict access to certain items only)
angularBridge.addResource('projects', db.Project, { query: '{_user: String(req.user._id)}'});
// Note:  This can be passed as an object, but you can also pass it as a string
//        in cases where the object you're looking for is only accessible within
//        the HTTP-verb callback (in this example, 'req' will give an error if it
//        is not passed as a string)

// You can force a particular value regardless of what the client sends...
angularBridge.addResource('clients', db.Client, { force: {_user: 'req.user._id' }});
```
### BE CAREFUL!  `force` AND `query` BOTH USE `eval()`


That's all for the backend, now in Angular :

```javascript
var HomeCtrl = function($scope, $routeParams, $location, $resource) {
    var PizzaDb = $resource('/api/pizzas/:id', { id: '@_id' }); 
   
   // Magic, you are ready now !
   
   var new_pizza = new PizzaDb({
     author : 'agoodpizayolo',
     color : 'blue',
     size : 999
   });
   
   new_pizza.$save(function(save_the_pizza) {
      console.log('Success pizza - ', save_the_pizza);
   });
   
   PizzaDb.get({id : '50b40dd6ed3f055a27000001'}, function(pizza) {
    	pizza.color = 'UV';
    	pizza.$save();
    });
};
```
