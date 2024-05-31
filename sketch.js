let particles; // Declare a variable to store the array of particle objects
let img = []; // Declare an array to store images
let n, s, maxR; // Declare variables for the number of particles, size, and maximum radius
let indexImg = 0; // Declare a variable to track the index of the current image
let capture; // Declare a variable to store the webcam capture
let useWebcam = false; // Declare a variable to control whether webcam input is used
let webcamButton; // Declare a variable to store the button for toggling webcam input
let captureImg; // Declare a variable to store captured images from the webcam
let countdown = 0; // Declare a variable for the countdown timer
let captureTime = 3; // Declare a variable for the capture duration
let backButton; // Declare a variable for the back button
let poseExample; // Declare a variable to store the example pose image
let song; // Declare a variable to store the audio file
let fft; // Declare a variable for Fast Fourier Transform (FFT) analysis of the audio
let playButton, pauseButton; 

function preload() {
  img.push(loadImage('assets/Edvard_Munch_The_Scream.jpeg')); // Preload the image "The Scream"
  poseExample = loadImage('assets/2.jpg'); // Preload the example pose image
  song = loadSound('assets/Dennis Kuo - Track in Time.mp3'); // Preload the audio file
}

function setup() {
  createCanvas(windowWidth, windowHeight); 
  background("#FFEDDA"); // Set the canvas background color
  smooth(); // Enable anti-aliasing

  n = 10000; // Set the number of particles
  s = 15; // Set the size of the particles
  maxR = min(width, height) / 2 - min(width, height) / 20; // Calculate the maximum radius for the particles

  particles = []; // Initialize the particles array

  //Get help from https://www.youtube.com/watch?v=G3WxVV7aN4I
  capture = createCapture(VIDEO); // Create a video capture element
  capture.size(windowWidth, windowHeight); // Set the capture size
  capture.hide(); // Hide the video capture element

  createButtonUI(); // Create the button UI
  fft = new p5.FFT(); // Initialize the FFT object and get help from Chatgpt

  initParticles(); // Initialize the particles
}

