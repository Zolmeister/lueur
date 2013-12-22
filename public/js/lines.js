var renderer, camera, scene, pointLight, composer;
var z = 0;

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor('#000000')
  document.body.appendChild(renderer.domElement);
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
  camera.position.set(0, 0, 50);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene = new THREE.Scene();
  
  
  scene.add(line(-10, z));
  scene.add(line(10, z));
  z -= 20
  scene.add(line(-10, z));
  scene.add(line(10, z));
  z -= 20
  scene.add(line(-10, z));
  scene.add(line(10, z));
  //z = Math.PI/2-20*Math.PI
  scene.add(line(10, z));

  // create a point light
  pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.z = camera.position.z - 20
  scene.add(pointLight)
  // add to the scene

  //renderer.render(scene, camera)
  composer = new THREE.EffectComposer(renderer);
  var renderPass = new THREE.RenderPass(scene, camera)
  var copyPass = new THREE.ShaderPass(THREE.CopyShader);
  //copyPass.renderToScreen = true;
  composer.addPass(renderPass);
  //composer.addPass(copyPass);
  //composer.render()
  //var hblur = new THREE.ShaderPass(THREE.HorizontalBlurShader);
  //composer.addPass(hblur);

  //var vblur = new THREE.ShaderPass(THREE.VerticalBlurShader);
  // set this shader pass to render to screen so we can see the effects
  //vblur.renderToScreen = true;
  //composer.addPass(vblur);
  var glow = new THREE.ShaderPass(THREE.GlowShader)
  glow.renderToScreen = true
  composer.addPass(glow)
  animate()
  composer.render()
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
  mesh.position.x = x
  mesh.position.z = z
  mesh.rotation.z = z
  return mesh
}

/*setInterval(function() {
  scene.add(line(10, z))
  z -= 10
}, 300)*/

function animate() { return
  requestAnimationFrame(animate)
  camera.position.z -= .5
  pointLight.position.z -= .5
  //renderer.render(scene, camera);
  composer.render()
}

window.onload = init