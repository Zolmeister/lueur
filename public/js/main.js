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

//initAudio(update)

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
  req.open("GET", "music/Beatles-A-Day.mp3", true);
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

function newLine() {
  console.log('add a line')
}

function update() {
  requestAnimationFrame(update);
  updateAudio()
}