#version 300 es
precision highp float;


in vec2 fs_Pos;

out vec4 out_Col;

uniform sampler2D scene;

uniform bool u_Horizontal;
float weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main() {

  ivec2 size = textureSize(scene, 0);
  vec2 tex_offset = 1.0 / vec2(size.x, size.y);
  vec3 result = texture(scene, fs_Pos).rgb * weight[0];
  if(u_Horizontal)
  {
      for(int i = 1; i < 5; ++i)
      {
          result += texture(scene, fs_Pos + vec2(tex_offset.x * float(i), 0.0)).rgb * weight[i];
          result += texture(scene, fs_Pos - vec2(tex_offset.x * float(i), 0.0)).rgb * weight[i];
      }
  }
  else
  {
      for(int i = 1; i < 5; ++i)
      {
          result += texture(scene, fs_Pos + vec2(0.0, tex_offset.y *  float(i))).rgb * weight[i];
          result += texture(scene, fs_Pos - vec2(0.0, tex_offset.y *  float(i))).rgb * weight[i];
      }
  }

  out_Col = vec4(result, 1.0);
}
