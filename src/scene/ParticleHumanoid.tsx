import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildHumanoid } from './humanoidGeometry'

const COUNT = 34000

const SNOISE = /* glsl */ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy; i=mod(i,289.0);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=1.0/7.0; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_); vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y); vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 mm=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); mm=mm*mm;
  return 42.0*dot(mm*mm,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`

const vertex = /* glsl */ `
uniform float uTime; uniform float uForm; uniform float uSize;
uniform vec3 uMouse; uniform float uMouseStrength;
attribute vec3 aScatter; attribute float aSeed; attribute float aScale;
varying float vA;
${SNOISE}
void main(){
  vec3 home = position;
  vec3 p = mix(aScatter, home, uForm);
  float t = uTime * 0.05;
  vec3 np = home * 0.3 + aSeed;
  vec3 flow = vec3(
    snoise(np + vec3(t, 0.0, 0.0)),
    snoise(np + vec3(0.0, t, 2.3)),
    snoise(np + vec3(4.1, 0.0, t))
  );
  // gentle shimmer when formed, big drift when dissolved
  p += flow * (0.035 + (1.0 - uForm) * 0.9);
  p.y += sin(uTime * 1.1 + aSeed) * 0.015 * uForm;

  // cursor presence — particles bow away from the pointer
  vec3 d = p - uMouse;
  float dist = length(d);
  p += normalize(d + 1e-4) * smoothstep(1.7, 0.0, dist) * uMouseStrength;

  vA = 0.28 + 0.72 * aScale;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * aScale * (1.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`

const fragment = /* glsl */ `
uniform vec3 uColorA; uniform vec3 uColorB; uniform float uOpacity;
varying float vA;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float dd = length(c);
  if (dd > 0.5) discard;
  float a = smoothstep(0.5, 0.0, dd) * vA * uOpacity;
  gl_FragColor = vec4(mix(uColorA, uColorB, vA), a);
}
`

/**
 * The signature: a humanoid surface-sampled into ~34k particles that assemble
 * from drifting dust on load, breathe + shimmer, turn to face the cursor, and
 * dissolve back into the cloud as the page scrolls past the hero.
 */
export default function ParticleHumanoid() {
  const group = useRef<THREE.Group>(null)
  const mat = useRef<THREE.ShaderMaterial>(null)
  const { camera } = useThree()
  const intro = useRef(0)
  const mouseWorld = useRef(new THREE.Vector3(0, 0, 0))
  const ndc = useRef(new THREE.Vector3())

  const data = useMemo(() => buildHumanoid(COUNT), [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uForm: { value: 0 },
      uSize: { value: 17 },
      uOpacity: { value: 1 },
      uMouse: { value: new THREE.Vector3(0, 0, -10) },
      uMouseStrength: { value: 0 },
      uColorA: { value: new THREE.Color('#4f6bb0') },
      uColorB: { value: new THREE.Color('#eaf0ff') },
    }),
    [],
  )

  useFrame((state, delta) => {
    if (!mat.current || !group.current) return
    const u = mat.current.uniforms
    u.uTime.value = state.clock.elapsedTime

    // intro assemble (eased to 1), then dissolve as the hero scrolls away
    intro.current = Math.min(1, intro.current + delta * 0.5)
    const introEase = 1 - Math.pow(1 - intro.current, 3)
    const scrollY = window.scrollY
    const fade = THREE.MathUtils.clamp(1 - scrollY / (window.innerHeight * 0.7), 0, 1)
    u.uForm.value = introEase * (0.15 + 0.85 * fade)
    u.uOpacity.value = 0.25 + 0.75 * fade

    // turn to face the cursor + slow idle sway
    const tx = state.pointer.x * 0.5 + Math.sin(state.clock.elapsedTime * 0.15) * 0.08
    const ty = -state.pointer.y * 0.22
    const k = 1 - Math.exp(-3 * delta)
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, tx, k)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, ty, k)

    // project cursor near the figure for the repulsion field
    ndc.current.set(state.pointer.x, state.pointer.y, 0.2).unproject(camera)
    mouseWorld.current.lerp(ndc.current, 1 - Math.exp(-7 * delta))
    u.uMouse.value.copy(mouseWorld.current)
    const moving = state.pointer.x !== 0 || state.pointer.y !== 0
    u.uMouseStrength.value +=
      ((moving ? 0.6 : 0) - u.uMouseStrength.value) * (1 - Math.exp(-3 * delta))
  })

  return (
    <group ref={group}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-aScatter" args={[data.scatter, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[data.seeds, 1]} />
          <bufferAttribute attach="attributes-aScale" args={[data.scales, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={vertex}
          fragmentShader={fragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
