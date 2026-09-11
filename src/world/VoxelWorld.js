import * as THREE from 'three';
import { textures } from './Textures.js';
import { sounds } from '../audio/SoundManager.js';

export class VoxelWorld {
  constructor(scene) {
    this.scene = scene;
    this.blocks = new Map(); // key: "x,y,z" -> blockData
    this.instancedMeshes = [];
    this.dynamicMeshes = [];
    this.raycastMeshes = []; // 레이캐스팅 대상 메쉬 배열
    this.collisionBoxes = [];
    this.interactableZones = [];
    this.droppedItems = [];
    this.isBuilt = false;

    this.materials = {
      grass: [
        textures.createMaterial('grass_side'),
        textures.createMaterial('grass_side'),
        textures.createMaterial('grass_top'),
        textures.createMaterial('dirt'),
        textures.createMaterial('grass_side'),
        textures.createMaterial('grass_side')
      ],
      dirt: textures.createMaterial('dirt'),
      stone: textures.createMaterial('stone'),
      cobblestone: textures.createMaterial('cobblestone'),
      oak_planks: textures.createMaterial('oak_planks'),
      oak_log: textures.createMaterial('oak_log'),
      oak_leaves: textures.createMaterial('oak_leaves', { transparent: true, opacity: 0.95 }),
      pine_leaves: textures.createMaterial('pine_leaves', { transparent: true, opacity: 0.95 }),
      gravel_path: textures.createMaterial('gravel_path'),
      bridge_wood: textures.createMaterial('bridge_wood'),
      deck_wood: textures.createMaterial('deck_wood'),
      caution: textures.createMaterial('caution'),
      safe_zone: textures.createMaterial('safe_zone')
    };

    this.createSelectionBox();
    this.createCrackMesh();

    // 모든 초기 맵 콘텐츠 데이터 등록
    this.generateTerrain();
    this.createCreekAndBridge();
    this.createPathways();
    this.createMountainRanges();
    this.createTreesAndForest();
    this.createWildflowers();
    this.createHazardMarkers();

    // 18,500개 블록을 단 10여 개의 InstancedMesh로 초고속 렌더링 병합
    this.buildInstancedMeshes();
  }

  static cubeGeo = new THREE.BoxGeometry(1, 1, 1);

