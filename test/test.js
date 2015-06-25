var should = require("should"),
    supertest = require("supertest"),
    angularBridge = require("../index"),
    express = require("express"),
    request = require('request'),
    mongoose = require("mongoose"),
    http = require('http'),
    schema = require("./schema"),
    bodyParser = require('body-parser');

const URL = 'http://localhost:4000/';
const RESOURCE = 'pizzasto';

describe('Angular-bridge', function(){
  var bridge;
  var app;
  var server;

  before(function(done){
    app = express();

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    bridge = new angularBridge(app, {urlPrefix : '/api/'});
    bridge.addResource(RESOURCE, schema.Pizza);

    server = http.createServer(app);

    server.listen(4000, function(){
      done();
    });
  });

  after(function() {
    server.close();
  });

  describe('Right status', function() {
    it('GET /pizzas', function(done){
              supertest(app)
      .get('/api/' + RESOURCE)
      .expect(200, done);
    });

    it('POST /pizzas', function(done){
              supertest(app)
      .post('/api/' + RESOURCE)
      .send({author: "Author", color: "black", size: 4, password: "secret"})
      .expect(200, done);
    });

    it('POST /pizza - invalid data', function(done){
              supertest(app)
      .post('/api/' + RESOURCE)
      .send({author: "Author", color: "black", size: "four", password: "secret"})
      .expect(400, done);
    });
  });

  describe('Data exchange', function() {
    it.skip('should get nothing', function(done) {
      request(URL + RESOURCE, function(err, req, body) {
      });
    });
  });
});



