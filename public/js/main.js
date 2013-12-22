// shims

// audio context shim

// requestAnimationFrame polyfill
(function () {
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

function avg(arr) {
  var sum = 0
  for(var i=0;i<arr.length;i++)sum+=arr[i]
  return sum/arr.length
}

// config
var fft;
var last = 0;
var samples = 32;

// webGL vars
var renderer, camera, scene, pointLight, composer;
var lines=[];
//initAudio(update)

initWebGL()
initAudio(update)
//newLine(.3)
//composer.render()
//update()

//var z = 0;

function initWebGL() {
  var z = 0
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor('#000000')
  document.body.appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
  camera.position.set(0, 0, 50);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene = new THREE.Scene();

  // create a point light
  pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.z = camera.position.z - 20
  scene.add(pointLight)
  
  composer = new THREE.EffectComposer(renderer);
  var renderPass = new THREE.RenderPass(scene, camera)
  composer.addPass(renderPass);
  var glow = new THREE.ShaderPass(THREE.GlowShader)
  glow.renderToScreen = true
  composer.addPass(glow)
  //composer.render()
}

function line(x, z) {
  var material = new THREE.MeshPhongMaterial({
    color: 0x0066ff,
    opacity: .8,
    transparent: true
  })
  //var geometry = new THREE.CylinderGeometry(.1, .1, 40, 50, 50, false)
  var geometry = new THREE.CubeGeometry(1,100,1)
  var mesh = new THREE.Mesh(geometry, material)
  mesh.position.x = x/2
  mesh.position.z = z
  mesh.rotation.z = z
  return mesh
}

function newLine(n) {
  var l = line(n, camera.position.z - 50)
  lines.push(l)
  scene.add(l);
}

/*setInterval(function() {
  newLine(Math.random())
}, 500)*/

function updateWebGL() {
  //requestAnimationFrame(animate)
  camera.position.z -= .5
  pointLight.position.z -= .5
  if(lines[0] && lines[0].position.z > pointLight.position.z - 5) {
    //console.log('rm line')
    scene.remove(lines[0])
    lines.shift()
  }
  //renderer.render(scene, camera);
  composer.render()
}



// this (overloaded) function creates a new web audio context,
// fills it with a song, and creates a global fft object with the data
function initAudio(cb) {
  var buf;

  // get web audio context
  try {
    var ctx = new window.webkitAudioContext();
  } catch (e) {
    return alert('you need webaudio support' + e);
  }

  // get song
  var req = new XMLHttpRequest();
  req.open("GET", "music/spoon-camera.mp3", true);
  //we can't use jquery because we need the arraybuffer type
  req.responseType = "arraybuffer";
  req.onload = function () {
    //decode the loaded data
    ctx.decodeAudioData(req.response, function (buffer) {
      buf = buffer;
      console.log('song loaded')
      play();
      cb()
    });
  };
  req.send();
  console.log("loading the song");

  // start playing song
  function play() {
    //create a source node from the buffer
    var src = ctx.createBufferSource();
    src.buffer = buf;

    //create fft
    fft = ctx.createAnalyser();
    fft.fftSize = samples;

    //connect them up into a chain
    src.connect(fft);
    fft.connect(ctx.destination);

    //play immediately
    src.noteOn(0);
  }
}

function updateAudio() {
  var data = new Uint8Array(samples);
  fft.getByteFrequencyData(data);
  var av = avg(data)
  if(av-last > 2) newLine(av)
  last = av
}

function update() {
  requestAnimationFrame(update);
  updateAudio()
  updateWebGL()
}