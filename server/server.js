
var http = require('http');
var url = require('url');
var query = require('querystring');
var fs = require('fs');
var express = require('express');
var request = require('request');

var port = process.env.PORT || 3000;

//read in our html file to serve back
var index = fs.readFileSync(__dirname + "/../landing.html");
var styles = fs.readFileSync(__dirname + "/../landingstyles.css");
var landingjs = fs.readFileSync(__dirname + "/../landing.js");

//function to handle our HTTP web requests
function onRequest(req, res) {

  //parse the URL from a string to an object of usable parts
  var parsedUrl = url.parse(req.url);
  //grab the query string from the parsedURL and parse it
  //into a usable object instead of a string
  var params = query.parse(parsedUrl.query);

  console.dir(parsedUrl.pathname)

  //if web page asked for /charityLoc (assuming ajax request)
  if(parsedUrl.pathname === "/charityLoc") {
    charityLocSearch(req, res, params);
  }
  else if(parsedUrl.pathname === "/landingstyles") {
    res.writeHead(200, { "Content-Type" : "text/css"} );
    res.write(styles);
    res.end();
  }
  else if(parsedUrl.pathname === "/landingjs") {
    res.writeHead(200, { "Content-Type" : "text/javascript"} );
    res.write(landingjs);
    res.end();
  }
  //ALL other requests send back the main page
  else {
    res.writeHead(200, { "Content-Type" : "text/html"} );
    res.write(index);
    res.end();
  }
}

http.createServer(onRequest).listen(port);
console.log("Listening on " + ip + ":" + port);
