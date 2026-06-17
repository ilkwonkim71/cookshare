# 라벨 정의

이 저장소의 표준 라벨입니다. `gh` CLI로 일괄 생성할 수 있습니다 (맨 아래 스크립트 참고).

## 우선순위 (Priority) — `docs/MVP-SPEC.md` 기준

| 라벨 | 색상      | 의미                  |
| ---- | --------- | --------------------- |
| `P0` | `#b60205` | Must-have. 출시 필수. |
| `P1` | `#d93f0b` | Should-have. 중요.    |
| `P2` | `#fbca04` | Nice-to-have. 선택.   |

## 유형 (Type)

| 라벨             | 색상      | 의미             |
| ---------------- | --------- | ---------------- |
| `type: story`    | `#0e8a16` | 사용자 스토리    |
| `type: feature`  | `#1d76db` | 신규 기능 제안   |
| `type: bug`      | `#e11d21` | 버그             |
| `type: chore`    | `#c5def5` | 인프라/설정/잡무 |
| `type: docs`     | `#bfd4f2` | 문서             |
| `type: security` | `#b60205` | 보안             |

## 영역 (Area)

| 라벨              | 색상      | 의미              |
| ----------------- | --------- | ----------------- |
| `area: frontend`  | `#5319e7` | Next.js 앱        |
| `area: backend`   | `#006b75` | Express API       |
| `area: fullstack` | `#0052cc` | FE/BE 양쪽 / 계약 |
| `area: infra`     | `#444444` | CI/배포/툴링      |

## 심각도 (Severity) — `docs/RISK-ANALYSIS.md` 기준

| 라벨               | 색상      | 의미            |
| ------------------ | --------- | --------------- |
| `severity: high`   | `#b60205` | 🔴 출시 차단    |
| `severity: medium` | `#d93f0b` | 🟠 출시 전/직후 |
| `severity: low`    | `#fbca04` | 🟡 모니터링     |

## 상태 (Status)

| 라벨                   | 색상      | 의미                 |
| ---------------------- | --------- | -------------------- |
| `status: blocked`      | `#000000` | 선행 의존성으로 막힘 |
| `status: in progress`  | `#fbca04` | 진행 중              |
| `status: needs review` | `#0e8a16` | 리뷰 대기            |
| `good first issue`     | `#7057ff` | 신규 기여자용        |

---

## 일괄 생성 스크립트 (gh CLI)

```bash
# 우선순위
gh label create P0 --color b60205 --description "Must-have (출시 필수)" --force
gh label create P1 --color d93f0b --description "Should-have (중요)" --force
gh label create P2 --color fbca04 --description "Nice-to-have (선택)" --force
# 유형
gh label create "type: story"    --color 0e8a16 --force
gh label create "type: feature"  --color 1d76db --force
gh label create "type: bug"      --color e11d21 --force
gh label create "type: chore"    --color c5def5 --force
gh label create "type: docs"     --color bfd4f2 --force
gh label create "type: security" --color b60205 --force
# 영역
gh label create "area: frontend"  --color 5319e7 --force
gh label create "area: backend"   --color 006b75 --force
gh label create "area: fullstack" --color 0052cc --force
gh label create "area: infra"     --color 444444 --force
# 심각도
gh label create "severity: high"   --color b60205 --force
gh label create "severity: medium" --color d93f0b --force
gh label create "severity: low"    --color fbca04 --force
# 상태
gh label create "status: blocked"      --color 000000 --force
gh label create "status: in progress"  --color fbca04 --force
gh label create "status: needs review" --color 0e8a16 --force
gh label create "good first issue"     --color 7057ff --force
```