function draw() {
  background("#FFEDDA"); 
  translate(width / 2, height / 2); // Move the origin to the center of the canvas
  noStroke(); // Disable stroke

  if (countdown > 0) {
    clear(); // Clear the canvas
    fill(0); // Set the fill color to black
    textSize(32); // Set the text size
    textAlign(CENTER, CENTER); // Set the text alignment
    text(`Switching in ${ceil(countdown)}`, 0, -height / 2 + 40); // Display the countdown
    textSize(24); // Set the text size
    text("We will capture your image, please pose as you like", 0, -height / 2 + 80); // Display a prompt

    // Draw the example pose image
    let imgX = -poseExample.width / 2;
    let imgY = -height / 2 + 120;
    image(poseExample, imgX, imgY);

    countdown -= deltaTime / 1000; // Update the countdown
    if (countdown <= 0) {
      captureImg = capture.get(); // Capture the image
      useWebcam = true; // Set to use the webcam
      initParticles(); // Reinitialize the particles
    }
  } else {
    if (s > 1) {
      if (particles.length != 0) {
        for (let i = 0; i < particles.length; i++) {
          let p = particles[i];
          p.show(); // Show the particle
          p.move(); // Move the particle

          if (p.isDead()) particles.splice(i, 1); // Remove the particle if it is dead
        }
      } else {
        s -= 2; // Reduce the particle size
        initParticles(); // Reinitialize the particles
      }
    }

    // Draw rectangles based on FFT analysis
    drawRectangles();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Adjust the canvas size
  maxR = min(width, height) / 2 - min(width, height) / 20; // Recalculate the maximum radius
  particles = []; // Clear the particles array
  initParticles(); // Reinitialize the particles
  createButtonUI(); // Recreate the button UI
}

function initParticles() {
  particles = []; // Clear the old particles array
  for (let i = 0; i < n; i++) {
    let p = new Particle(maxR, s);
    let x, y, c;
    if (useWebcam && captureImg) {
      x = int(map(p.pos.x, -maxR, maxR, 0, captureImg.width));
      y = int(map(p.pos.y, -maxR, maxR, 0, captureImg.height));
      c = captureImg.get(x, y); // Get the color from the captured image
    } else {
      x = int(map(p.pos.x, -maxR, maxR, 0, img[indexImg].width));
      y = int(map(p.pos.y, -maxR, maxR, 0, img[indexImg].height));
      c = img[indexImg].get(x, y); // Get the color from the default image
    }
    p.c = c; // Set the particle's color
    particles.push(p); // Add the particle to the array
  }
}

function createButtonUI() {
  if (webcamButton) webcamButton.remove(); // Remove the old button and get help from Chatgpt
  webcamButton = createButton('Use Webcam');
  webcamButton.position(20, 20);
  webcamButton.mousePressed(startWebcamCapture); // Bind the button click event

  if (backButton) backButton.remove(); // Remove the old button
  backButton = createButton('Back to Default Image');
  backButton.position(20, 60); // Adjust the position
  backButton.mousePressed(backToDefaultImage); // Bind the button click event

  // Create the play button
  if (playButton) playButton.remove();
  playButton = createButton('Play Music');
  playButton.position(windowWidth - 200, 20);
  playButton.mousePressed(startMusic); // Bind the button click event

  // Create the pause button
  if (pauseButton) pauseButton.remove();
  pauseButton = createButton('Pause Music');
  pauseButton.position(windowWidth - 200, 60);
  pauseButton.mousePressed(pauseMusic); // Bind the button click event
}

function startWebcamCapture() {
  countdown = captureTime; // Set the countdown
  useWebcam = false; // Set to not use the webcam
  initParticles(); // Reinitialize the particles for the webcam view
}

function backToDefaultImage() {
  useWebcam = false; // Set to not use the webcam
  initParticles(); // Reinitialize the particles for the default view
}

function startMusic() {
  if (!song.isPlaying()) {
    song.loop(); // Play the music
  }
}

function pauseMusic() {
  if (song.isPlaying()) {
    song.pause(); // Pause the music
  }
}

class Particle {
  constructor(maxR, s) {
    this.s = s; // Particle size
    this.maxR = maxR; // Particle maximum radius
    this.c = ""; // Particle color
    this.life = 250; // Particle lifespan
    this.init(); // Initialize the particle
  }

  init() {
    this.pos = p5.Vector.random2D(); // Random direction vector
    this.pos.normalize(); // Normalize the vector
    this.pos.mult(random(2, this.maxR)); // Scale the vector by the maximum radius
    this.vel = p5.Vector.random2D(); // Random velocity vector
    this.vel.mult(0.2); // Adjust the speed range
  }

  show() {
    fill(this.c); // Use the particle color to fill
    ellipse(this.pos.x, this.pos.y, this.s); // Draw the particle
    this.life -= 1; // Decrease the particle lifespan
  }

  move() {
    this.pos.add(this.vel); // Update the particle position
  }

  isDead() {
    return this.pos.mag() > this.maxR || this.life < 1; // Check if the particle is dead
  }
}

//Get help from https://www.youtube.com/watch?v=2O3nm0Nvbi4
function drawRectangles() {
  let spectrum = fft.analyze(); // Get the spectrum data
  let rectCount = 20; // Number of rectangles
  let angleStep = TWO_PI / rectCount; // Calculate the angle step
  for (let i = 0; i < rectCount; i++) {
    let angle = i * angleStep; // Calculate the current angle
    let amp = spectrum[i]; // Get the current spectrum amplitude
    let rectHeight = map(amp, 0, 300, 10, 200); // Map the rectangle height
    let x = maxR * cos(angle); // Calculate the x-coordinate
    let y = maxR * sin(angle); // Calculate the y-coordinate
    push();
    translate(x, y); // Move to the new position
    rotate(angle); // Rotate to the current angle
    fill(255, 127, 80, 50); // Set the fill color
    rect(0, 0, 10, rectHeight); // Draw the rectangle
    pop();
  }
}