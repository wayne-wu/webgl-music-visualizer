# Music Visualizer in WebGL

## Overview

[Live Demo](https://www.wuwayne.com/webgl-music-visualizer/) (Hit "Play Music" to start the visualizer)

![Teaser](img/neon.gif)

This project implements a neon-themed music visualizer using noise functions.
There are three spheres that are noised using fractal brownian motion with different settings.
Global settings that can control all three spheres are also exposed to the GUI.

All three spheres are rendered with lines for composing visual complexity.
In order to achieve the glow look, a bloom effect post process pipeline is implemented.

Audio is loaded using WebAudio API and the audio spectrum is used to drive the amplitude of the noise.

## Toolbox Functions

Toolbox functions that are used:

* Ease In (Quadratic) is used to amplify the audio signal to exaggerate peaks.
* Impulse is used on the amplitude to give a smoother fall-off.
* Bias is used such that when lerping between black and the neon color, it is biased towards the neon color.
* Smootherstep is used for quintic interpolation for Perlin noise.
* Gain is used in shading to cut off regions of the sphere based on light intensity.
