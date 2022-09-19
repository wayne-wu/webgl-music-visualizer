#version 300 es

//This is a vertex shader. While it is called a "shader" due to outdated conventions, this file
//is used to apply matrix transformations to the arrays of vertex data passed to it.
//Since this code is run on your GPU, each vertex is transformed simultaneously.
//If it were run on your CPU, each vertex would have to be processed in a FOR loop, one at a time.
//This simultaneous transformation allows your program to run much faster, especially when rendering
//geometry with millions of vertices.

uniform float u_Time;
uniform float u_Displacement;
uniform float u_Frequency;
uniform float u_NoisePersistence;
uniform float u_NoiseScale;

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Pos;

out float fs_Disp;

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.

// Hash functions are taken from IQ's shadertoy examples
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

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
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

float mountain(vec3 p)
{
    float f = 5.0;
    return 2.0*(sin(f*p.x) + cos(f*p.y) + sin(f*p.z));
}

float fbm(in vec3 pos)
{
    float total = 0.f;
    float amplitudeSum = 0.f;

    for (int i = 0; i < 3; i++)
    {
        float frequency = pow(2.0f, float(i));
        float amplitude = pow(u_NoisePersistence, float(i));
        
        amplitudeSum += amplitude;

        total += amplitude*mountain(frequency*pos*u_NoiseScale);
    }

    return total/amplitudeSum;
}

void main()
{
    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.
    fs_Pos = vs_Pos;
    
    float amp = sin(0.1*u_Time) + 1.0;

    float displacement = amp*fbm(vs_Pos.xyz + vec3(u_Time*0.01));

    fs_Disp = map(displacement, 0.0, 5.0, 0.0, 1.0);

    vec4 jitteredPos = vs_Pos;
    jitteredPos.xyz += u_Displacement * displacement * vs_Nor.xyz;

    vec4 modelposition = u_Model * jitteredPos;   // Temporarily store the transformed vertex positions for use below

    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}
