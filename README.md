# Angular Bridge

Create, read, update, delete MongoDB collections via AngularJS.

It uses : 

- Mongoose for accessing to Mongodb
- Express for the routing
- AngularJS (with the [$resource](http://docs.angularjs.org/api/ngResource.$resource) method)

Btw don't forget to include [angular-resource.js](http://code.angularjs.org/1.1.5/angular-resource.js)

## Sample code

### Backend code

In you db.js backend : 

```javascript
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/pizza');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

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
    password : {   // You can hide it from read and write ! (cf after)
            type : String 
    }
});

// You can optionally add a method to schema.methods that is executed based
// on the type of HTTP request with the names "query", "get", "put", "post", and "delete"
// The callback receives the affected entities as it's parameter.
PizzaSchema.methods.query = function(entities) {
  console.log("Queried:");
  console.log(entities);
};

PizzaSchema.methods.get = function(entity) {
  console.log("Got:")
  console.log(entity);
};

PizzaSchema.methods.put = function(entity) {
  console.log("Put:")
  console.log(entity);
};

PizzaSchema.methods.post = function(entity) {
  console.log("Posted:")
  console.log(entity);
};

PizzaSchema.methods.delete = function(entity) {
  console.log("Deleted:")
  console.log(entity);
};

exports.Pizza = mongoose.model('pizzas', PizzaSchema);
```

In your backend app.js :

```javascript
var db = require('./db.js');

// Mount all the resource on /api prefix
var angularBridge = new (require('angular-bridge'))(app, {
    urlPrefix : '/api/'
});

// With express you can password protect a url prefix :
app.use('/api', express.basicAuth('admin', 'my_password'));

// Expose the pizzas collection via REST
angularBridge.addResource('pizzas', db.Pizza);

// Hiding fields
angularBridge.addResource('toppings', db.Toppings, { hide : ['_id', 'password']});

// Read-only fields (sent to client, but will not write to database)
angularBridge.addResource('jaboodies', db.Jaboody, { readOnly: ['_id', 'cantChangeMe']});

// Force a mongoose query (to restrict access to certain items only)
angularBridge.addResource('projects', db.Project, { query: '{_user: String(req.user._id)}'});
// Note:  This can be passed as an object, but you can also pass it as a string
//        in cases where the object you're looking for is only accessible within
//        the HTTP-verb callback (in this example, 'req' will give an error if it
//        is not passed as a string)

// Force a particular value regardless of what the client sends
angularBridge.addResource('clients', db.Client, { force: {_user: 'req.user._id' }});
```

**BE CAREFUL!  `force` AND `query` BOTH USE `eval()`**

### Front end code
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

# License

(The MIT License)

Copyright (c) 2013 Alexandre Strzelewicz <strzelewicz.alexandre@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
