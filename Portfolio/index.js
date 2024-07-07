import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import getStarfield from "./getStarfield.js";

const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 1000;  // Increase far plane to ensure stars are within view

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 0, 5);  // Move the camera further out to see more stars
camera.lookAt(new THREE.Vector3(0, 0, 0));
const scene = new THREE.Scene();

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
scene.add(earthGroup);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

const detail = 12;
const loader = new THREE.TextureLoader();
const geo = new THREE.IcosahedronGeometry(1.0, detail);
const mat = new THREE.MeshStandardMaterial({
    map: loader.load("00_earthmap1k.jpg")
});

const mesh = new THREE.Mesh(geo, mat);
earthGroup.add(mesh);



const lightsMat = new THREE.MeshBasicMaterial({
    // transparent: true,
    // opacity: 0.6,
    map: loader.load("8k_earth_nightmap.jpg"),
    blending: THREE.AdditiveBlending,
});

const cloudsMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.5,
    map: loader.load("8k_earth_clouds.jpg"),
    blending: THREE.AdditiveBlending,
});


const cloudsMesh = new THREE.Mesh(geo, cloudsMat);
earthGroup.add(cloudsMesh);

const lightsMesh = new THREE.Mesh(geo, lightsMat);
earthGroup.add(lightsMesh);

const starfield = getStarfield({ numStars: 1000 });
console.log("Starfield object:", starfield);
scene.add(starfield);

// const hemiLight = new THREE.HemisphereLight();
// scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffffff);
sunLight.position.set(-2,0.5,1.5);
scene.add(sunLight);

function animate(t = 0) {
    requestAnimationFrame(animate);
    mesh.rotation.y = t * 0.0001;
    lightsMesh.rotation.y = t * 0.0001;
    cloudsMesh.rotation.y = t * 0.0001;
    controls.update();
    renderer.render(scene, camera);
}

animate();