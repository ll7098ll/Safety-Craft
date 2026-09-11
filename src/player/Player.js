import * as THREE from 'three';
import { textures } from '../world/Textures.js';
import { sounds } from '../audio/SoundManager.js';

export class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.position = new THREE.Vector3(0, 0, 4);
    this.velocity = new THREE.Vector3();
    this.isGrounded = false;
    this.isThirdPerson = false;

    this.walkSpeed = 5.5;
    this.runSpeed = 8.8;
    this.jumpForce = 8.0;
    this.gravity = -24.0;

    this.yaw = 0;
    this.pitch = 0;

    this.walkCycle = 0;
    this.stepTimer = 0;
    this.swingProgress = 0;
    this.isSwinging = false;

    this.createAvatar();
    this.createFirstPersonArm();
    this.updateVisibility();

    this.currentHeldItemId = null;
  }

  createAvatar() {
    this.avatar = new THREE.Group();

    // 머리
    const headGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xc89664 });
    this.head = new THREE.Mesh(headGeom, headMat);
    this.head.position.set(0, 1.45, 0);
    this.head.castShadow = true;

    // 머리카락
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.15, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x4a2e12 })
    );
    hair.position.set(0, 0.15, 0);
    this.head.add(hair);

    // 눈
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x224499 });
    const eyeGeom = new THREE.BoxGeometry(0.06, 0.05, 0.02);
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.1, 0.02, 0.21);
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.1, 0.02, 0.21);
    this.head.add(leftEye);
    this.head.add(rightEye);
    this.avatar.add(this.head);

    // 몸통
    const bodyGeom = new THREE.BoxGeometry(0.4, 0.6, 0.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x009999 });
    this.body = new THREE.Mesh(bodyGeom, bodyMat);
    this.body.position.set(0, 0.95, 0);
    this.body.castShadow = true;
    this.avatar.add(this.body);

    // 양팔
    const armGeom = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xc89664 });
    this.leftArm = new THREE.Mesh(armGeom, armMat);
    this.leftArm.position.set(-0.3, 0.95, 0);
    this.leftArm.castShadow = true;
    this.avatar.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeom, armMat);
    this.rightArm.position.set(0.3, 0.95, 0);
    this.rightArm.castShadow = true;
    this.avatar.add(this.rightArm);

    // 양다리
    const legGeom = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2b3866 });
    this.leftLeg = new THREE.Mesh(legGeom, legMat);
    this.leftLeg.position.set(-0.1, 0.3, 0);
    this.leftLeg.castShadow = true;
    this.avatar.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeom, legMat);
    this.rightLeg.position.set(0.1, 0.3, 0);
    this.rightLeg.castShadow = true;
    this.avatar.add(this.rightLeg);

    this.scene.add(this.avatar);
  }

  createFirstPersonArm() {
    this.fparmGroup = new THREE.Group();

    // 청록색 소매
    const sleeve = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.25, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x009999 })
    );
    sleeve.position.set(0, 0, 0.15);
    this.fparmGroup.add(sleeve);

    // 손
    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.22, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xc89664 })
    );
    hand.position.set(0, 0, -0.15);
    this.fparmGroup.add(hand);

    // 손에 쥐는 3D 아이템 슬롯 그룹
    this.heldItemAnchor = new THREE.Group();
    this.heldItemAnchor.position.set(0, 0.05, -0.32);
    this.fparmGroup.add(this.heldItemAnchor);

    this.fparmGroup.position.set(0.38, -0.32, -0.55);
    this.camera.add(this.fparmGroup);
    this.scene.add(this.camera);
  }

  // 1인칭 오른손에 선택된 핫바 아이템 3D 장착
  setHeldItem(itemId) {
    if (this.currentHeldItemId === itemId) return;
    this.currentHeldItemId = itemId;

    // 기존 쥐고 있던 아이템 제거
    while (this.heldItemAnchor.children.length > 0) {
      const obj = this.heldItemAnchor.children[0];
      this.heldItemAnchor.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }

    if (!itemId) return;

    let itemMesh = null;
    switch (itemId) {
      case 'extinguisher': {
        // 소화기 미니어처
        const group = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.32, 10),
          new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.3 })
        );
        group.add(body);
        const nozzle = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.08, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        nozzle.position.set(0, 0.18, -0.04);
        group.add(nozzle);
        group.rotation.x = Math.PI / 4;
        itemMesh = group;
        break;
      }

      case 'glow_strip': {
        // 야광 가드
        itemMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.28, 8),
          new THREE.MeshBasicMaterial({ color: 0x55ff00 })
        );
        itemMesh.rotation.z = Math.PI / 4;
        break;
      }

      case 'co_detector': {
        // 일산화탄소 경보기
        itemMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.18, 0.06),
          textures.createMaterial('co_detector')
        );
        break;
      }

      case 'oak_planks': {
        // 나무 판자 블록
        itemMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.2, 0.2),
          textures.createMaterial('oak_planks')
        );
        break;
      }

      case 'water_bucket': {
        // 물 양동이
        const group = new THREE.Group();
        const bucket = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.07, 0.22, 10),
          new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8 })
        );
        group.add(bucket);
        const water = new THREE.Mesh(
          new THREE.CircleGeometry(0.09, 8),
          new THREE.MeshBasicMaterial({ color: 0x3366cc })
        );
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0.1;
        group.add(water);
        itemMesh = group;
        break;
      }

      case 'torch': {
        // 횃불
        const group = new THREE.Group();
        const stick = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.28, 0.04),
          textures.createMaterial('wood_log')
        );
        group.add(stick);
        const flame = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.08, 0.06),
          new THREE.MeshBasicMaterial({ color: 0xff6600 })
        );
        flame.position.y = 0.16;
        group.add(flame);
        group.rotation.x = Math.PI / 6;
        itemMesh = group;
        break;
      }

      case 'cooler': {
        // 아이스박스
        itemMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.18, 0.18),
          new THREE.MeshStandardMaterial({ color: 0x2288dd })
        );
        break;
      }

      case 'cooked_beef': {
        // 고기
        itemMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.08, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x883322 })
        );
        break;
      }
    }

    if (itemMesh) {
      this.heldItemAnchor.add(itemMesh);
    }
  }

  swingArm() {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  toggleCameraView() {
    this.isThirdPerson = !this.isThirdPerson;
    this.updateVisibility();
    return this.isThirdPerson;
  }

  updateVisibility() {
    if (this.avatar) {
      this.avatar.visible = this.isThirdPerson;
    }
    if (this.fparmGroup) {
      this.fparmGroup.visible = !this.isThirdPerson;
    }
  }

  update(delta, input, collisionBoxes = []) {
    const speed = input.shift ? this.runSpeed : this.walkSpeed;
    const moveDir = new THREE.Vector3();

    if (input.forward) moveDir.z -= 1;
    if (input.backward) moveDir.z += 1;
    if (input.left) moveDir.x -= 1;
    if (input.right) moveDir.x += 1;

    const isMoving = moveDir.lengthSq() > 0;
    if (isMoving) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      this.stepTimer += delta * (input.shift ? 15 : 9);
      if (this.stepTimer > 3.14 && this.isGrounded) {
        this.stepTimer = 0;
        sounds.playFootstep();
      }

      this.walkCycle += delta * (input.shift ? 16 : 10);
    } else {
      this.velocity.x *= 0.6;
      this.velocity.z *= 0.6;
      this.walkCycle = 0;
    }

    if (input.jump && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      sounds.playJump();
    }

    this.velocity.y += this.gravity * delta;

    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;
    const nextY = this.position.y + this.velocity.y * delta;

    this.position.x = Math.max(-34, Math.min(34, nextX));
    this.position.z = Math.max(-34, Math.min(34, nextZ));

    let groundY = 0;
    // 계곡 및 통나무 다리 높이 판정
    if (this.position.x >= -19.5 && this.position.x <= -12.5) {
      if (this.position.z >= -1.6 && this.position.z <= 1.6) {
        groundY = 1.0; // 다리 상판
      } else if (this.position.x >= -18.5 && this.position.x <= -13.5) {
        groundY = -0.4; // 계곡 수면
      }
    }

    if (nextY <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.position.y = nextY;
      this.isGrounded = false;
    }

    this.avatar.position.copy(this.position);
    this.avatar.rotation.y = this.yaw;

    const armSwing = Math.sin(this.walkCycle) * 0.6;
    const legSwing = Math.sin(this.walkCycle) * 0.7;
    this.leftArm.rotation.x = armSwing;
    this.rightArm.rotation.x = -armSwing;
    this.leftLeg.rotation.x = -legSwing;
    this.rightLeg.rotation.x = legSwing;

    if (this.fparmGroup) {
      if (this.isSwinging) {
        this.swingProgress += delta * 12;
        const swingAngle = Math.sin(this.swingProgress * Math.PI) * 0.8;
        this.fparmGroup.rotation.x = -swingAngle;
        this.fparmGroup.rotation.y = swingAngle * 0.4;
        if (this.swingProgress >= 1.0) {
          this.isSwinging = false;
          this.fparmGroup.rotation.set(0, 0, 0);
        }
      }

      if (isMoving && !this.isSwinging) {
        this.fparmGroup.position.y = -0.32 + Math.abs(Math.sin(this.walkCycle)) * 0.04;
        this.fparmGroup.position.x = 0.38 + Math.cos(this.walkCycle * 0.5) * 0.03;
      } else if (!this.isSwinging) {
        this.fparmGroup.position.set(0.38, -0.32, -0.55);
      }
    }

    if (this.isThirdPerson) {
      const camDist = 3.6;
      const camHeight = 1.9;
      const camOffsetX = -Math.sin(this.yaw) * camDist;
      const camOffsetZ = -Math.cos(this.yaw) * camDist;

      this.camera.position.set(
        this.position.x + camOffsetX,
        this.position.y + camHeight + Math.sin(this.pitch) * 1.5,
        this.position.z + camOffsetZ
      );
      this.camera.lookAt(this.position.x, this.position.y + 1.2, this.position.z);
    } else {
      this.camera.position.set(this.position.x, this.position.y + 1.45, this.position.z);
      this.camera.rotation.set(0, 0, 0);
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    }
  }
}
