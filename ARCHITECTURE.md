# 🏗️ 시스템 아키텍처 명세서 (Architecture Specification)

본 문서는 **[세이프티 크래프트 (Safety Craft)]**의 내부 소프트웨어 아키텍처, 렌더링 파이프라인, 모듈 간 상호작용 및 최적화 설계를 기술합니다.

---

## 1. 전체 시스템 개요 (System Overview)

본 프로젝트는 외부 3D 에셋(.gltf/.obj)이나 무거운 외부 사운드 라이브러리에 의존하지 않고, **순수 Three.js와 Web Audio API, Vanilla JavaScript**만을 활용하여 경량화 및 완전한 자립성을 달성한 웹 복셀 게임 엔진입니다.

```mermaid
flowchart TB
    subgraph Browser ["Web Browser Environment"]
        DOM["HTML5 Canvas & UI Overlay Container"]
    end

    subgraph CoreEngine ["Core Engine Layer (main.js)"]
        GameLoop["Game Loop (requestAnimationFrame)"]
        Clock["THREE.Clock (Delta Calculation)"]
        Renderer["THREE.WebGLRenderer (PCFShadowMap)"]
        Camera["THREE.PerspectiveCamera (YXZ Rotation)"]
        Raycaster["Target Block Raycaster"]
    end

    subgraph WorldLayer ["World & Environment Layer"]
        VoxelWorld["VoxelWorld (InstancedMesh Manager)"]
        Textures["TextureGenerator (Procedural 16x16)"]
        DayNight["DayNightCycle (Sun/Moon & Clouds)"]
        CampingObj["CampingObjects (Tent, BBQ, Props)"]
        WildBoar["WildBoar (Patrol AI Entity)"]
        NPCMgr["NPCManager (Entity Lifecycle & Spatial Index)"]
        NPCs["3D Voxel NPCs (Squirrel, Ranger, Camper, Chef, Arin)"]
        Critters["Wild Animals (Rabbits, Camp Dog)"]
    end

    subgraph PlayerLayer ["Player & Control Layer"]
        Player["Player Avatar (1st/3rd Person & Physics)"]
        Controls["Controls (PointerLock, Keyboard [WASD/F/J], Hotbar)"]
    end

    subgraph GameplayLayer ["Gameplay & Simulation Layer"]
        QuestMgr["QuestManager (Main Episodes & NPC Dialogue)"]
        RPGSystem["RPGSystem (Level, XP, Acorns, Buffs, SideQuests)"]
        SafetyGauge["SafetyGauge (Hazard Calculation)"]
        QuizSys["QuizSystem (Question Bank & Evaluation)"]
    end

    subgraph UILayer ["User Interface (HTML/CSS Overlay)"]
        HUD["HUD (Hearts, Food, Level/Acorns Badge, Hotbar)"]
        RPGDialogue["RPGDialogueModal (Typing, Portrait, Options)"]
        ShopGUI["ShopModal (Ranger Gear & Food Store)"]
        QuestJournal["QuestJournalModal (Quest Book [J])"]
        Inventory["InventoryGUI (2x2 Crafting & 3D Preview)"]
        CertModal["CertificateModal (Award Canvas)"]
        PauseMenu["PauseMenu (Settings & Guide)"]
    end

    subgraph AudioLayer ["Procedural Audio Layer"]
        SoundMgr["SoundManager (Web Audio API Synthesizer)"]
    end

    DOM --> CoreEngine
    GameLoop --> Clock
    Clock --> Controls
    Clock --> Player
    Clock --> VoxelWorld
    Clock --> DayNight
    Clock --> CampingObj
    Clock --> WildBoar
    Clock --> NPCMgr
    Clock --> RPGSystem
    Clock --> SafetyGauge
    Clock --> HUD

    Player --> Raycaster
    Raycaster --> VoxelWorld

    NPCMgr --> NPCs
    NPCMgr --> Critters
    Controls --> NPCMgr

    QuestMgr --> SafetyGauge
    QuestMgr --> CampingObj
    QuestMgr --> WildBoar
    QuestMgr --> RPGSystem

    RPGDialogue --> RPGSystem
    RPGDialogue --> QuestMgr
    ShopGUI --> RPGSystem
    QuestJournal --> QuestMgr
    QuestJournal --> RPGSystem

    Inventory --> Player
    HUD --> QuestMgr
    HUD --> SafetyGauge
    HUD --> RPGSystem
    CertModal --> QuizSys

    VoxelWorld --> Textures
    CampingObj --> Textures
    DayNight --> Textures

    Player --> SoundMgr
    VoxelWorld --> SoundMgr
    QuestMgr --> SoundMgr
    RPGSystem --> SoundMgr
    HUD --> SoundMgr
```

---

## 2. 계층별 모듈 상세 설계

### 2.1 World & Voxel Rendering Engine (`src/world/`)

