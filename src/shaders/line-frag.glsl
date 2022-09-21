#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform float u_Time;
uniform vec4 u_Color; // The color with which to render this instance of geometry.

uniform float u_FBMScale;
uniform float u_FBMPersistence;
uniform float u_FBMOctaves;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

in float fs_Disp;

layout (location = 0) out vec4 out_Col;
layout (location = 1) out vec4 out_BrightCol;

float bias(float t, float b) 
{
    return t/((((1.0/b)-2.0)*(1.0-t))+1.0);
}

void main() 
{
    // Material base color (before shading)
    vec4 diffuseColor = u_Color;
    diffuseColor.xyz = mix(vec3(1.0), u_Color.xyz, bias(fs_Disp, 0.75));

    // Compute final shaded color
    out_Col = diffuseColor;
    out_BrightCol = diffuseColor;
    
    // float brightness = dot(out_Col.rgb, vec3(0.2126, 0.7152, 0.0722));
    // if (brightness > 1.0)
    //     out_BrightCol = vec4(out_Col.rgb, 1.0);
    // else
    //     out_BrightCol = vec4(0.0, 0.0, 0.0, 1.0);
}