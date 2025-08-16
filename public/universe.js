const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const categories = {
  Search: { center: new THREE.Vector3(0, 0, 0), color: 0xffcc00 },
  Social: { center: new THREE.Vector3(100, 0, 0), color: 0x00ccff },
  Shopping: { center: new THREE.Vector3(-100, 0, 0), color: 0x00ff66 },
  News: { center: new THREE.Vector3(0, 100, 0), color: 0xff3300 },
  Entertainment: { center: new THREE.Vector3(0, -100, 0), color: 0xff66ff },
  Technology: { center: new THREE.Vector3(100, 100, 0), color: 0x6666ff },
  Adult: { center: new THREE.Vector3(-100, 100, 0), color: 0xffffff },
  Other: { center: new THREE.Vector3(-100, -100, 0), color: 0x888888 }
};

const stars = [];

fetch('top500.json')
  .then(res => res.json())
  .then(data => {
    data.forEach(site => {
      const info = categories[site.category] || categories.Other;
      const geometry = new THREE.SphereGeometry(0.3, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: info.color });
      const star = new THREE.Mesh(geometry, material);
      const spread = 20;
      star.position.set(
        info.center.x + (Math.random() - 0.5) * spread,
        info.center.y + (Math.random() - 0.5) * spread,
        info.center.z + (Math.random() - 0.5) * spread
      );
      star.userData = { name: site.name, url: site.url };
      scene.add(star);
      stars.push(star);
    });
  });

camera.position.z = 300;

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

const info = document.getElementById('info');

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(stars);

  if (intersects.length > 0) {
    const star = intersects[0].object;
    info.style.display = 'block';
    info.style.left = event.clientX + 'px';
    info.style.top = event.clientY + 'px';
    info.innerHTML = `${star.userData.name}<br>${star.userData.url}`;
    document.body.style.cursor = 'pointer';
  } else {
    info.style.display = 'none';
    document.body.style.cursor = 'default';
  }
}

function onClick() {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(stars);

  if (intersects.length > 0) {
    const star = intersects[0].object;
    window.open(star.userData.url, '_blank');
  }
}

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onClick);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
