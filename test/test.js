var should = require("should"),
    request = require("supertest"),
    angularBridge = require("../index"),
    express = require("express"),
    mongoose = require("mongoose"),
    schema = require("./schema");

describe('Angular-bridge', function(){
    var bridge;
    var app;

    beforeEach(function(done){
        app = express();
        app.use(express.bodyParser());

        bridge = new angularBridge(app, null);
        bridge.addResource('pizzas', schema.Pizza);
        done();
    });

    it('GET /pizzas', function(done){
        request(app)
          .get('/pizzas')
          .expect(200, done);
    });

    it('POST /pizzas', function(done){
        request(app)
          .post('/pizzas')
          .send({author: "Author", color: "black", size: 4, password: "secret"})
          .expect(200, done);
    });

     it('POST /pizza - invalid data', function(done){
        request(app)
          .post('/pizzas')
          .send({author: "Author", color: "black", size: "four", password: "secret"})
          .expect(400, done);
     });
});



