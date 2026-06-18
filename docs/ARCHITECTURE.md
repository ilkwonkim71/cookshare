# CookShare 아키텍처

레시피 공유 서비스의 시스템 아키텍처 문서입니다. 실제 스캐폴딩된 코드 구조를 기준으로 작성되었습니다.

- 대상 스택: Next.js 14 (App Router) / Express + TS / PostgreSQL / JWT / 로컬 이미지 저장
- 문서 버전: 2026-06-18 (실제 배포 구성 · CI/CD 다이어그램 반영)

---

## 0. 한눈에 보기 (쉬운 설명)

이 서비스는 **사용자 → Vercel(화면) → Render(API) → Supabase(데이터)** 로 흐르는, 세 덩어리로 나뉜 웹앱입니다.

```mermaid
flowchart TB
    User([👤 사용자 브라우저])
    FE["Vercel · 프론트엔드<br/>Next.js — 화면을 그림"]
    BE["Render · 백엔드<br/>Express — 로직 처리"]
    DB[(Supabase · DB<br/>PostgreSQL — 데이터 저장)]

    User -->|화면 요청| FE
    FE -->|"API 호출 (JSON + 로그인 토큰)"| BE
    BE -->|SQL 쿼리| DB
```

**각 덩어리가 하는 일**

| 덩어리     | 위치     | 역할                                    | 비유           |
| ---------- | -------- | --------------------------------------- | -------------- |
| 프론트엔드 | Vercel   | 사용자가 보는 화면 (목록·작성폼·로그인) | 식당 홀/메뉴판 |
| 백엔드     | Render   | 규칙 처리 (인증, 레시피 CRUD)           | 주방           |
| DB         | Supabase | 데이터 영구 저장 (회원, 레시피)         | 창고           |

**작동 흐름 (예: 레시피 작성)**

1. 사용자가 Vercel 화면에서 폼 작성 → 등록 클릭
2. 프론트가 Render 백엔드로 "이 레시피 저장해줘" + 로그인 토큰 전송
3. 백엔드가 토큰 확인(본인 맞나?) 후 Supabase에 저장
4. 결과를 화면에 표시

**기억할 포인트 3개**

- **세 곳이 분리**되어 각각 독립적으로 배포·확장 가능 (프론트만 고쳐도 백엔드 영향 없음)
- **연결 고리는 환경변수**: 프론트의 `NEXT_PUBLIC_API_URL`(→Render) + 백엔드의 `CORS_ORIGIN`(→Vercel 허용) + `DATABASE_URL`(→Supabase). 이게 어긋나면 "Failed to fetch"가 발생
- **인증은 토큰(JWT)**: 로그인 시 토큰을 발급받아 브라우저에 보관하고, 요청마다 함께 보내 신원을 증명

> 아래 1장부터는 위 그림을 계층·시퀀스·배포 관점으로 더 자세히 풀어 설명합니다.

---

## 1. 시스템 컨텍스트 (High-Level)

사용자, 프론트엔드, 백엔드, 저장소 간의 큰 그림입니다.

```mermaid
flowchart LR
    User([👤 사용자<br/>브라우저])

    subgraph Frontend["Frontend · Next.js 14 (:3000)"]
        Pages[App Router 페이지<br/>홈/상세/작성/로그인]
        APIClient[lib/api.ts<br/>fetch 래퍼 + JWT]
        AuthCtx[AuthContext<br/>localStorage 토큰]
    end

    subgraph Backend["Backend · Express + TS (:4000)"]
        REST[REST API<br/>/api/*]
        Static[정적 파일 서빙<br/>/uploads/*]
    end

    subgraph Storage["저장소"]
        DB[(PostgreSQL<br/>Supabase / Docker)]
        Files[/로컬 디스크<br/>uploads//]
    end

    User -->|HTTPS/HTML| Pages
    Pages --> APIClient
    Pages --> AuthCtx
    APIClient -->|JSON + Bearer JWT| REST
    User -->|이미지 GET| Static
    REST --> DB
    REST -->|저장| Files
    Static --> Files
```

---

## 2. 컴포넌트 아키텍처 (계층 구조)

백엔드의 요청 처리 계층과 프론트엔드의 모듈 구조입니다.

