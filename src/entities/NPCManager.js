import * as THREE from 'three';
import {
  SquirrelLeaderNPC,
  RangerParkNPC,
  CamperMinsuNPC,
  ChefBobNPC,
  RangerArinNPC,
  RabbitEntity,
  CampDogEntity
} from './NPCList.js';

export class NPCManager {
  constructor(scene, rpgSystem) {
    this.scene = scene;
    this.rpgSystem = rpgSystem;

    this.npcs = [];
    this.animals = [];
    this.litterMeshes = [];

    this.initNPCs();
    this.initAnimals();
    this.initLitterProps();
  }

  initNPCs() {
    // 1. 도토리 대장 (캠핑장 입구 안내소 앞 명당)
    const squirrel = new SquirrelLeaderNPC(this.scene, {
      position: new THREE.Vector3(0, 0, 8.5),
      rotationY: Math.PI
    });
    this.npcs.push(squirrel);

    // 2. 관리소장 박 반장 (좌측 관리동 초소 앞)
    const park = new RangerParkNPC(this.scene, {
      position: new THREE.Vector3(-6.5, 0, 6.0),
      rotationY: 0.5
    });
    this.npcs.push(park);

    // 3. 초보 캠퍼 민수 (우측 텐트 및 화로대 구역)
    const minsu = new CamperMinsuNPC(this.scene, {
      position: new THREE.Vector3(4.2, 0, 5.2),
      rotationY: -1.3
    });
    this.npcs.push(minsu);

    // 4. 방랑 셰프 쿠킹 밥 (피크닉 테이블 및 바베큐장 옆)
    const chef = new ChefBobNPC(this.scene, {
      position: new THREE.Vector3(5.8, 0, -1.8),
      rotationY: -2.3
    });
    this.npcs.push(chef);

    // 5. 에코 레인저 아린 (계곡 및 숲길 어귀)
    const arin = new RangerArinNPC(this.scene, {
      position: new THREE.Vector3(-5.2, 0, -4.8),
      rotationY: 0.7
    });
    this.npcs.push(arin);
  }

  initAnimals() {
    // 깡총깡총 뛰어다니는 토끼 3마리 (풀밭 곳곳)
    this.animals.push(new RabbitEntity(this.scene, 7.5, 8.0));
    this.animals.push(new RabbitEntity(this.scene, -8.0, 2.0));
    this.animals.push(new RabbitEntity(this.scene, -2.5, -8.5));

    // 캠핑장 마스코트 시바견 1마리 (도토리 대장과 박 반장 사이를 순찰)
    const dog = new CampDogEntity(this.scene, -2.0, 6.5);
    this.animals.push(dog);
  }

  initLitterProps() {
    // 클린 캠핑 퀘스트용 쓰레기 3D 오브젝트
    const canMat = new THREE.MeshStandardMaterial({ color: 0x2288dd, metalness: 0.8, roughness: 0.2 });
    const bottleMat = new THREE.MeshStandardMaterial({ color: 0x88eeff, transparent: true, opacity: 0.8 });
    const bagMat = new THREE.MeshStandardMaterial({ color: 0xddaa22 });

    this.rpgSystem.litterItems.forEach((item, index) => {
      const group = new THREE.Group();
      group.position.set(item.x, item.y, item.z);

      let mesh;
      if (index === 0) {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 8), canMat);
        mesh.rotation.z = Math.PI / 2;
      } else if (index === 1) {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.28, 8), bottleMat);
        mesh.rotation.x = Math.PI / 2;
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.2), bagMat);
      }
      mesh.castShadow = true;
      group.add(mesh);

      this.scene.add(group);
      this.litterMeshes.push({ data: item, group });
    });
  }

  update(delta, playerPosition) {
    // NPC 업데이트
    for (const npc of this.npcs) {
      npc.update(delta, playerPosition);
    }

    // 야생동물 업데이트
    for (const animal of this.animals) {
      animal.update(delta, playerPosition);
    }

    // 쓰레기 오브젝트 회전 반짝임
    for (const litter of this.litterMeshes) {
      if (litter.data.collected) {
        litter.group.visible = false;
      } else {
        litter.group.rotation.y += delta * 1.5;
      }
    }
  }

  // 플레이어 근처 NPC 탐색 (대화 가능 거리: 기본 3.5m)
  getNearbyNPC(playerPosition, maxDist = 3.6) {
    let closestNPC = null;
    let minDist = maxDist;

    for (const npc of this.npcs) {
      const dist = npc.group.position.distanceTo(playerPosition);
      if (dist < minDist) {
        minDist = dist;
        closestNPC = npc;
      }
    }

    return closestNPC;
  }

  // 플레이어 근처 쓰레기 오브젝트 탐색 (줍기 거리: 2.2m)
  getNearbyLitter(playerPosition, maxDist = 2.2) {
    for (const litter of this.litterMeshes) {
      if (!litter.data.collected) {
        const dist = litter.group.position.distanceTo(playerPosition);
        if (dist < maxDist) {
          return litter;
        }
      }
    }
    return null;
  }

  collectLitter(litterId) {
    const target = this.litterMeshes.find(l => l.data.id === litterId);
    if (target && !target.data.collected) {
      target.data.collected = true;
      target.group.visible = false;
      return target.data;
    }
    return null;
  }

  getNPC(id) {
    return this.npcs.find(n => n.id === id);
  }

  setNPCQuestState(id, state) {
    const npc = this.getNPC(id);
    if (npc) {
      npc.setQuestState(state);
    }
  }
}
