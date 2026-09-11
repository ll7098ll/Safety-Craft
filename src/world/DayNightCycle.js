import * as THREE from 'three';
import { textures } from './Textures.js';

export class DayNightCycle {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 0.35; // 0.25: 일출, 0.5: 정오, 0.75: 일몰, 0.0: 자정
    this.speed = 0.002;
    this.isAutoCycling = true; // 천천히 흐르는 마인크래프트 시간

    // 주변광
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    // 주 광원
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 120;
    const d = 30;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // 랜턴/횃불 포인트 라이트
    this.campLantern = new THREE.PointLight(0xffaa44, 0.2, 12);
    this.campLantern.position.set(2, 2.5, -2);
    this.scene.add(this.campLantern);

    // 1) 마인크래프트 정육면체 태양 & 달 생성
    this.createMinecraftCelestialBodies();

    // 2) 3D 복셀 구름층 생성
    this.createVoxelClouds();

    this.updateLighting();
  }

  createMinecraftCelestialBodies() {
    this.skyGroup = new THREE.Group();

    // 네모난 태양
    const sunGeom = new THREE.PlaneGeometry(8, 8);
    const sunMat = new THREE.MeshBasicMaterial({
      map: textures.get('sun'),
      transparent: true,
      side: THREE.DoubleSide
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.skyGroup.add(this.sunMesh);

    // 네모난 달
    const moonGeom = new THREE.PlaneGeometry(6, 6);
    const moonMat = new THREE.MeshBasicMaterial({
      map: textures.get('moon'),
      transparent: true,
      side: THREE.DoubleSide
    });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.skyGroup.add(this.moonMesh);

    this.scene.add(this.skyGroup);
  }

  createVoxelClouds() {
    // Y=28 고도에 떠다니는 두툼한 복셀 구름들
    this.cloudGroup = new THREE.Group();
    this.cloudGroup.position.y = 26;

    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.82
    });

    const cloudBoxGeo = new THREE.BoxGeometry(1, 1, 1);
    const count = 180;
    this.cloudMesh = new THREE.InstancedMesh(cloudBoxGeo, cloudMat, count);

    const dummy = new THREE.Object3D();
    let idx = 0;

    // 구름 클러스터 5개 분산
    const clusters = [
      { cx: -20, cz: -10, w: 12, d: 8 },
      { cx: 15, cz: -25, w: 14, d: 10 },
      { cx: -10, cz: 20, w: 16, d: 8 },
      { cx: 20, cz: 15, w: 10, d: 12 },
      { cx: 0, cz: 0, w: 12, d: 12 }
    ];

    clusters.forEach(c => {
      for (let x = -c.w / 2; x < c.w / 2; x += 2) {
        for (let z = -c.d / 2; z < c.d / 2; z += 2) {
          if (Math.random() < 0.7) {
            dummy.position.set(c.cx + x, (Math.random() - 0.5) * 0.5, c.cz + z);
            dummy.scale.set(2.5, 0.8, 2.5);
            dummy.updateMatrix();
            if (idx < count) {
              this.cloudMesh.setMatrixAt(idx++, dummy.matrix);
            }
          }
        }
      }
    });

    this.cloudMesh.instanceMatrix.needsUpdate = true;
    this.cloudGroup.add(this.cloudMesh);
    this.scene.add(this.cloudGroup);
  }

  toggleDayNight() {
    this.timeOfDay = this.timeOfDay < 0.6 ? 0.88 : 0.45;
    this.updateLighting();
    return this.isNight();
  }

  isNight() {
    return this.timeOfDay < 0.22 || this.timeOfDay > 0.78;
  }

  update(delta) {
    if (this.isAutoCycling) {
      this.timeOfDay = (this.timeOfDay + this.speed * delta) % 1.0;
      this.updateLighting();
    }

    // 구름의 느린 수평 이동 (마인크래프트 클라우드 모션)
    if (this.cloudGroup) {
      this.cloudGroup.position.x += delta * 0.8;
      if (this.cloudGroup.position.x > 50) {
        this.cloudGroup.position.x = -50;
      }
    }
  }

  updateLighting() {
    const angle = this.timeOfDay * Math.PI * 2;
    const distance = 55;

    // 태양 위치
    const sunX = Math.cos(angle) * distance;
    const sunY = Math.sin(angle) * distance;
    this.sunLight.position.set(sunX, Math.max(0.1, sunY), 15);

    // 네모난 태양 메쉬
    this.sunMesh.position.set(sunX, sunY, 15);
    this.sunMesh.lookAt(0, 0, 0);

    // 네모난 달 메쉬 (태양 반대편)
    const moonX = -sunX;
    const moonY = -sunY;
    this.moonMesh.position.set(moonX, moonY, -15);
    this.moonMesh.lookAt(0, 0, 0);

    const isNight = this.isNight();

    if (isNight) {
      // 마인크래프트 밤하늘
      this.scene.background = new THREE.Color(0x0c1322);
      if (this.scene.fog) this.scene.fog.color.setHex(0x0c1322);
      this.ambientLight.color.setHex(0x283850);
      this.ambientLight.intensity = 0.35;
      this.sunLight.color.setHex(0x5577aa);
      this.sunLight.intensity = 0.25;
      this.campLantern.intensity = 3.0; // 야간 캠프 랜턴 발광
    } else {
      // 마인크래프트 화창한 대낮
      this.scene.background = new THREE.Color(0x78a7ff);
      if (this.scene.fog) this.scene.fog.color.setHex(0x78a7ff);
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.75;
      this.sunLight.color.setHex(0xfff6db);
      this.sunLight.intensity = 1.35;
      this.campLantern.intensity = 0.3;
    }
  }
}
