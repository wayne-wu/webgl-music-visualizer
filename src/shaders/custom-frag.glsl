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
uniform float u_NoiseScale;
uniform float u_NoisePersistence;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

in float fs_Disp;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

// Hash functions are taken from IQ's shadertoy examples
float hash(vec3 p)
{
    p  = fract( p*0.3183099+.1 );
	p *= 17.0;
    return fract( p.x*p.y*p.z*(p.x+p.y+p.z) );
}

vec3 hash3( vec3 p )
{
	p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float trilinear(float a, float b, float c, float d, 
                float e, float f, float g, float h, vec3 u)
{
    return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), 
                mix(mix(e, f, u.x), mix(g, h, u.x), u.y), u.z);
}

vec3 cubic(vec3 t)
{
    return t*t*(3.0-2.0*t);
}

vec3 quintic(vec3 t)
{
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float grad(vec3 i, vec3 f, vec3 inc)
{
    return dot(hash3(i + inc), f - inc);
}

float perlin( in vec3 x )
{
    vec3 i = floor(x);
    vec3 u = fract(x);
    u = quintic(u);

    float a = grad(i, u, vec3(0,0,0));
    float b = grad(i, u, vec3(1,0,0));
    float c = grad(i, u, vec3(0,1,0));
    float d = grad(i, u, vec3(1,1,0));
    float e = grad(i, u, vec3(0,0,1));
    float f = grad(i, u, vec3(1,0,1));
    float g = grad(i, u, vec3(0,1,1));
    float h = grad(i, u, vec3(1,1,1));

    return 0.5*(trilinear(a, b, c, d, e, f, g, h, u) + 1.0);
}

float noise( in vec3 x )
{
    vec3 i = floor(x);
    vec3 u = fract(x);
    u = cubic(u);
	
    float a = hash(i+vec3(0,0,0));
    float b = hash(i+vec3(1,0,0));
    float c = hash(i+vec3(0,1,0));
    float d = hash(i+vec3(1,1,0));
    float e = hash(i+vec3(0,0,1));
    float f = hash(i+vec3(1,0,1));
    float g = hash(i+vec3(0,1,1));
    float h = hash(i+vec3(1,1,1));

    // Trilinear Interpolation
    return trilinear(a, b, c, d, e, f, g, h, u);
}

float fbm(in vec3 pos)
{
    float total = 0.f;
    float amplitudeSum = 0.f;

    for (int i = 0; i < 6; i++)
    {
        float frequency = pow(2.0f, float(i));
        float amplitude = pow(u_NoisePersistence, float(i));
        
        amplitudeSum += amplitude;

        total += amplitude*perlin(frequency*pos*u_NoiseScale);
    }

    return total/amplitudeSum;
}

void main() 
{
    // Material base color (before shading)
    vec4 diffuseColor = u_Color;

    diffuseColor.xyz = mix(vec3(1.0), u_Color.xyz, fs_Disp);
    // diffuseColor.xyz *= fbm(fs_Pos.xyz);


    // float n = noise(fs_Pos.xyz + vec3(sin(0.02*u_Time), sin(0.01*u_Time), sin(0.001*u_Time)));
    // float color = 0.f;
    // color += smoothstep(.10,.7,n); // Black splatter
    // color -= smoothstep(.50,.5,n); // Holes on splatter
    // diffuseColor.xyz *= color;

    // Calculate the diffuse term for Lambert shading
    float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
    // Avoid negative lighting values
    // diffuseTerm = clamp(diffuseTerm, 0, 1);

    float ambientTerm = 0.2f;

    float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                        //to simulate ambient lighting. This ensures that faces that are not
                                                        //lit by our point light are not completely black.

    // Compute final shaded color
    out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
}