```mermaid
flowchart TB
    subgraph FE["Frontend (Next.js)"]
        direction TB
        FE_Pages["app/ 라우트<br/>page · layout"]
        FE_Comp["components/<br/>ui/* · recipe-card · header"]
        FE_Lib["lib/<br/>api.ts · auth.tsx · utils.ts"]
        FE_Pages --> FE_Comp
        FE_Pages --> FE_Lib
        FE_Comp --> FE_Lib
    end

    subgraph BE["Backend (Express)"]
        direction TB
        MW["Middleware<br/>cors · json · requireAuth · error"]
        Routes["Routes<br/>auth · recipe · upload"]
        Ctrl["Controllers<br/>요청/응답 처리 + zod 검증"]
        Models["Models/Services<br/>user.model · recipe.model"]
        StorageLayer["Storage 추상화<br/>Storage 인터페이스"]
        DBConn["db/index.ts<br/>pg Pool (node-postgres)"]

        MW --> Routes --> Ctrl
        Ctrl --> Models
        Ctrl --> StorageLayer
        Models --> DBConn
    end

    subgraph Infra["저장소"]
        Postgres[(PostgreSQL)]
        Disk[/uploads//]
    end

    FE_Lib -->|HTTP JSON| MW
    DBConn --> Postgres
    StorageLayer --> Disk
```

---

## 3. 데이터 모델 (ERD)

```mermaid
erDiagram
    USERS ||--o{ RECIPES : "작성한다"

    USERS {
        int     id PK
        string  email UK
        string  password_hash
        string  name
        string  created_at
    }

    RECIPES {
        int     id PK
        string  title
        string  description
        string  ingredients "JSON 배열 문자열"
        string  steps        "JSON 배열 문자열"
        string  image_url
        int     cook_time    "분"
        int     servings
        int     author_id FK
        string  created_at
        string  updated_at
    }
```

> `ingredients`/`steps`는 DB에 JSON 문자열로 저장하고, API 응답에서는 배열로 직렬화/역직렬화합니다.
> MVP 이후 확장 시 `likes`, `comments`, `tags`, `categories` 테이블이 추가될 수 있습니다(점선 영역).

---

## 4. 인증 흐름 (Sequence)

회원가입/로그인으로 JWT를 발급받고, 보호된 요청에 Bearer 토큰을 사용하는 흐름입니다.

```mermaid
sequenceDiagram
    actor U as 사용자
    participant FE as Frontend (api.ts/AuthContext)
    participant BE as Backend (auth.controller)
    participant DB as PostgreSQL

    Note over U,DB: 회원가입 / 로그인
    U->>FE: 이메일/비밀번호/이름 입력
    FE->>BE: POST /api/auth/login
    BE->>DB: 사용자 조회
    DB-->>BE: user(password_hash)
    BE->>BE: bcrypt.compare 검증
    BE->>BE: JWT 서명 (JWT_SECRET, exp)
    BE-->>FE: 200 { token, user }
    FE->>FE: localStorage에 token 저장

    Note over U,DB: 보호된 요청
    U->>FE: 레시피 작성 액션
    FE->>BE: POST /api/recipes<br/>Authorization: Bearer <token>
    BE->>BE: requireAuth: JWT 검증 → req.user
    alt 토큰 유효
        BE->>DB: INSERT recipe
        BE-->>FE: 201 { recipe }
    else 토큰 무효/만료
        BE-->>FE: 401 { error }
        FE->>FE: 로그아웃 처리 → /login
    end
```

---

## 5. 이미지 업로드 흐름 (Sequence)

레시피 작성 시 이미지를 먼저 업로드해 URL을 받고, 그 URL을 레시피에 연결합니다.

```mermaid
sequenceDiagram
    actor U as 사용자
    participant FE as Frontend
    participant BE as upload.controller
    participant ST as Storage (LocalStorage)
    participant DB as PostgreSQL

    U->>FE: 이미지 선택 + 레시피 폼 작성
    FE->>BE: POST /api/uploads (multipart, field=image)<br/>Bearer JWT
    BE->>BE: requireAuth + multer(MIME/5MB 검증)
    BE->>ST: save(buffer, filename)
    ST->>ST: uploads/ 에 파일 기록
    ST-->>BE: { url, key }
    BE-->>FE: 201 { url }
    FE->>BE: POST /api/recipes { ..., imageUrl: url }
    BE->>DB: INSERT recipe(image_url)
    BE-->>FE: 201 { recipe }
    Note over U,ST: 이후 조회 시 GET /uploads/<file> 로 이미지 로드
```

---

## 6. 스토리지 추상화 (로컬 → S3 전환 여지)

`Storage` 인터페이스로 저장 구현을 추상화하여, 환경 변수만으로 드라이버를 교체할 수 있습니다.

