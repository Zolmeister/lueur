// shims

// audio context shim
window.AudioCtx = (function () {
  return window.webkitAudioContext || window.AudioContext
})()

// requestAnimationFrame polyfill
/*(function () {
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function (callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
}());
*/
var context, buf, fft, filter, samples = 2048,
  setup = false, particleCount = 2048;

var stats, scene, renderer;
var camera, cameraControl, particles, particleSystem;
var clock = new THREE.Clock();
var uniforms = {
  time: {
    type: 'f',
    value: 0.0
  }
};
var GuiParams = function () {
  this.frequency = 0.95;
  this.rings = 40;
};

var guiParams = new GuiParams();

if (!init()) animate();

// init the scene
function init() {
  console.log("init()");
  initAudio();

  if (Detector.webgl) {
    renderer = new THREE.WebGLRenderer({
      antialias: true, // to get smoother output
    });
    renderer.setClearColorHex(0x112233, 1);
    // uncomment if webgl is required
  } else {
    Detector.addGetWebGLMessage();
    return true;
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('container').appendChild(renderer.domElement);

  // add Stats.js - https://github.com/mrdoob/stats.js
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.bottom = '0px';
  document.body.appendChild(stats.domElement);

  // create a scene
  scene = new THREE.Scene();

  // put a camera in the scene
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(0, 0, 5);
  scene.add(camera);

  // create a camera control
  cameraControls = new THREEx.DragPanControls(camera);

  // transparently support window resize
  THREEx.WindowResize.bind(renderer, camera);

  // here you add your objects
  var particleMaterial = new THREE.ParticleBasicMaterial({
    map: THREE.ImageUtils.loadTexture(
      "images/particle01.png"
    ),
    blending: THREE.AdditiveBlending,
    transparent: true,
    color: 0x404040,
    depthTest: false
  });

  particles = new THREE.Geometry();
  for (var p = 0; p < particleCount; p++) {
    var pos = (p * 5 / particleCount) - 2.5;
    vertex = new THREE.Vector3(pos, 0, 0);
    particles.vertices.push(new THREE.Vertex(vertex));
  }

  //particles.rotation = new THREE.Vector3(0, 0, 0);

  particleSystem = new THREE.ParticleSystem(particles, particleMaterial);
  particleSystem.sortParticles = true;
  scene.add(particleSystem);

  initGUI();
}

function initGUI() {
  var gui = new dat.GUI();
  gui.add(guiParams, 'frequency', 0.0, 1.0);
  gui.add(guiParams, 'rings', 0, 60);

}

// animation loop
function animate() {
  // loop on request animation loop
  // - it has to be at the begining of the function
  // - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
  requestAnimationFrame(animate);

  // do the render
  render();

  // update stats
  stats.update();
}

// render the scene
function render() {
  var delta = clock.getDelta();
  if (setup) {
    var data = new Float32Array(samples);
    fft.getFloatFrequencyData(data);
    var offset = -80;
    var range = 80;
    var count = data.length / 4;
    var rings = guiParams.rings;
    var averageStrength = 0;

    for (var i = 0; i < particleCount; i++) {
      var bin = i * count / particleCount;
      var index = Math.floor(bin);
      var weight = bin - index;
      var relativeStrength = ((data[index] * (1 - weight) + data[index + 1] * weight - offset) / range);
      averageStrength += relativeStrength / particleCount;
      var radius = 0.25 + 5 * Math.max(Math.min(relativeStrength, 1.0), 0.0) * (0.4 + 0.6 * i / particleCount);
      var lap = Math.floor(i * rings / particleCount);
      particles.vertices[i].position.x = lap * 6 / (rings - 1) - 3;
      particles.vertices[i].position.y = Math.sin(i * 2 * rings * Math.PI / particleCount) * radius;
      particles.vertices[i].position.z = Math.cos(i * 2 * rings * Math.PI / particleCount) * radius;
    }
    particleSystem.rotation.x += (averageStrength - 0.05) * delta * 10;
    particleSystem.rotation.z = Math.sin(particleSystem.rotation.x * 0.017) * 0.25;
    particleSystem.rotation.y = Math.sin(particleSystem.rotation.x * 0.034) * 0.15;

    filter.frequency.value = 22.5 * Math.pow(2, guiParams.frequency * 128 / 12);
  }

  // actually render the scene
  renderer.render(scene, camera);
}

// gotten the audio stuff from http://joshondesign.com/p/books/canvasdeepdive/chapter12.html
function initAudio() {
  try {
    console.log("initAudio()");
    context = new webkitAudioContext(); //is there a better API for this?
    loadFile();
  } catch (e) {
    alert('you need webaudio support');
  }
}

//load and decode mp3 file
function loadFile() {
  var req = new XMLHttpRequest();
  req.open("GET", "music/Beatles-A-Day.mp3", true);
  req.responseType = "arraybuffer";
  req.onload = function () {
    //decode the loaded data
    context.decodeAudioData(req.response, function (buffer) {
      buf = buffer;
      play();
    });
  };
  req.send();
}

//play the loaded file
function play() {
  //create a source node from the buffer
  var source = context.createBufferSource();
  source.buffer = buf;

  //create fft
  fft = context.createAnalyser();
  fft.fftSize = samples;

  //connect them up into a chain
  filter = context.createBiquadFilter();
  filter.type = 0;
  filter.frequency.value = 220;

  // Create the audio graph.
  source.connect(filter);
  filter.connect(fft);
  fft.connect(context.destination);

  //play immediately
  source.noteOn(0);
  setup = true;
}