# Angular Bridge

It's a bridge for resources (REST schema) between front-end and back-end when you are using :

- Mongoose for the models
- Express for the routing
- AngularJS as the front-end framework

## Sample code

db.js 

```
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

exports.Pizza = mongoose.model('pizzas', PizzaSchema);
```

add in app.js :

```
var db = require('./db.js');

var angularBridge = new (require('angular-bridge'))(app, {
    urlPath : '/api/'
});

angularBridge.addRessource('pizzas', db.Pizza);
//
// You can also hide fields 
// angularBridge.addRessource('pizzas', db.Pizza, { hide : ['_id', 'password']});
//
```

That's all for the backend, now in Angular :

```
var HomeCtrl = function($scope, $routeParams, $location, $resource) {
    var PizzaDb = $resource('/api/pizzas/:id', 
			       { id: '@_id' }); 
   
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
