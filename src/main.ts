import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Cube from './geometry/Cube';

import audioFile from "./assets/infinitysign.mp3";


// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 7,
  color: [ 0, 128, 255],
  scale: 1.5,
  persistence: 0.75,
  displacement: 0.1,
  frequency: 0.1,
  'Load Scene': loadScene, // A function pointer, essentially
  'Play Music': playMusic,
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;

let audioContext : AudioContext;
let audioElement: HTMLAudioElement;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  // square = new Square(vec3.fromValues(0, 0, 0));
  // square.create();
  cube = new Cube(vec3.fromValues(0,0,0));
  cube.create();
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
  const dataArray = new Uint8Array(bufferLength);
  audioAnalyser.getByteFrequencyData(dataArray);

  track.connect(audioAnalyser);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.addColor(controls, "color");
  const noise_gui = gui.addFolder("noise");
  noise_gui.add(controls, 'persistence', 0, 1);
  noise_gui.add(controls, 'scale', 0, 5);
  const jitter_gui = gui.addFolder("jitter");
  jitter_gui.add(controls, "displacement", 0, 1);
  jitter_gui.add(controls, "frequency", 0, 2);
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

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const custom = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ])

  var time = 0;

  // This function will be called every frame
  function tick() {
    time++;

    // audio
    audioAnalyser.getByteFrequencyData(dataArray);
    
    let average: number = 0.0;
    for(var i = 0; i < audioAnalyser.frequencyBinCount; i++)
    {
        average += dataArray[i]/256.0;
    }
    average /= dataArray.length;

    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    custom.setNoise(controls.scale, controls.persistence);
    custom.setGeometryColor(vec4.fromValues(
      controls.color[0]/255., controls.color[1]/255., controls.color[2]/255., 1.0));  
    custom.setJitter(controls.displacement, controls.frequency);
    custom.setTime(time);
    custom.setAudio(average);

    renderer.render(camera, custom, [
      icosphere,
      // square,
    ]);
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