```mermaid
classDiagram
    class Storage {
        <<interface>>
        +save(buffer, filename) Promise~SaveResult~
        +delete(key) Promise~void~
    }
    class SaveResult {
        +string url
        +string key
    }
    class LocalStorage {
        -uploadDir
        -publicBaseUrl
        +save() ~로컬 디스크~
        +delete()
    }
    class S3Storage {
        -bucket
        -region
        +save() ~S3 PutObject~
        +delete() ~S3 DeleteObject~
    }
    class StorageFactory {
        +createStorage(driver) Storage
    }

    Storage <|.. LocalStorage : 현재 구현
    Storage <|.. S3Storage : 추후 추가
    Storage ..> SaveResult
    StorageFactory --> Storage : STORAGE_DRIVER

    note for S3Storage "MVP 이후 추가.<br/>STORAGE_DRIVER=s3 로 전환,<br/>컨트롤러 코드 변경 없음"
```

전환 절차:

1. `src/storage/s3.storage.ts`에 `S3Storage` 구현 추가
2. `src/storage/index.ts` 팩토리에 `s3` 분기 추가
3. 환경 변수 `STORAGE_DRIVER=s3` + S3 자격증명 설정
4. 컨트롤러/라우트는 `Storage` 인터페이스에만 의존하므로 변경 불필요

---

## 7. 요청 처리 파이프라인 (미들웨어 체인)

```mermaid
flowchart LR
    Req([요청]) --> CORS[CORS]
    CORS --> JSON[json 파서]
    JSON --> Route{라우트 매칭}
    Route -->|보호 라우트| Auth[requireAuth<br/>JWT 검증]
    Route -->|공개 라우트| Ctrl
    Auth --> Ctrl[Controller<br/>+ zod 검증]
    Ctrl --> Svc[Model/Service]
    Svc --> Res([응답])
    Ctrl -.예외.-> ErrMW[error 미들웨어<br/>AppError → JSON]
    Auth -.401.-> ErrMW
    ErrMW --> Res
```

---

## 8. 배포 토폴로지

### 8.1 개발 환경 (현재)

```mermaid
flowchart TB
    Dev([개발자 머신])
    subgraph Local["로컬 (localhost)"]
        FEdev["Next.js dev :3000"]
        BEdev["Express tsx watch :4000"]
        PGdev[(PostgreSQL<br/>Docker)]
        UPdev[/uploads 디렉토리/]
    end
    Dev --> FEdev
    Dev --> BEdev
    FEdev -->|NEXT_PUBLIC_API_URL| BEdev
    BEdev --> PGdev
    BEdev --> UPdev
```

### 8.2 목표 운영 환경 (MVP 출시 지향)

```mermaid
flowchart TB
    Client([사용자 브라우저])

    subgraph Edge["엣지/호스팅"]
        FEhost["Next.js<br/>(Vercel 또는 Node 호스트)"]
    end

    subgraph Server["애플리케이션 서버"]
        BEhost["Express API<br/>(컨테이너/PM2)"]
    end

    subgraph Data["데이터 계층"]
        DBprod[(PostgreSQL<br/>Supabase)]
        S3[("오브젝트 스토리지<br/>S3 호환")]
    end

    Client -->|HTTPS| FEhost
    FEhost -->|/api| BEhost
    Client -->|이미지 CDN/URL| S3
    BEhost --> DBprod
    BEhost -->|STORAGE_DRIVER=s3| S3

    note1["출시 시 전환 포인트:<br/>① 로컬 디스크 → S3<br/>② Supabase Postgres 연결<br/>③ HTTPS/도메인/시크릿 관리"]
```

> 운영 환경 전환은 WBS의 8.4(배포 구성), 8.5(S3 스파이크)에서 다룹니다.
> 스토리지/DB가 인터페이스·설정으로 분리되어 있어 코드 변경 최소화가 목표입니다.

---

### 8.3 현재 운영 배포 (실제 구성, 2026-06-18)

실제로 배포되어 동작 중인 토폴로지입니다. (8.2 는 지향 목표, 본 절은 현재 상태)

