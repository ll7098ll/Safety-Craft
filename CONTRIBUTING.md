# 🤝 기여 가이드라인 (Contributing Guidelines)

**[세이프티 크래프트 (Safety Craft)]** 프로젝트에 관심을 가져주셔서 감사합니다!  
본 프로젝트는 초등학생을 비롯한 모든 어린이들이 캠핑 안전 수칙을 재미있고 자연스럽게 체득할 수 있도록 돕는 오픈소스 게이미피케이션 프로젝트입니다. 버그 제보, 기능 개선, 코드 리팩토링, 번역 등 모든 형태의 기여를 환영합니다.

---

## 🛠️ 개발 환경 설정 (Development Setup)

1. **사전 요구사항**:
   - Node.js `v18.0.0` 이상 권장
   - npm `v9.0.0` 이상
2. **저장소 포크 및 복제**:
   ```bash
   git clone https://github.com/your-username/safety-craft.git
   cd safety-craft
   ```
3. **의존성 설치 및 로컬 서버 실행**:
   ```bash
   npm install
   npm run dev
   ```
   기본 주소 `http://localhost:5173`으로 접속하여 변경 사항이 실시간(HMR)으로 반영되는지 확인합니다.

---

## 🌿 브랜치 전략 (Git Flow)

- `main`: 상시 배포 가능한 안정 버전 (Production Ready)
- 브랜치 네이밍 규칙:
  - `feat/기능이름`: 새로운 게임플레이 미션, 3D 오브젝트, 사운드 추가
  - `fix/버그이름`: 물리 버그, 렌더링 결함, UI 오작동 수정
  - `perf/최적화내용`: 드로우콜 개선, 메모리 절약, 레이캐스팅 최적화
  - `docs/문서내용`: README, 안전 가이드, 주석 등 문서화 작업

---

## 📝 커밋 메시지 컨벤션 (Commit Convention)

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 준수합니다:

```
<타입>(<영역>): <설명>

예시:
feat(world): add new pine tree clustering algorithm
fix(raycast): resolve block targeting offset during camera rotation
perf(render): migrate mountain voxel blocks to InstancedMesh
docs(readme): add high-resolution screenshot gallery
refactor(hud): implement dirty checking for DOM updates
```

| 타입 | 의미 |
| :--- | :--- |
| `feat` | 새로운 기능 및 콘텐츠 추가 |
| `fix` | 버그 수정 |
| `perf` | 렌더링 속도, 메모리 절약 등 성능 개선 |
| `refactor` | 동작 변경 없는 코드 구조 개선 |
| `docs` | 마크다운 문서 및 주석 수정 |
| `style` | 코드 포맷팅, 세미콜론 누락 등 (로직 영향 없음) |
| `chore` | 빌드 스크립트, 패키지 설정 수정 |

---

## 📐 코딩 스타일 및 설계 원칙

1. **바닐라 자바스크립트 및 모듈성**:
   - 외부 거대 프레임워크(React, Vue 등) 없이 **순수 ES6+ 모듈**로 작성합니다.
   - 클래스 기반 모듈화(`export class ...`)를 지향하며 각 파일의 단일 책임 원칙을 유지합니다.
2. **Three.js 렌더링 최적화 준수**:
   - 루프 내부(`animate()`, `update()`)에서 `new THREE.Vector3()` 등 동적 객체 할당을 엄격히 금지합니다.
   - 복셀 블록 추가 시 `VoxelWorld`의 `InstancedMesh` 파이프라인을 통하도록 구성합니다.
   - 지오메트리나 머티리얼 제거 시 `.dispose()`를 명시하여 메모리 누수를 차단합니다.
3. **웹 접근성 및 반응형 UI**:
   - 마인크래프트 감성의 픽셀 폰트와 고대비 색상을 유지하며 저사양 모니터 및 태블릿 브라우저에서도 깨짐 없는 레이아웃을 작성합니다.

---

## 🚀 Pull Request (PR) 절차

1. 변경 사항을 반영한 로컬 테스트 및 빌드 검증:
   ```bash
   npm run build
   ```
2. 콘솔 에러 및 린트 경고가 없는지 브라우저 개발자 도구(F12)에서 확인.
3. 명확하고 구체적인 제목과 작업 내용, 스크린샷(UI 변경 시 필수)을 첨부하여 PR을 생성합니다.
4. 리뷰어의 피드백을 반영하여 머지를 완료합니다.

---

기타 문의사항이나 아이디어가 있으시면 언제든 [GitHub Issues](https://github.com/your-username/block-camp-safety-hero/issues)를 통해 제안해 주세요!
