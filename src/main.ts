import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL, gl} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Cube from './geometry/Cube';

import audioFile from "./assets/infinitysign.mp3";


// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  color: [ 255, 0, 0],
  scale: 1.5,
  persistence: 0.75,
  octaves: 4,
  'Load Scene': loadScene, // A function pointer, essentially
  'Play Music': playMusic,
};

let outtersphere: Icosphere;
let innersphere: Icosphere;
let square: Square;

let audioContext : AudioContext;
let audioElement: HTMLAudioElement;

function loadScene() {
  outtersphere = new Icosphere(vec3.fromValues(0, 0, 0), 1.1, 3, gl.LINE_STRIP);
  outtersphere.create();

  innersphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, 8, gl.TRIANGLES);
  innersphere.create();

  square = new Square(vec3.fromValues(0,0,0));
  square.create();
}

function playMusic() {
  if (audioContext.state === 'suspended'){
    audioContext.resume();
  }

  audioElement.play();
}


function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);


  audioContext = new AudioContext();

  audioElement = new Audio(audioFile);

  const track = audioContext.createMediaElementSource(audioElement);
  track.connect(audioContext.destination);

  const audioAnalyser = audioContext.createAnalyser();
  audioAnalyser.fftSize = 2048;

  const bufferLength = audioAnalyser.frequencyBinCount;
  const freqDomain = new Uint8Array(bufferLength);
  const timeDomain = new Uint8Array(bufferLength);
  audioAnalyser.getByteFrequencyData(freqDomain);
  audioAnalyser.getByteTimeDomainData(timeDomain);

  track.connect(audioAnalyser);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.addColor(controls, "color");
  const noise_gui = gui.addFolder("noise");
  noise_gui.add(controls, 'persistence', 0, 1);
  noise_gui.add(controls, 'scale', 0, 5);
  noise_gui.add(controls, 'octaves', 1, 10).step(1);
  gui.add(controls, 'Load Scene');
  gui.add(controls, 'Play Music');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.0, 0.0, 0.0, 1);
  gl.enable(gl.DEPTH_TEST);

  const fireball = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fire-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fire-frag.glsl')),
  ])

  const line = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/line-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/line-frag.glsl')),
  ])

  const bg = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/bg-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/bg-frag.glsl')),
  ])


  const blur = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/blur-frag.glsl')),
  ])

  const quad = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/quad-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/blend-frag.glsl')),
  ])

  var time = 0;

  const fbo = gl.createFramebuffer();

  const colorTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 
    0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  const brightTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, brightTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 
    0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);
  gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, brightTex, 0);
  
  const rboDepth = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, rboDepth);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, window.innerWidth, window.innerHeight);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rboDepth);
  gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  let blurFBOs = new Array<WebGLFramebuffer>(2);
  let blurTexs = new Array<WebGLTexture>(2);

  blurFBOs[0] = gl.createFramebuffer();
  blurFBOs[1] = gl.createFramebuffer();
  blurTexs[0] = gl.createTexture();
  blurTexs[1] = gl.createTexture();

  for(var i = 0; i < 2; i++)
  {
    gl.bindFramebuffer(gl.FRAMEBUFFER, blurFBOs[i]);
    gl.bindTexture(gl.TEXTURE_2D, blurTexs[i]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 
      0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, blurTexs[i], 0);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  blur.use();
  gl.uniform1i(gl.getUniformLocation(blur.prog, "scene"), 0);

  quad.use();
  gl.uniform1i(gl.getUniformLocation(quad.prog, "scene"), 0);
  gl.uniform1i(gl.getUniformLocation(quad.prog, "blurred"), 1);

  // This function will be called every frame
  function tick() {
    time++;

    // audio
    audioAnalyser.getByteFrequencyData(freqDomain);
    audioAnalyser.getByteTimeDomainData(timeDomain);
    
    let freqAvg: number = 0.0;
    let timeAvg: number = 0.0;
    for(var i = 0; i < audioAnalyser.frequencyBinCount; i++)
    {
      freqAvg += freqDomain[i];
      timeAvg += timeDomain[i];
    }
    freqAvg /= (freqDomain.length*256.0);
    timeAvg /= (timeDomain.length*256.0);

    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    renderer.clear();

    // Render main scene
    fireball.setNoise(controls.scale, controls.persistence, controls.octaves);
    fireball.setGeometryColor(vec4.fromValues(
      controls.color[0]/255., controls.color[1]/255., controls.color[2]/255., 1.0));  
    fireball.setTime(time);
    fireball.setAudio(freqAvg, timeAvg);

    line.setNoise(controls.scale, controls.persistence, controls.octaves);
    line.setGeometryColor(vec4.fromValues(
      controls.color[0]/255., controls.color[1]/255., controls.color[2]/255., 1.0));  
    line.setTime(time);
    line.setAudio(freqAvg, timeAvg);

    renderer.render(camera, line, [
      outtersphere,
    ]);

    renderer.render(camera, fireball, [
      innersphere,
    ])

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Blurring render pipeline
    var horizontal = true, first_iteration = true;
    var amount = 10;
    blur.use();
    renderer.clear();

    var loc = gl.getUniformLocation(blur.prog, "u_Horizontal");
    for (var i = 0; i < amount; i++)
    {
      var idx = Number(horizontal);
      gl.bindFramebuffer(gl.FRAMEBUFFER, blurFBOs[idx]);
      gl.uniform1i(loc, idx);
      gl.bindTexture(gl.TEXTURE_2D, first_iteration? brightTex : blurTexs[Number(!horizontal)]);

      renderer.render(camera, blur, [
        square
      ]);

      horizontal = !horizontal;
      first_iteration = false;
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    renderer.clear();
    quad.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, blurTexs[Number(!horizontal)]);

    renderer.render(camera, quad, [
      square,
    ]);

    // // background
    // gl.depthFunc(gl.LEQUAL);
    // renderer.render(camera, bg, [
    //   square,
    // ]);

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
