module.exports = function(){

    var mongoose = require("mongoose");
    var db = mongoose.connect("mongodb://localhost/angularBridge");

    var PizzaSchema = new mongoose.Schema({
        author : {
            type : String
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

    return {
        Pizza: mongoose.model('pizzas', PizzaSchema)
    };
}();
