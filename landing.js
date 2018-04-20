// Google Maps Geocoding API
// AIzaSyBcK8Z27bIiwV_JXmDD8DsNXFB31BxBsx0

'use strict';

//IIFE
(function () { 
    
    var particleOverlayColor = "#80D0E5";
    var previousUpdateTime = undefined;
    var animationID = 0;
    var canvas = undefined;
    var ctx = undefined;
    var canvasContainer = undefined;
    
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
        canvas = document.querySelector('canvas');
        ctx = canvas.getContext('2d');
        canvasContainer = document.querySelector('header');
        
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
    	ctx.fillText("Bubble Pheonix", canvas.width / 2, 20);
    	
    	//ctx.fillStyle = "cyan";
        //ctx.shadowColor = "pink";
        ctx.shadowBlur = 10;
    	ctx.font = "2em 'Yellowtail'";
    	ctx.fillText("You can do some good", canvas.width / 2, 90);
        ctx.restore();
        
        //Schedule call to update
        requestAnimationFrame(update);
    }
    
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
            //console.dir(particles);
        }
    }

    function resize() {
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

