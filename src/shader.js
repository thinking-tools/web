import * as THREE from 'three';

let camera, scene, renderer, uniforms;

init();
animate();

function init() {
  camera = new THREE.Camera();
  camera.position.z = 1;

  scene = new THREE.Scene();

  const geometry = new THREE.PlaneGeometry(2, 2);

  uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() },
  };

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: `
          #define SPIN_ROTATION -2.0
          #define SPIN_SPEED 4.0
          #define OFFSET vec2(0.0)
          #define COLOUR_1 vec4(0.89, 0.24, 0.14, 1.0)   // red-orange
          #define COLOUR_2 vec4(0.95, 0.62, 0.04, 1.0)    // blue
          #define COLOUR_3 vec4(0.54, 0.69, 0.99, 1.0)  // light gray/blue
          #define CONTRAST 3.5
          #define LIGTHING 0.4
          #define SPIN_AMOUNT 0.25
          #define PIXEL_FILTER 745.0
          #define SPIN_EASE 1.0
          #define PI 3.14159265359
          #define IS_ROTATE false

          uniform float iTime;
          uniform vec3 iResolution;

          vec4 effect(vec2 screenSize, vec2 screen_coords) {
              float screenLength = length(screenSize.xy);
              float pixel_size = screenLength / PIXEL_FILTER;
              vec2 uv = (floor(screen_coords.xy*(1.0/pixel_size))*pixel_size - 0.5*screenSize.xy)/screenLength - OFFSET;
              float uv_len = length(uv);
              
              // Pre-calculated since IS_ROTATE is false
              float speed = 302.2;
              float new_pixel_angle = atan(uv.y, uv.x) + speed - SPIN_EASE*20.0*(1.0*SPIN_AMOUNT*uv_len + (1.0 - 1.0*SPIN_AMOUNT));
              vec2 mid = (screenSize.xy/screenLength)/2.0;
              uv = (vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid);
              
              uv *= 30.0;
              speed = iTime * SPIN_SPEED;
              vec2 uv2 = vec2(uv.x+uv.y);
              
              // Unrolled loop for better performance
              float max_uv = max(uv.x, uv.y);
              uv2 += sin(max_uv) + uv;
              uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121), sin(uv2.x - 0.113*speed));
              uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
              
              max_uv = max(uv.x, uv.y);
              uv2 += sin(max_uv) + uv;
              uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121), sin(uv2.x - 0.113*speed));
              uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
              
              max_uv = max(uv.x, uv.y);
              uv2 += sin(max_uv) + uv;
              uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121), sin(uv2.x - 0.113*speed));
              uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
              
              max_uv = max(uv.x, uv.y);
              uv2 += sin(max_uv) + uv;
              uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121), sin(uv2.x - 0.113*speed));
              uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
              
              max_uv = max(uv.x, uv.y);
              uv2 += sin(max_uv) + uv;
              uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121), sin(uv2.x - 0.113*speed));
              uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
              
              float contrast_mod = (0.25*CONTRAST + 0.5*SPIN_AMOUNT + 1.2);
              float paint_res = clamp(length(uv)*(0.035)*contrast_mod, 0.0, 2.0);
              float c1p = max(0.0,1.0 - contrast_mod*abs(1.0 - paint_res));
              float c2p = max(0.0,1.0 - contrast_mod*abs(paint_res));
              float c3p = 1.0 - min(1.0, c1p + c2p);
              float light = (LIGTHING - 0.2)*max(c1p*5.0 - 4.0, 0.0) + LIGTHING*max(c2p*5.0 - 4.0, 0.0);
              return (0.3/CONTRAST)*COLOUR_1 + (1.0 - 0.3/CONTRAST)*(COLOUR_1*c1p + COLOUR_2*c2p + vec4(c3p*COLOUR_3.rgb, c3p*COLOUR_1.a)) + light;
          }

          void main() {
              vec2 uv = gl_FragCoord.xy / iResolution.xy;
              gl_FragColor = effect(iResolution.xy, uv * iResolution.xy);
          }
        `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x

  let shaderElm = document.getElementById('shaderAnim');
  shaderElm.appendChild(renderer.domElement);
  onWindowResize();

  // Throttled resize
  let resizeTimeout;
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(onWindowResize, 100);
    },
    false,
  );

  window.addEventListener('blur', () => {
    if (renderer.info.autoReset) {
      renderer.info.autoReset = false;
    }
  });

  window.addEventListener('focus', () => {
    if (!renderer.info.autoReset) {
      renderer.info.autoReset = true;
      animate();
    }
  });

  // Pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Tab is now hidden - pause the animation
      if (renderer.info.autoReset) {
        renderer.info.autoReset = false;
      }
    } else {
      // Tab is now visible - resume the animation
      if (!renderer.info.autoReset) {
        renderer.info.autoReset = true;
        animate();
      }
    }
  });
}

function onWindowResize() {
  let shaderElm = document.getElementById('shaderAnim');
  const width = shaderElm.clientWidth;
  const height = shaderElm.clientHeight;
  renderer.setSize(width, height);
  uniforms.iResolution.value.set(width, height, 1);
}

function animate(time) {
  if (document.hidden) {
    renderer.info.autoReset = false;
    return;
  }

  requestAnimationFrame(animate);
  uniforms.iTime.value = time * 0.001;
  renderer.render(scene, camera);
}
