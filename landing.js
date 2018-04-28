// Google Maps Geocoding API
// AIzaSyBcK8Z27bIiwV_JXmDD8DsNXFB31BxBsx0

'use strict';

//IIFE
(function () {

    var particleOverlayColor = "#80D0E5";
    var previousUpdateTime = undefined;
    var animationID = 0;
    var container = undefined;
    var canvas = undefined;
    var ctx = undefined;
    var canvasContainer = undefined;
    var searchButton = undefined;
    var queryBox = undefined;
    var resultsBox = undefined;

    var cData = undefined;
    var previousSearchTerm = undefined;
    var numResults = 25;

    var currLat = 0;
    var currLong = 0;
    var cityStateString = undefined;

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
    var particleSize = 4;
    var particleSpeed = 10;
    var particleTimer = 0;
    var particles = []; //Array of particle objects


    function init() {
        container = document.querySelector('#container');
        canvas = document.querySelector('canvas');
        ctx = canvas.getContext('2d');
        canvasContainer = document.querySelector('header');
        searchButton = document.querySelector('#searchbutton');
        queryBox = document.querySelector('input');
        resultsBox = document.querySelector('#resultsbox');

        searchButton.onclick = performSearch;

        //Set canvas to fit container size
        canvas.width = canvasContainer.offsetWidth;
        canvas.height = canvasContainer.offsetHeight;

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

        update();
    }

    function update() {
        //Check Time Passed
        var dt = calculateDeltaTime();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        //Draw overlay
        ctx.fillStyle = particleOverlayColor;
        ctx.fillRect( 0, 0, canvas.width, canvas.height);

        //Draw Particles and Lines
        ctx.globalAlpha = 1;
        drawParticles(ctx);
        drawParticleLines(ctx);
        createParticles(dt);
        moveParticles(dt, particleSpeed);

        ctx.save();

        //Draw text
        ctx.globalAlpha = 1;
        ctx.textAlign = "center";
      	ctx.textBaseline = "top";
      	ctx.fillStyle = "pink";
        ctx.shadowColor = "#26466D";
        ctx.shadowBlur = 10;
      	ctx.font = "3em 'Jua', 'Comfortaa'";
      	ctx.fillText("Bubble Phoenix", canvas.width / 2, 20);

    	   //ctx.fillStyle = "cyan";
        //ctx.shadowColor = "pink";
        ctx.shadowBlur = 10;
      	ctx.font = "2em 'Yellowtail'";
      	ctx.fillText("You can do some good", canvas.width / 2, 90);
        ctx.restore();

        //Schedule call to update
        requestAnimationFrame(update);
    }



    //Helper Functions

    //Returns the time passed since the last time this function has been called
    function calculateDeltaTime() {
  		var now,fps;
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




    //Particle Functions

	//Iterates through the array of particles and draws them at their current location
	function drawParticles(ctx) {
	    ctx.save();

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

	function drawParticleLines() {
	    ctx.save();

	    ctx.strokeStyle = particleLineColor;
	    ctx.shadowBlur = 5;
	    ctx.shadowColor = particleLineShadowColor;

	    for(var i = 0; i < particles.length; i++) {
	        for(var j = 0; j < particles.length; j++) {
	            if(i == j)
	                continue;

	            var xDist = Math.abs(particles[i].x - particles[j].x);
	            var yDist = Math.abs(particles[i].y - particles[j].y);

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
	        if(particles[i].x < 0 || particles[i] > canvasContainer.offsetWidth
	        || particles[i].y < 0 || particles[i].y > canvasContainer.offsetHeight)
	        {
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



    //Search Functions

    function performSearch() {
        //Grab search term
        var searchTerm = queryBox.value;

        //Prevent searching for a query that is currently displayed
        if(!searchTerm || searchTerm.length === 0 || searchTerm == previousSearchTerm)
            return;

        previousSearchTerm = searchTerm;

        //Parse string and split it into our search terms
        var queries = searchTerm.split(", ");
        var city = queries[0];
        var state = queries[1];

        //Make API request
        var apiCallLink = "https://data.orghunter.com/v1/charitysearch?user_key=";
        apiCallLink += apiKey + "&city=" + city + "&state=" + state +
        "&eligible=1" + "&rows=" + numResults;

        apiCallLink = encodeURIComponent(apiCallLink);

        var url = uri + "?url=" + apiCallLink;

        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
          //parseCharities(xhr.responseText);

          var oldResults = resultsbox.children;
          var numOldResults = oldResults.length;

          //Fade out results and call the charity parsing function when the
          //last element fades
          var fade = 0;
          for(var result of oldResults) {
            fade += 20;
            $(result).fadeOut(200 + fade);
          }

          currLat = 0;
          currLong = 0;

          parseCharities(xhr.responseText);

        };

        xhr.open('GET', url);
        xhr.send();
    }

    function parseCharities(charities) {
      if(!charities)
        return;

      charities = JSON.parse(charities);
      cData = charities.data;

      if(!cData || cData.length == 0)
      {
        removePreviousSun();

        //I kept this console dir in on purpose. Something should be printed
        // if the API servers are down

        if(charities.code === "500")
          console.dir("The search failed because Orghunter's Charity Search API servers are down right now");
        return;
      }

      var city = cData[0].city;
      var state = cData[0].state;
      var latLongLength = cData.length;

      for(var i = 0; i < cData.length; i++) {
        if(cData[i].latitude && cData[i].longitude) {
          currLat += parseFloat(cData[i].latitude);
          currLong += parseFloat(cData[i].longitude);
        }
        else
          latLongLength--;

        var charityName = cData[i].charityName;

        var category = "Category: ";
        category += cData[i].category || "Not Provided";

        var donationUrl = cData[i].donationUrl;

        appendCharity( charityName, category, city, state, donationUrl);
      }

      currLat /= latLongLength;
      currLong /= latLongLength;

      getSunrise(currLat, currLong, city, state);
    }

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
    }

    function getSunrise(lat, long, city, state) {
      var apiCallLink = "https://api.sunrise-sunset.org/json?";
      apiCallLink += "&lat=" + lat + "&lng=" + long + "&date=tomorrow";
      apiCallLink = encodeURIComponent(apiCallLink);

      var url = uri + "?url=" + apiCallLink;

      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        setSunHeader(xhr.responseText, city, state);
      }

      xhr.open('GET', url);
      xhr.send();
    }

    function setSunHeader(sunInfo, city, state) {
      removePreviousSun();

      var sunTime = JSON.parse(sunInfo);

      var sunTimes = sunTime.results;

      console.dir(sunTimes);

      var sunRiseString = sunTimes.sunrise;

      var hours = sunRiseString.substring(0, 2);
      var time;
      var ampm = sunRiseString.substring(sunRiseString.length - 2, sunRiseString.length);

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
      if(hours < 0) {
        hours = 12 + hours;
        if(ampm == "AM")
          ampm = "PM";
        else
          ampm = "AM";
      }

      var sunRiseString = hours + time + ampm;

      var sunString = "The sun will rise tomorrow at " + sunRiseString + "(EST) in "
      + city + ", " + state + ". Go make the world a better place.";

      var sunHeader = document.createElement("h3");
      sunHeader.innerHTML = sunString;
      sunHeader.classList.add("sunHeader");

      container.appendChild(sunHeader);

      setInterval(function() {
        $(".sunHeader").show(400);
      }, 450);
    }

    function removePreviousSun() {
      if($(".sunHeader") != null) {
        $(".sunHeader").fadeOut(400, function(){$(this).remove();});
      }
    }

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
