'use strict';

//IIFE
(function () {
  //Document Elements
  var container = undefined;
  var canvas = undefined;
  var ctx = undefined;
  var canvasContainer = undefined;
  var nearbyButton = undefined;
  var searchButton = undefined;
  var queryBox = undefined;
  var resultsBox = undefined;

  //Canvas Animation Variables
  var previousUpdateTime = undefined;
  var animationID = 0;

  //Charity Search Variables
  var cData = undefined;
  var previousSearchTerm = undefined;
  var geoEnabled = true;
  var numResults = 25;
  var currLat = 0;
  var currLong = 0;
  var cityStateString = undefined;

  //URIs to switch out for local and hosted usage
  //var uri = "http://127.0.0.1:3000";
  var uri = "https://bubblephoenix.csh.rit.edu/";

  //Charity Search API Key
  var apiKey = "cc68fc7689c5d78a918241ff8c0eb905";

  //Particle Variables
  var maxParticles = 150;
  var preWarmCount = 100;
  var particleRate = 10;
  var particleLineRange = 25;
  var particleColor = 'pink';
  var particleShadowColor = 'red';
  var particleLineColor = '#00E057';
  var particleLineShadowColor = "#7F43E0";
  var particleOverlayColor = "#80D0E5";
  var particleSize = 4;
  var particleSpeed = 10;
  var particleTimer = 0;
  var particles = []; //Array of particle objects

  //Function runs on window load. Sets initial variables,
  //Calls first update for canvas animation
  function init() {
    //Set document element variables
    container = document.querySelector('#container');
    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');
    canvasContainer = document.querySelector('header');
    nearbyButton = document.querySelector('#geoLocButton');
    searchButton = document.querySelector('#searchbutton');
    queryBox = document.querySelector('input');
    resultsBox = document.querySelector('#resultsbox');

    //Set onclick functions for the search and nearby buttons
    searchButton.onclick = performSearch;
    nearbyButton.onclick = geoLocate;

    //Sets performSearch() to be called when the user presses
    //enter inside the input box
    queryBox.onkeydown = function() {
      if(event.keyCode == 13)
      performSearch();
    };

    //Set canvas to fit its container size
    canvas.width = canvasContainer.offsetWidth;
    canvas.height = canvasContainer.offsetHeight;

    //Sets number of particles based on screen size
    if(window.innerWidth >= 550) {
      particleLineRange = 25;
      maxParticles = 250;
      preWarmCount = 150;
    }
    else {
      particleLineRange = 10;
      maxParticles = 150;
      preWarmCount = 100;
    }

    //Initialize update timer
    previousUpdateTime = performance.now();

    //PreWarm Particles
    preWarmParticles();

    //Make initial update call
    update();
  }

  //Called about every 1/60 sec. Used to update the canvas drawing
  function update() {
    //Check Time Passed
    var dt = calculateDeltaTime();

    //Clear previously drawn canvas frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Draw overlay color
    ctx.fillStyle = particleOverlayColor;
    ctx.fillRect( 0, 0, canvas.width, canvas.height);

    //Draw Particles and Lines
    drawParticles(ctx);
    drawParticleLines(ctx);
    //Create New Particles
    createParticles(dt);
    //Move Particles
    moveParticles(dt, particleSpeed);

    ctx.save();

    //Draw App Title
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "pink";
    ctx.shadowColor = "#26466D";
    ctx.shadowBlur = 10;
    ctx.font = "3em 'Jua', arial";
    ctx.fillText("Bubble Phoenix", canvas.width / 2, 20);

    //Draw App Tagline
    ctx.shadowBlur = 10;
    ctx.font = "2em 'Yellowtail'";
    ctx.fillText("You can do some good", canvas.width / 2, 90);

    ctx.restore();

    //Schedule call to update
    requestAnimationFrame(update);
  }

  //Returns the time passed since the last time
  // this function has been called
  function calculateDeltaTime() {
    var now, fps;
    now = performance.now();
    fps = 1000 / (now - previousUpdateTime);
    fps = clamp(fps, 12, 60);
    previousUpdateTime = now;
    return 1/fps;
  }

  /*
  Function Name: clamp(val, min, max)
  Author: Web - various sources
  Return Value: the constrained value
  Description: returns a value that is
  constrained between min and max (inclusive)
  */
  function clamp(val, min, max){
    return Math.max(min, Math.min(max, val));
  }

  // -- Particle Functions --

  //Iterates through the array of particles and draws them at their current location
  function drawParticles(ctx) {
    ctx.save();

    //Set styles for particle drawing
    ctx.fillStyle = particleColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor= particleShadowColor;

    //Draw particles
    for(var i = 0; i < particles.length; i++) {
      ctx.beginPath();
      ctx.arc(particles[i].x, particles[i].y, particleSize, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }

  //Draw lines between particles that are within a certain range of each other
  function drawParticleLines() {
    ctx.save();

    //Set styles for line drawing
    ctx.strokeStyle = particleLineColor;
    ctx.shadowBlur = 5;
    ctx.shadowColor = particleLineShadowColor;

    //Check if particles are close enough to each other to draw a line between them
    for(var i = 0; i < particles.length; i++) {
      for(var j = 0; j < particles.length; j++) {
        if(i == j)
        continue;

        //This type of collision is much less expensive than checking distance
        //between particles. If I had to do that again I would've used particles.js
        var xDist = Math.abs(particles[i].x - particles[j].x);
        var yDist = Math.abs(particles[i].y - particles[j].y);

        //Draw line between particles if they are close enough together
        if(xDist < particleLineRange && yDist < particleLineRange) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  //Create new particles
  function createParticles(dt) {
    var timePerParticle = 1 / particleRate;
    //Check timer and max particles before creating a new particle
    if(particleTimer >= timePerParticle && particles.length < maxParticles) {

      //Generate particle variables
      //Generate on-canvas location variable
      var x = Math.random() * canvas.width;
      var y = Math.random() * canvas.height;
      //Generate random particle speeds
      var xSp = Math.random() * particleSpeed * 2;
      xSp -= particleSpeed;
      var ySp = Math.random() * particleSpeed * 2;
      ySp -= particleSpeed;

      //Create new particle
      var p = new Particle(x, y, xSp, ySp);

      //Add particle to particle list
      particles.push(p);

      //Reset particle timer
      particleTimer = 0;
    }
    else //Increment timer
    particleTimer += dt;
  }

  //Move particles and delete them when they leave the screen
  function moveParticles(dt, particleSpeed) {
    for(var i = 0; i < particles.length; i++) {

    //Move particle
    particles[i].x += particles[i].xSpeed * dt;
    particles[i].y += particles[i].ySpeed * dt;

    //Remove particles when they move offscreen
    if(particles[i].x < 0 || particles[i] > canvasContainer.offsetWidth ||
      particles[i].y < 0 || particles[i].y > canvasContainer.offsetHeight) {
        particles.splice(i, 1);
        i--;
      }
    }
  }

  //Particle object constructor
  function Particle( x, y, xSpd, ySpd) {
    this.x = x;
    this.y = y;
    this.xSpeed = xSpd;
    this.ySpeed = ySpd;
  }

  //Create as many particles as our prewarm count
  function preWarmParticles() {
    while(preWarmCount > particles.length) {

      //Generate on-canvas location variable
      var x = Math.random() * canvas.width;
      var y = Math.random() * canvas.height;
      //Generate random particle speeds
      var xSp = Math.random() * particleSpeed * 2;
      xSp -= particleSpeed;
      var ySp = Math.random() * particleSpeed * 2;
      ySp -= particleSpeed;

      //Create new particle
      var p = new Particle(x, y, xSp, ySp);

      //Add particle to particle list
      particles.push(p);
    }
  }

  // -- Search Functions --

  // Grabs search query from input box, form a query string,
  // Make a request that will be handled by our proxy
  function performSearch() {
    //Enable additional geolocation searches after a non-geolocation search
    geoEnabled = true;

    //Grab search term
    var searchTerm = queryBox.value;

    //Prevent searching for a query that is currently displayed
    if(!searchTerm || searchTerm.length === 0 || searchTerm == previousSearchTerm)
    return;

    //Set the previous search term to prevent duplicate searches
    previousSearchTerm = searchTerm;

    //Parse string and split it into our search terms
    var queries = searchTerm.split(", ");
    var city = queries[0];
    var state = queries[1];
    state = state.toUpperCase();

    //Form our query string with the url
    var apiCallLink = "https://data.orghunter.com/v1/charitysearch?user_key=";
    apiCallLink += apiKey + "&city=" + city + "&state=" + state +
    "&eligible=1" + "&rows=" + numResults;

    //Encode the url
    apiCallLink = encodeURIComponent(apiCallLink);

    //Attach our uri to the url to prevent CORS restrictions
    var url = uri + "?url=" + apiCallLink;

    //Make XMLHttpRequest
    var xhr = new XMLHttpRequest();

    xhr.onload = function() {
      //Fade out old results
      $('#resultsbox > div').fadeOut(200);

      //Reset the latitude and longitude for sunrise time
      currLat = 0;
      currLong = 0;

      //Parse the new results
      parseCharities(xhr.responseText);

    };

    xhr.open('GET', url);
    xhr.send();
  }

  //Grabs geolocation and sends the latitude/longitude to geoLocSearch
  function geoLocate() {
    if("geolocation" in navigator)
      navigator.geolocation.getCurrentPosition(geoLocSearch);
    else
      return;
  }

  //Accepts geolocation coordinates and makes a charity search with them
  function geoLocSearch(position) {
    //Set latitude and longitude from geolocation information
    var coordinates = position.coords;
    var lat = coordinates.latitude;
    var long = coordinates.longitude;

    //Prevents a geoLocation search if one is currently displayed already
    if(!geoEnabled)
      return;

    //Disable another geoLocation search from being made
    geoEnabled = false;
    //Clear the previous search term
    previousSearchTerm = undefined;

    ////Form our query string with the url
    var apiCallLink = "https://data.orghunter.com/v1/charitysearch?user_key=";
    apiCallLink += apiKey + "&latitude=" + lat + "&longitude=" + long +
    "&eligible=1" + "&rows=" + numResults;

    //Encode the url
    apiCallLink = encodeURIComponent(apiCallLink);

    //Attach our uri to the url to prevent CORS restrictions
    var url = uri + "?url=" + apiCallLink;

    //Make XMLHttpRequest
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      //Reset latitude and longitude for sunrise time
      currLat = 0;
      currLong = 0;

      //Remove old search results
      $('#resultsbox > div').fadeOut(200);

      //Parse new results
      parseCharities(xhr.responseText);
    };

    xhr.open('GET', url);
    xhr.send();
  }

  //Takes charity info, makes search result elements, and appends
  //them to the results box. Calls the sunrise time function
  function parseCharities(charities) {
    //Exit the function if there is no information
    if(!charities)
      return;

    //Parse the returned infomation
    charities = JSON.parse(charities);
    //Charity data is located in the .data property
    cData = charities.data;

    //If the returned infomation does not contain any charities
    if(!cData || cData.length == 0)
    {
      //Remove the old sun header
      removePreviousSun();

      //I kept this console dir in on purpose. Something should be printed
      // if the API servers are down
      if(charities.code === "500") {
        console.dir("The search failed because Orghunter's Charity Search API servers are down right now");
        return;
      }
    }

    //Set the city and state variables
    var city = cData[0].city;
    var state = cData[0].state;

    //Used for getting latitude/longitude of the returned charities
    var latLongLength = cData.length;

    //Iterate through the returned charities
    for(var i = 0; i < cData.length; i++) {
      //Add the charity's latitude/longitude to the total
      if(cData[i].latitude && cData[i].longitude) {
        currLat += parseFloat(cData[i].latitude);
        currLong += parseFloat(cData[i].longitude);
      }
      else
        latLongLength--; //If the charity doesn't provide latitude/longitude info, reduce latLongLength count

      //Set charity name text
      var charityName = cData[i].charityName;

      //Set charity category text
      var category = "Category: ";
      category += cData[i].category || "Not Provided";

      //Set donation url
      var donationUrl = cData[i].donationUrl;

      //Append a search result with the parameters given
      appendCharity( charityName, category, city, state, donationUrl);
    }

    //Average the latitude and longitude of all returned charities
    currLat /= latLongLength;
    currLong /= latLongLength;

    //Get the sunrise time of the given location
    getSunrise(currLat, currLong, city, state);
  }

  //Create search result with the given information and append it to the results box
  function appendCharity( cName, cat, city, state, url) {
    //Create elements for a search item and give them the neccesary classes
    var searchItemElement = document.createElement('div');
    searchItemElement.classList.add("searchItem");
    var siName = document.createElement('span');
    siName.classList.add("siName");
    var siCategory = document.createElement('span');
    siCategory.classList.add("siCategory");
    var siCityState = document.createElement('span');
    siCityState.classList.add("siCityState");
    var siLink = document.createElement('a');
    siLink.classList.add("siLink");
    siLink.target = "_blank";

    //Set the content of the search item elements
    siName.innerHTML = cName;
    siCategory.innerHTML = cat;
    siCityState.innerHTML = city + ", " + state;
    siLink.href = url;
    siLink.innerHTML = "Donation Link";

    //Append other elements to the search item
    searchItemElement.appendChild(siName);
    searchItemElement.appendChild(siCategory);
    searchItemElement.appendChild(siCityState);
    searchItemElement.appendChild(siLink);

    //Append search item to the search box
    resultsBox.appendChild(searchItemElement);
    //Fade element in
    $(searchItemElement).fadeIn();
  }

  //Get the sunrise time for the given latitude and longitude, Calls
  // a function to create and append a header with that information
  function getSunrise(lat, long, city, state) {
    //Form our query string with the url
    var apiCallLink = "https://api.sunrise-sunset.org/json?";
    apiCallLink += "&lat=" + lat + "&lng=" + long + "&date=tomorrow";
    //Encode the url
    apiCallLink = encodeURIComponent(apiCallLink);

    //Attach our uri to the url to prevent CORS restrictions
    var url = uri + "?url=" + apiCallLink;

    //Make XMLHttpRequest
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      //Create a sunrise header with the information given
      setSunHeader(xhr.responseText, city, state);
    }

    xhr.open('GET', url);
    xhr.send();
  }

  //Takes the returned sunrise information, converts it from CST to EST,
  //Appends a header with the returned and parsed information
  function setSunHeader(sunInfo, city, state) {
    //Remove old sun headers
    removePreviousSun();

    //Parse the returned sunrise info
    var sunTime = JSON.parse(sunInfo);

    //Grab json object of suntimes
    var sunTimes = sunTime.results;

    //Grab string containing the sunrise time in CST
    var sunRiseString = sunTimes.sunrise;

    //Break string into separate parts
    var hours = sunRiseString.substring(0, 2);
    var time;
    var ampm = sunRiseString.substring(sunRiseString.length - 2, sunRiseString.length);

    //Parse hours into an int, Grab the rest of the string (excluding AM/PM)
    if(hours[1] == ':') {
      hours = parseInt(hours[0]);
      time = sunRiseString.substring(1, sunRiseString.length - 2);
    }
    else {
      hours = parseInt(hours);
      time = sunRiseString.substring(2, sunRiseString.length - 2);
    }

    //Account for changing timezone
    hours -= 4;
    if(hours < 0 || hours >= 8) {
      if(hours < 0)
        hours = 12 + hours;
      if(ampm == "AM")
        ampm = "PM";
      else
        ampm = "AM";
    }

    //Put string back together
    var sunRiseString = hours + time + ampm;

    //Create header string with sunrise time in EST
    var sunString = "The sun will rise tomorrow at " + sunRiseString + "(EST) in "
    + city + ", " + state + ". Go make the world a better place.";

    //Create element withh sunrise information
    var sunHeader = document.createElement("h3");
    sunHeader.innerHTML = sunString;
    sunHeader.classList.add("sunHeader");

    //Append sunrise header
    container.appendChild(sunHeader);

    //Fade sunrise header in
    setInterval(function() {
      $(".sunHeader").show(400);
    }, 450);
  }

  //Fade old sunrise headers out
  function removePreviousSun() {
    if($(".sunHeader") != null) {
      $(".sunHeader").fadeOut(400, function(){$(this).remove();});
    }
  }

  //Resizes elements when the screene is resized
  function resize() {
    canvas.width = canvasContainer.offsetWidth;
    canvas.height = canvasContainer.offsetHeight;

    resultsBox.width = window.innerWidth * .9;

    if(window.innerWidth >= 550) {
      particleLineRange = 25;
      maxParticles = 250;
      preWarmCount = 150;
    }
    else {
      particleLineRange = 10;
      maxParticles = 150;
      preWarmCount = 100;
    }

    preWarmParticles();
  }

  //When the orientation changes, call the resize function
  // Then make a callback to the resize function to use updated element values
  function resizeOC() {
    resize();
    setTimeout( resize, 500);
  }

  window.onload = init;
  window.onresize = resize;
  window.addEventListener("orientationchange", resizeOC);
})();
