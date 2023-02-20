export const vertexShader = /*glsl*/`
        const int num_points = 256;

        uniform vec2 uPoints[256];
        uniform vec2 uStars[128];
        uniform vec2 uStars2[128];
        uniform vec2 uStars3[128];
        uniform float uTime;

		uniform mat4 projectionMatrix;
		uniform mat4 modelViewMatrix;
		attribute vec3 position;

        varying vec2 u_position;

		void main() {
		  	gl_Position = projectionMatrix *
		                modelViewMatrix *
		                vec4(position,1.0);
            u_position = position.xy;
		}
`;