#### A. `VoxelWorld.js` (대규모 복셀 인스턴스드 렌더러)
- **18,147개 블록 관리**:
  - 초기화 시 모든 복셀 위치를 해시맵(`this.blocks: Map<"x,y,z", BlockData>`)에 등록합니다.
  - `buildInstancedMeshes()`를 통해 동일한 재질을 공유하는 블록군을 분류하여 **블록 타입별 단 1개의 `THREE.InstancedMesh`**로 일괄 생성합니다.
  - 드로우콜을 약 37,000회에서 **125회로 99.66% 압축**합니다.
- **동적 채굴(Mining) & 설치(Placing)**:
  - **파괴(`removeBlock`)**: 해당 인스턴스의 트랜스폼 매트릭스를 `makeScale(0, 0, 0)`으로 변환하여 버퍼 재할당 없이 $O(1)$로 즉시 소멸 처리합니다.
  - **설치(`setBlock`)**: 런타임에 동적으로 설치되는 블록은 개별 `THREE.Mesh`로 씬에 등록되어 즉각적인 피드백을 제공합니다.
- **레이캐스팅 가속**:
  - 18,000개 개별 메쉬를 순회하지 않고, 9개의 `InstancedMesh`에 대해 교차점을 판정한 후 `hit.point`와 `hit.face.normal`로부터 복셀 정수 좌표를 역산합니다.
  - `getBlock(x, y, z)`를 통해 이미 파괴된 슬롯을 이중 필터링합니다.

#### B. `Textures.js` (절차적 픽셀아트 텍스처 제너레이터)
- 외부 이미지 파일 로딩 시 발생하는 네트워크 병목 및 CORS 문제를 해결하기 위해, HTML5 `<canvas>` 요소를 통해 **16x16 픽셀아트 텍스처를 런타임에 절차적으로 생성(Procedural Generation)**합니다.
- 생성된 `CanvasTexture`는 내부 `Map` 캐시에 보관되어 메모리 중복을 방지합니다 (`NearestFilter` 적용으로 마인크래프트 특유의 선명한 픽셀 보장).

#### C. `DayNightCycle.js` (실시간 환경 조명 및 구름)
- 정육면체 태양과 달이 `timeOfDay (0.0 ~ 1.0)` 변수에 따라 공전합니다.
- 낮과 밤 상태에 따라 주 광원(`DirectionalLight`), 환경광(`AmbientLight`), 씬 안개(`FogExp2`), 하늘색(`background`)이 부드럽게 보간됩니다.
- 고도 26m의 3D 복셀 구름층은 180개의 박스로 구성된 단일 `InstancedMesh`로 x축 수평 이동 애니메이션을 수행합니다.

---

### 2.2 Player & Physics Layer (`src/player/`)

#### A. `Player.js`
- **시점 모드**: 1인칭(카메라 부착 스킨 오른손)과 3인칭(전신 아바타) 간 자유로운 전환(`V` 키).
- **물리 및 충돌**:
  - 중력 가속도(`gravity = -24.0 m/s²`)와 점프력(`jumpForce = 8.0 m/s`).
  - 계곡 수면(`y = -0.4`)과 통나무 다리 상판(`y = 1.0`), 일반 지면(`y = 0.0`)의 높낮이 단차를 지형 좌표에 따라 부드럽게 판정.
- **보행 및 스윙 애니메이션**:
  - `walkCycle` 삼각함수 연산을 통한 팔다리 교차 스윙.
  - 1인칭 시점의 뷰 바빙(View Bobbing) 및 채굴/타격 시 손 휘두르기(Arm Swing).

#### B. `Controls.js`
- 듀얼 입력 체계 지원:
  - 저학년 초등학생을 위한 **마우스 드래그 자유 시점 회전** 모드.
  - FPS 게이머를 위한 **더블 클릭 포인터 락(Pointer Lock API)** 모드.
- 마우스 휠 델타 기반 9칸 핫바 순환 선택.

---

### 2.3 RPG & Education State Machine Layer (`src/gameplay/`)

#### A. `RPGSystem.js` (레벨, 재화 경제 및 버프 상태 머신)
- **안전 경험치(XP) 및 레벨링 곡선**:
  - 다음 레벨 도달 필요 경험치: $\text{xpToNext} = \text{floor}(\text{xpToNext} \times 1.5)$
  - 레벨업 시 팡파르 발동 및 스탯 보너스 부여 (`🌱 캠핑 입문자` ~ `👑 전설의 캠핑 히어로`)
- **도토리 코인(`🌰`) 경제 시스템**:
  - 퀘스트 완료, 환경 정화, 블록 채굴 활동을 통한 재화 획득 및 상점 거래
- **시간제 버프(Buff) 상태 관리**:
  - `speed` (이동속도 +35%), `co_shield` (일산화탄소 위험도 50% 차단), `lantern` (야간 시야 20m 확장)
  - 델타 타임 기반 타이머 감쇠 및 수명 종료 시 원래 스탯 자동 복원

#### B. `QuestManager.js`
- 6단계의 메인 안전 퀘스트 진행 상태 머신과 각 NPC별 대화 분기(`getNPCDialogue`) 매핑
- 서브 퀘스트(장작 비축, 옥수수 배달, 클린 캠핑 쓰레기 수거)의 진행률 추적 및 인벤토리 아이템 자동 검증

