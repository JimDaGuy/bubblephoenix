'use strict';
var http = require('http');
var fs = require("fs");
var queryString = require('querystring');
var requestHandler = require('request');

var port = process.env.PORT || process.env.NODE_PORT || 3000;

//Grab landing page, css, js, and favicon
var index = fs.readFileSync(__dirname + "/landing.html");
var styles = fs.readFileSync(__dirname + "/landingstyles.css");
var landingjs = fs.readFileSync(__dirname + "/landing.js");
var favicon = fs.readFileSync(__dirname + "/resources/favicon.png") || undefined;

//Set responseHeaders
var responseHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "Content-Type, accept",
  "access-control-max-age": 10,
  "Content-Type": "application/json"
};

//Method to handle our page requests. The HTTP request from the browser will be
//automatically passed in as request. The pre-formatted response object will be
//automatically passed in as response so we can add to it and send it back.
function onRequest(request, response) {
  //Returns the page, css, js, and favicon when requested
  if(request.url === "/") {
    response.writeHead(200, { "Content-Type" : "text/html"} );
    response.write(index);
    response.end();
    return;
  } else if (request.url === "/landingstyles.css") {
    response.writeHead(200, { "Content-Type" : "text/css"} );
    response.write(styles);
    response.end();
    return;
  } else if (request.url === "/landing.js") {
    response.writeHead(200, { "Content-Type" : "application/javascript"} );
    response.write(landingjs);
    response.end();
    return;
  } else if (request.url === "/resources/favicon.png") {
    response.writeHead(200, {"Content-Type" : "image/png"});
    response.write(favicon);
    response.end();
    return;
  }

  //Split after the ? mark to get the query string (key=value pairs)
  var query = request.url.split('?')[1];
  var params = queryString.parse(query);

  if(!params.url) {
    response.writeHead(400, responseHeaders);

    var responseMessage = {
      message: "Missing url parameter in request"
    };

    response.write(JSON.stringify(responseMessage));
    response.end();
    return;
  }

  try{
    response.writeHead(200, responseHeaders);
    requestHandler(params.url).pipe(response);
  }
  catch(exception) {
    console.dir(exception);
    response.writeHead(500, responseHeaders);

    var responseMessage = {
      message: "Error connecting to server. Check url and arguments for proper formatting"
    }

    response.write(JSON.stringify(responseMessage));
    response.end();
  }

}

http.createServer(onRequest).listen(port);
console.log("Listening on port:" + port);