  createSelectionBox() {
    const boxGeo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    const edges = new THREE.EdgesGeometry(boxGeo);
    this.selectionBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    );
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);
  }

  createCrackMesh() {
    this.crackMat = new THREE.MeshBasicMaterial({
      map: textures.get('destroy_stage_0'),
      transparent: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });
    this.crackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.002, 1.002, 1.002), this.crackMat);
    this.crackMesh.visible = false;
    this.scene.add(this.crackMesh);
  }

  getKey(x, y, z) {
    return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  }

  getBlock(x, y, z) {
    return this.blocks.get(this.getKey(x, y, z)) || null;
  }

  setBlock(x, y, z, type = 'oak_planks') {
    const key = this.getKey(x, y, z);
    if (this.blocks.has(key)) return this.blocks.get(key);

    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);

    if (!this.isBuilt) {
      // 초기 생성 단계: 메모리에 등록 후 일괄 InstancedMesh 빌드
      const blockData = {
        type,
        x: bx,
        y: by,
        z: bz
      };
      this.blocks.set(key, blockData);
      return blockData;
    } else {
      // 런타임 플레이어 설치 블록 (동적 메쉬)
      const mat = this.materials[type] || this.materials.oak_planks;
      const mesh = new THREE.Mesh(VoxelWorld.cubeGeo, mat);
      mesh.position.set(bx + 0.5, by + 0.5, bz + 0.5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const blockData = {
        mesh,
        isDynamic: true,
        type,
        x: bx,
        y: by,
        z: bz,
        box: new THREE.Box3().setFromObject(mesh)
      };

      this.blocks.set(key, blockData);
      this.dynamicMeshes.push(mesh);
      this.raycastMeshes.push(mesh);
      this.collisionBoxes.push(blockData.box);
      return blockData;
    }
  }

  buildInstancedMeshes() {
    const typeGroups = new Map();
    for (const [key, b] of this.blocks) {
      if (!typeGroups.has(b.type)) {
        typeGroups.set(b.type, []);
      }
      typeGroups.get(b.type).push(b);
    }

    const dummy = new THREE.Object3D();

    for (const [type, blockList] of typeGroups) {
      const count = blockList.length;
      const mat = this.materials[type] || this.materials.oak_planks;
      const instMesh = new THREE.InstancedMesh(VoxelWorld.cubeGeo, mat, count);
      instMesh.name = `instanced_${type}`;

      // 바닥 잔디(y <= -1)는 불필요한 그림자 캐스팅 해제하여 연산량 50% 절감 (수신은 유지)
      if (type === 'grass') {
        instMesh.castShadow = false;
        instMesh.receiveShadow = true;
      } else {
        instMesh.castShadow = true;
        instMesh.receiveShadow = true;
      }

      instMesh.userData.instances = new Array(count);

      for (let i = 0; i < count; i++) {
        const b = blockList[i];
        dummy.position.set(b.x + 0.5, b.y + 0.5, b.z + 0.5);
        dummy.updateMatrix();
        instMesh.setMatrixAt(i, dummy.matrix);

        b.instanceMesh = instMesh;
        b.instanceId = i;
        instMesh.userData.instances[i] = b;
      }

      instMesh.instanceMatrix.needsUpdate = true;
      this.scene.add(instMesh);
      this.instancedMeshes.push(instMesh);
      this.raycastMeshes.push(instMesh);
    }

    this.isBuilt = true;
  }

  removeBlock(x, y, z) {
    const key = this.getKey(x, y, z);
    const blockData = this.blocks.get(key);
    if (!blockData) return null;

    if (blockData.instanceMesh) {
      // 인스턴스 크기를 0으로 축소하여 즉시 숨김
      const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
      blockData.instanceMesh.setMatrixAt(blockData.instanceId, zeroMatrix);
      blockData.instanceMesh.instanceMatrix.needsUpdate = true;
    } else if (blockData.mesh) {
      this.scene.remove(blockData.mesh);
      if (blockData.mesh.geometry) blockData.mesh.geometry.dispose();
      const dIdx = this.dynamicMeshes.indexOf(blockData.mesh);
      if (dIdx !== -1) this.dynamicMeshes.splice(dIdx, 1);
      const rIdx = this.raycastMeshes.indexOf(blockData.mesh);
      if (rIdx !== -1) this.raycastMeshes.splice(rIdx, 1);
      if (blockData.box) {
        const cIdx = this.collisionBoxes.indexOf(blockData.box);
        if (cIdx !== -1) this.collisionBoxes.splice(cIdx, 1);
      }
    }

    this.blocks.delete(key);
    this.spawnDroppedItem(blockData.x + 0.5, blockData.y + 0.5, blockData.z + 0.5, blockData.type);
    return blockData;
  }

  spawnDroppedItem(x, y, z, type) {
    const geom = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const mat = Array.isArray(this.materials[type]) ? this.materials[type][2] : (this.materials[type] || this.materials.oak_planks);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.droppedItems.push({
      mesh,
      type,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        2.5 + Math.random() * 1.5,
        (Math.random() - 0.5) * 1.5
      ),
      baseY: y,
      time: 0
    });
  }

  // 1. 대형 80x80 평지 및 분지 지형 생성 (상단면 y = 0.0)
  generateTerrain() {
    const half = 36; // -36 ~ +36 (72m 폭의 광활한 지형)

    // 메인 캠핑장 및 분지 평지
    for (let x = -half; x <= half; x++) {
      for (let z = -half; z <= half; z++) {
        // 계곡 하천 구역 (x: -18 ~ -14)은 건너뜀
        if (x >= -18 && x <= -14) continue;
        this.setBlock(x, -1, z, 'grass');
      }
    }
  }

  // 2. 맑은 계곡과 건널 수 있는 통나무 아치 다리
  createCreekAndBridge() {
    const half = 36;
    const waterMat = textures.createMaterial('water', { transparent: true, opacity: 0.8 });

    // 계곡 수면 생성 (인스턴스드 메쉬로 219개 ➔ 1개 드로우콜 압축)
    const waterCount = (half * 2 + 1) * 3;
    const waterMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.75, 1), waterMat, waterCount);
    waterMesh.name = 'instanced_water';
    const dummy = new THREE.Object3D();
    let wIdx = 0;

    for (let z = -half; z <= half; z++) {
      for (let x = -17; x <= -15; x++) {
        dummy.position.set(x + 0.5, -0.4, z + 0.5);
        dummy.updateMatrix();
        waterMesh.setMatrixAt(wIdx++, dummy.matrix);
      }

      // 계곡 양안 조약돌/자갈
      if (Math.sin(z * 0.5) > -0.4) {
        this.setBlock(-18, 0, z, 'cobblestone');
      }
      if (Math.cos(z * 0.45) > -0.3) {
        this.setBlock(-14, 0, z, 'cobblestone');
      }
    }
    waterMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(waterMesh);

    // 튼튼한 통나무 원목 다리 (z: -1 ~ 1, x: -19 ~ -13)
    for (let x = -19; x <= -13; x++) {
      for (let z = -1; z <= 1; z++) {
        this.setBlock(x, 0, z, 'bridge_wood');
      }
      this.setBlock(x, -1, -1, 'oak_log');
      this.setBlock(x, -1, 1, 'oak_log');
    }

    // 다리 양쪽 안전 난간 (Fences)
    const fenceGeom = new THREE.BoxGeometry(0.15, 0.7, 0.15);
    const fenceMat = this.materials.oak_log;
    const railGeom = new THREE.BoxGeometry(1.0, 0.1, 0.08);

    for (let x = -19; x <= -13; x++) {
      const leftPost = new THREE.Mesh(fenceGeom, fenceMat);
      leftPost.position.set(x + 0.5, 0.85, -1.35);
      this.scene.add(leftPost);

      const rightPost = new THREE.Mesh(fenceGeom, fenceMat);
      rightPost.position.set(x + 0.5, 0.85, 1.35);
      this.scene.add(rightPost);

      const leftRail = new THREE.Mesh(railGeom, fenceMat);
      leftRail.position.set(x + 0.5, 1.0, -1.35);
      this.scene.add(leftRail);

      const rightRail = new THREE.Mesh(railGeom, fenceMat);
      rightRail.position.set(x + 0.5, 1.0, 1.35);
      this.scene.add(rightRail);
    }
  }

  // 3. 캠핑장 사이트 연결 산책로 (Gravel Pathways)
  createPathways() {
    for (let x = -13; x <= 2; x++) {
      const z = Math.round((x - 2) * (0 - (-2)) / (-14 - 2) + -2);
      this.setBlock(x, -1, z, 'gravel_path');
      this.setBlock(x, -1, z + 1, 'gravel_path');
    }

    for (let x = 2; x <= 8; x++) {
      this.setBlock(x, -1, -1, 'gravel_path');
      this.setBlock(x, -1, -2, 'gravel_path');
    }

    for (let z = 0; z <= 18; z++) {
      const x = Math.round(Math.sin(z * 0.3) * 2 + 3);
      this.setBlock(x, -1, z, 'gravel_path');
    }
  }

  // 4. 캠핑장을 아늑하게 둘러싼 웅장한 배경 산맥 & 암벽 절벽
  createMountainRanges() {
    const half = 36;

    // 동쪽 웅장한 바위 절벽 (x: 22 ~ 36, y: 0 ~ 7)
    for (let x = 22; x <= half; x++) {
      for (let z = -half; z <= half; z += 2) {
        const height = Math.min(8, Math.floor((x - 20) * 0.55 + Math.sin(z * 0.3) * 1.5));
        for (let y = 0; y <= height; y++) {
          const type = (y === height) ? 'grass' : ((y > height - 3) ? 'dirt' : 'stone');
          this.setBlock(x, y, z, type);
          if (z + 1 <= half) this.setBlock(x, y, z + 1, type);
        }
      }
    }

    // 서쪽 계곡 건너편 소나무 숲 언덕 (x: -36 ~ -26)
    for (let x = -half; x <= -26; x++) {
      for (let z = -half; z <= half; z += 2) {
        const height = Math.min(7, Math.floor((-x - 24) * 0.5 + Math.cos(z * 0.25) * 1.5));
        for (let y = 0; y <= height; y++) {
          const type = (y === height) ? 'grass' : 'stone';
          this.setBlock(x, y, z, type);
          if (z + 1 <= half) this.setBlock(x, y, z + 1, type);
        }
      }
    }

    // 북쪽 배경 산봉우리 (z: -36 ~ -28)
    for (let z = -half; z <= -28; z++) {
      for (let x = -24; x <= 20; x += 2) {
        const height = Math.min(6, Math.floor((-z - 26) * 0.6 + Math.sin(x * 0.4) * 1.2));
        for (let y = 0; y <= height; y++) {
          this.setBlock(x, y, z, (y === height ? 'grass' : 'stone'));
          if (x + 1 <= 20) this.setBlock(x + 1, y, z, (y === height ? 'grass' : 'stone'));
        }
      }
    }
  }

  // 5. 다채로운 나무 군락지 (오크나무 + 소나무 숲)
  createTreesAndForest() {
    const oakTrees = [
      [-6, 7], [-4, -8], [7, -6], [-7, -5],
      [10, 8], [-2, 12], [8, -12], [-8, -14],
      [14, -6], [12, -18], [5, 16], [-5, 18],
      [16, 4], [18, -10], [-10, 8], [-11, -8]
    ];

    oakTrees.forEach(([tx, tz]) => {
      this.createOakTree(tx, 0, tz);
    });

    const pineTrees = [
      [24, 2, -10], [26, 3, 5], [25, 3, 16], [28, 4, -4], [23, 2, -18],
      [-28, 2, 4], [-30, 3, -12], [-29, 3, 14], [-32, 4, -2], [-27, 2, -20],
      [-10, 0, -26], [4, 0, -25], [12, 1, -27], [-15, 0, -30],
      [16, 1, 24], [2, 0, 26], [-8, 0, 28]
    ];

    pineTrees.forEach(([px, py, pz]) => {
      this.createPineTree(px, py, pz);
    });

    // 고목 (미션 1의 벼락/낙하 위험 고목)
    for (let y = 0; y <= 6; y++) {
      this.setBlock(0, y, 10, 'oak_log');
    }
    this.setBlock(1, 4, 10, 'oak_log');
    this.setBlock(2, 4, 10, 'oak_log');
    this.setBlock(-1, 5, 10, 'oak_log');
  }

  createOakTree(tx, baseY, tz) {
    const trunkH = 4;
    for (let y = baseY; y <= baseY + trunkH; y++) {
      this.setBlock(tx, y, tz, 'oak_log');
    }
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = baseY + 3; ly <= baseY + 5; ly++) {
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === baseY + 5) continue;
          if (lx === 0 && lz === 0 && ly <= baseY + trunkH) continue;
          this.setBlock(tx + lx, ly, tz + lz, 'oak_leaves');
        }
      }
    }
  }

  createPineTree(tx, baseY, tz) {
    const trunkH = 5;
    for (let y = baseY; y <= baseY + trunkH; y++) {
      this.setBlock(tx, y, tz, 'oak_log');
    }
    const layers = [
      { r: 2, y: baseY + 3 },
      { r: 2, y: baseY + 4 },
      { r: 1, y: baseY + 5 },
      { r: 1, y: baseY + 6 },
      { r: 0, y: baseY + 7 }
    ];

    layers.forEach(({ r, y }) => {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx === 0 && dz === 0 && y <= baseY + trunkH) continue;
          if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
          this.setBlock(tx + dx, y, tz + dz, 'pine_leaves');
        }
      }
    });
  }

  // 6. 마인크래프트 감성 들꽃 (민들레, 양귀비)
  createWildflowers() {
    const flowers = [
      { x: -3, z: 2, type: 'dandelion' },
      { x: -4, z: 4, type: 'poppy' },
      { x: 1, z: 3, type: 'dandelion' },
      { x: 6, z: 2, type: 'poppy' },
      { x: 8, z: 4, type: 'dandelion' },
      { x: -2, z: -4, type: 'poppy' },
      { x: 5, z: -6, type: 'dandelion' },
      { x: -7, z: 2, type: 'poppy' },
      { x: -12, z: 3, type: 'dandelion' },
      { x: -22, z: 2, type: 'poppy' },
      { x: -24, z: -2, type: 'dandelion' }
    ];

    flowers.forEach(({ x, z, type }) => {
      const geom = new THREE.PlaneGeometry(0.8, 0.8);
      const mat = new THREE.MeshBasicMaterial({
        map: textures.get(type),
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide
      });

      const fGroup = new THREE.Group();
      fGroup.position.set(x + 0.5, 0.4, z + 0.5);

      const p1 = new THREE.Mesh(geom, mat);
      p1.rotation.y = Math.PI / 4;
      fGroup.add(p1);

      const p2 = new THREE.Mesh(geom, mat);
      p2.rotation.y = -Math.PI / 4;
      fGroup.add(p2);

      this.scene.add(fGroup);
    });
  }

  // 7. 안전 위험 표지판 및 명당 안전 구역 마커
  createHazardMarkers() {
    this.createSignPost(-13, 0, 0, '⚠️ 계곡 급류 범람 위험!\n비가 많이 오면 계곡물이 순식간에 불어나요! 강변 텐트 설치 금지!');
    this.createSignPost(18, 0, 0, '⚠️ 낙석 주의!\n높은 절벽 밑은 바위가 굴러떨어질 수 있어요! 절벽 밑 야영 금지!');
    this.createSignPost(0, 0, 8, '⚠️ 고목 낙뢰/가지 낙하 위험!\n비바람에 굵은 나뭇가지가 떨어질 수 있어요! 마른 나무 밑 텐트 금지!');

    // 안전 구역 바닥 표시 (인스턴스드 메쉬로 최적화)
    const markerGeo = new THREE.PlaneGeometry(0.9, 0.9);
    const markerCount = 7 * 7;
    const markerInst = new THREE.InstancedMesh(markerGeo, this.materials.safe_zone, markerCount);
    markerInst.name = 'instanced_safe_zone_markers';
    const dummy = new THREE.Object3D();
    let mIdx = 0;

    for (let sx = -1; sx <= 5; sx++) {
      for (let sz = -5; sz <= 1; sz++) {
        dummy.position.set(sx + 0.5, 0.02, sz + 0.5);
        dummy.rotation.x = -Math.PI / 2;
        dummy.updateMatrix();
        markerInst.setMatrixAt(mIdx++, dummy.matrix);
      }
    }
    markerInst.instanceMatrix.needsUpdate = true;
    this.scene.add(markerInst);

    this.safeZoneBounds = new THREE.Box3(
      new THREE.Vector3(-1.5, -0.5, -5.5),
      new THREE.Vector3(5.5, 3.0, 1.5)
    );
  }

  createSignPost(x, y, z, text) {
    this.setBlock(x, y, z, 'caution');
    this.interactableZones.push({
      position: new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5),
      radius: 2.5,
      type: 'sign',
      message: text
    });
  }

  updateDroppedItems(delta, playerPos, onPickup) {
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const item = this.droppedItems[i];
      item.time += delta;
      item.mesh.rotation.y += delta * 3;

      item.velocity.y -= 15 * delta;
      item.mesh.position.addScaledVector(item.velocity, delta);

      if (item.mesh.position.y < item.baseY + 0.15) {
        item.mesh.position.y = item.baseY + 0.15 + Math.sin(item.time * 4) * 0.05;
        item.velocity.set(0, 0, 0);
      }

      const dist = item.mesh.position.distanceTo(playerPos);
      if (dist < 2.2) {
        const pullDir = playerPos.clone().sub(item.mesh.position).normalize();
        item.mesh.position.addScaledVector(pullDir, delta * 7);

        if (dist < 0.6) {
          sounds.playPlace();
          if (onPickup) onPickup(item.type);
          this.scene.remove(item.mesh);
          item.mesh.geometry.dispose();
          this.droppedItems.splice(i, 1);
        }
      }
    }
  }

  updateSelection(targetBlock) {
    if (targetBlock) {
      this.selectionBox.position.set(
        targetBlock.x + 0.5,
        targetBlock.y + 0.5,
        targetBlock.z + 0.5
      );
      this.selectionBox.visible = true;
    } else {
      this.selectionBox.visible = false;
      this.crackMesh.visible = false;
    }
  }

  updateBreakingProgress(targetBlock, stage) {
    if (targetBlock && stage >= 0 && stage <= 9) {
      this.crackMesh.position.set(
        targetBlock.x + 0.5,
        targetBlock.y + 0.5,
        targetBlock.z + 0.5
      );
      this.crackMat.map = textures.get(`destroy_stage_${stage}`);
      this.crackMat.needsUpdate = true;
      this.crackMesh.visible = true;
    } else {
      this.crackMesh.visible = false;
    }
  }
}