```mermaid
flowchart TB
    Client([👤 사용자 브라우저])

    subgraph Vercel["Vercel"]
        FE["프론트엔드 · Next.js 14<br/>프로젝트명: cookshare-backend<br/>https://cookshare-backend.vercel.app"]
    end

    subgraph Render["Render · Docker (free)"]
        BE["백엔드 · Express + TS<br/>서비스: cookshare-api<br/>https://cookshare-api.onrender.com"]
    end

    subgraph Supabase["Supabase"]
        DB[(PostgreSQL<br/>IPv4 Pooler<br/>aws-1-ap-southeast-1<br/>:6543)]
    end

    Client -->|HTTPS / HTML| FE
    FE -->|"NEXT_PUBLIC_API_URL → /api<br/>JSON + Bearer JWT (CORS 허용)"| BE
    BE -->|"DATABASE_URL (SSL)<br/>node-postgres Pool"| DB

    note2["⚠️ 운영 주의점<br/>① Vercel 프로젝트명이 'backend'지만 실제는 프론트엔드<br/>② Render free 플랜은 유휴 시 슬립 → 첫 요청 콜드스타트(~50s)<br/>③ 업로드가 로컬 디스크(휘발성) → 영속 필요 시 S3 전환(8.2 참고)<br/>④ 직접 연결(db.*.supabase.co)은 IPv6 전용 → 반드시 Pooler 사용"]
```

핵심 환경 변수 매핑:

| 위치            | 변수                  | 값                                                                                |
| --------------- | --------------------- | --------------------------------------------------------------------------------- |
| Vercel (프론트) | `NEXT_PUBLIC_API_URL` | `https://cookshare-api.onrender.com/api` (빌드 시 주입 → 변경 시 **재배포 필수**) |
| Render (백엔드) | `DATABASE_URL`        | Supabase **pooler** 연결 문자열 (host `...pooler.supabase.com`)                   |
| Render (백엔드) | `DATABASE_SSL`        | `true`                                                                            |
| Render (백엔드) | `CORS_ORIGIN`         | `https://cookshare-backend.vercel.app` (끝 슬래시 없음)                           |
| Render (백엔드) | `JWT_SECRET`          | 자동 생성                                                                         |

> 배포 대안: Railway(`railway.json`), Kubernetes(`k8s/`) 매니페스트도 저장소에 준비되어 있습니다.

---

## 9. CI/CD 파이프라인

GitHub Actions(`.github/workflows/ci.yml`)와 `main` 브랜치 보호 규칙, 호스팅 자동 배포의 흐름입니다.

```mermaid
flowchart LR
    Dev([개발자]) -->|"git push / Pull Request"| GH["GitHub<br/>main (보호 브랜치)"]

    subgraph Actions["GitHub Actions · ci.yml"]
        direction TB
        Check["check 잡<br/>lint → typecheck<br/>→ unit + integration (coverage)<br/>(pg-mem)"]
        E2E["e2e 잡<br/>Postgres 16 서비스 컨테이너<br/>+ Playwright (smoke · mvp)"]
    end

    GH --> Check
    GH --> E2E
    Check --> Gate{"필수 체크<br/>2 / 2 통과?"}
    E2E --> Gate
    Gate -->|아니오| Block["🚫 머지 차단"]
    Gate -->|예| Merge["✅ main 머지 허용"]

    Merge --> CD
    subgraph CD["호스팅 자동 배포 (main push 트리거)"]
        direction TB
        VercelD["Vercel<br/>프론트 빌드·재배포"]
        RenderD["Render<br/>Docker 이미지 빌드·재배포"]
    end
```

로컬 게이트(개발자 머신, Husky):

```mermaid
flowchart LR
    Commit([git commit]) --> PreCommit["pre-commit<br/>lint-staged<br/>(prettier · eslint)"]
    PreCommit --> CommitMsg["commit-msg<br/>commitlint<br/>(Conventional Commits)"]
    CommitMsg --> Push([git push])
    Push --> PrePush["pre-push<br/>typecheck + 단위 테스트"]
    PrePush --> Remote([원격 반영])
```

---

## 10. 기술 결정 요약 (ADR 축약)

| 결정                     | 선택                       | 이유                                        | 대안/전환                        |
| ------------------------ | -------------------------- | ------------------------------------------- | -------------------------------- |
| 프론트 프레임워크        | Next.js 14 App Router      | SSR/라우팅/DX, shadcn 생태계                | -                                |
| 백엔드                   | Express + TS               | 가볍고 친숙, 빠른 MVP                       | NestJS(규모 커지면)              |
| DB                       | PostgreSQL (node-postgres) | 운영/동시성, Supabase 호환, 무상태 백엔드   | 개발: Docker · 테스트: pg-mem    |
| 인증                     | JWT (Bearer)               | 무상태, FE/BE 분리에 적합                   | 세션+쿠키(보안 강화 시)          |
| 이미지 저장              | 로컬 디스크 + 추상화       | MVP 단순, Storage 인터페이스로 S3 여지 확보 | S3(STORAGE_DRIVER로 전환)        |
| 데이터 직렬화(재료/단계) | JSON 문자열 컬럼           | 스키마 단순, MVP 충분                       | 정규화 테이블(검색/통계 필요 시) |
