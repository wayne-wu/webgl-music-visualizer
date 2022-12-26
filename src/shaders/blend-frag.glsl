#version 300 es
precision highp float;


uniform float u_Time;
uniform float u_Glow;

in vec2 fs_Pos;

out vec4 out_Col;

uniform sampler2D scene;
uniform sampler2D blurred;

void main() {
  
  float exposure = 2.0;
  float gamma = u_Glow;
  vec3 color = texture(scene, fs_Pos).rgb;
  vec3 bloom = texture(blurred, fs_Pos).rgb;

  color += bloom;

  vec3 result = vec3(1.0) - exp(-color * exposure);
  result = pow(result, vec3(1.0 / gamma));

  out_Col = vec4(result, 1.0);
}
