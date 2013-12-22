var ctx; //audio context
var buf; //audio buffer
var fft; //fft audio node
var samples = 32;
var setup = false; //indicate if audio is set up yet


//init the sound system
function init() {
  console.log("in init");
  try {
    ctx = new webkitAudioContext(); //is there a better API for this?
    setupCanvas();
    loadFile();
  } catch (e) {
    alert('you need webaudio support' + e);
  }
}
window.addEventListener('load', init, false);

//load the mp3 file
function loadFile() {
  var req = new XMLHttpRequest();
  req.open("GET", "music/Beatles-A-Day.mp3", true);
  //we can't use jquery because we need the arraybuffer type
  req.responseType = "arraybuffer";
  req.onload = function () {
    //decode the loaded data
    ctx.decodeAudioData(req.response, function (buffer) {
      buf = buffer;
      play();
    });
  };
  req.send();
  console.log("loading the song");
}

//play the loaded file
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
  setup = true;
}

var gfx;

// moving average of 5 pts
var maxs = Array.apply([], new Array(32)).map(function(){return Array.apply([], new Array(5)).map(function(){return 0})})

function avg(arr) {
  var sum = 0
  for(var i=0;i<arr.length;i++)sum+=arr[i]
  return sum/arr.length
}

function max(arr) {
  return arr.reduce(function(a,b){return Math.max(a,b)})
}

function setupCanvas() {
  var canvas = document.createElement('canvas');
  canvas.width = 400
  canvas.height = 300
  document.body.appendChild(canvas)
  gfx = canvas.getContext('2d');
  webkitRequestAnimationFrame(update);
}

var cnt=0
var last = 0
function update() {
  webkitRequestAnimationFrame(update);
  if (!setup) return;
  //gfx.clearRect(0, 0, 800, 600);
  gfx.fillStyle = 'gray';
  gfx.fillRect(0, 0, 400, 300);

  var data = new Uint8Array(samples);
  fft.getByteFrequencyData(data);
  gfx.fillStyle = 'red';
  
  /*for (var i = 0; i < data.length; i++) {
    var x = i*3
    var h = data[i]
    var y = 300-h
    var w = 2
    gfx.fillRect(x, y, w, h)
    maxs[i].shift()
  }*/
  
  var av = avg(data)
  if(av-last > 2) console.log('b')
  last = av
  

}