#### C. `SafetyGauge.js`
- 실시간 위험도 지수 연산:
  - `coDanger`: 텐트 내부 체류 시간 및 환기창/경보기 유무에 따라 실시간 증감.
  - `fireDanger`: 모닥불 소화 여부 및 과대불판 제거 여부.
  - `tripDanger`: 4개 스트링의 야광 가드 부착 수에 따라 비례 감소.
  - `wildlifeDanger`: 잔여 음식 아이스박스 밀폐 여부.

---

### 2.4 3D 복셀 NPC & Entity Engine Layer (`src/entities/`)

#### A. `BaseNPC.js` (절차적 복셀 캐릭터 베이스 리그)
- Three.js 기하학을 조합한 머리, 몸통, 팔, 다리, 고유 복장(모자, 꼬리, 지팡이 등) 구조.
- **실시간 시선 추적(`lookAtTarget`)**: 플레이어 접근 시 고개 각도를 오일러 YXZ 행렬로 보간 연산하여 자연스럽게 응시.
- **3D 캔버스 빌보드 네임태그**: HTML5 Canvas에 역할과 이름을 렌더링하고 `THREE.Sprite`로 변환하여 항상 카메라를 정면으로 바라봄.
- **3D 퀘스트 마커**: 머리 위에서 Y축으로 회전하며 상하 $\sin$ 바운스하는 골드 느낌표(`!`) 메쉬.

#### B. `NPCList.js` & `NPCManager.js`
- 5인의 개성적 복셀 NPC와 야생동물(토끼 3마리 홉 물리, 순찰 시바견) 인스턴스 총괄.
- $O(N)$ 거리 기반 레이더 쿼리를 통해 가장 가까운 NPC(`getNearbyNPC`) 및 쓰레기 오브젝트(`getNearbyLitter`)를 실시간 감지하여 HUD에 상호작용 액션 디스패치.

---

### 2.5 RPG UI & Modal Layer (`src/ui/`)

#### A. `RPGDialogueModal.js`
- 텍스트 28ms 간격 타이핑 애니메이션 및 Web Audio API 절차적 토크 비프 사운드 연동.
- 키보드 숫자키 (`1~4`), 스페이스바, ESC 단축키 지원.

#### B. `ShopModal.js`
- 박 반장의 안전장비점 & 셰프 쿠킹 밥의 캠핑 레스토랑 카탈로그 렌더링.
- 도토리 잔액 실시간 검증 및 원클릭 버프/아이템 수령.

#### C. `QuestJournalModal.js`
- `J` 키로 토글되는 정통 2열 양피지 퀘스트 북.
- 메인 퀘스트 단계별 달성도 및 NPC 서브 퀘스트 진행률 바 시각화.

#### D. `HUD.js` (DOM Caching & Dirty Checking)
- 레벨 뱃지, 도토리 지갑, 퀘스트 북 퀵 버튼 및 크로스헤어 상호작용 팁 안내.
- Dirty Checking으로 이전 상태와 값이 달라졌을 때만 갱신하여 60 FPS 무손실 렌더링 보장.

---

### 2.6 Procedural Audio Synthesizer (`src/audio/SoundManager.js`)

외부 오디오 에셋 의존성 없이 Web Audio API로 마인크래프트풍 사운드를 실시간 합성:
- **발걸음(`playFootstep`)**: 화이트 노이즈 버퍼 + 저주파 필터
- **블록 파괴/설치(`playPlace`)**: 삼각파 피치 벤딩
- **경보음(`playAlarm`)**: 880Hz / 1760Hz 구형파 교차 발진
- **NPC 목소리(`playNpcVoice`)**: 480~720Hz 랜덤 주파수 삼각파 비프음
- **도토리 코인(`playCoin`)**: 고주파수 2화음 찰랑임
- **퀘스트 수락/완료(`playQuestAccept`, `playQuestComplete`)**: A major / C major 아르페지오 팡파르
- **레벨업(`playLevelUp`)**: 6음계 상승 아르페지오 사운드

---

## 3. 메모리 및 가비지 컬렉션(GC) 최적화 전략

1. **Object Re-use (객체 재활용)**:
   - 프레임 루프 내부에서 `new THREE.Vector3()`나 `new THREE.Matrix4()`의 동적 생성을 금지하고, 클래스 인스턴스 멤버 변수(`dummy`, `tempVec`)를 선언하여 재활용합니다.
2. **BufferGeometry 메모리 해제**:
   - 블록 파괴, 드롭 아이템 획득 시 `geometry.dispose()`와 `material.dispose()`를 명시적으로 호출하여 WebGL 텍스처 및 VBO 버퍼 누수를 방지합니다.
3. **Shadow Map Culling**:
   - 화면 최하단 잔디 블록(y = -1)은 그림자를 투사할 대상이 없으므로 `castShadow = false`로 지정하여 섀도우 패스 렌더링 부하를 50% 절감했습니다.
