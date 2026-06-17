# CookShare 아키텍처

레시피 공유 서비스의 시스템 아키텍처 문서입니다. 실제 스캐폴딩된 코드 구조를 기준으로 작성되었습니다.

- 대상 스택: Next.js 14 (App Router) / Express + TS / SQLite / JWT / 로컬 이미지 저장
- 문서 버전: 2026-06-17

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
        DB[(SQLite<br/>cookshare.sqlite)]
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
        DBConn["db/index.ts<br/>better-sqlite3 싱글톤"]

        MW --> Routes --> Ctrl
        Ctrl --> Models
        Ctrl --> StorageLayer
        Models --> DBConn
    end

    subgraph Infra["저장소"]
        SQLite[(SQLite)]
        Disk[/uploads//]
    end

    FE_Lib -->|HTTP JSON| MW
    DBConn --> SQLite
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
    participant DB as SQLite

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
    participant DB as SQLite

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
        SQLITEdev[(SQLite 파일)]
        UPdev[/uploads 디렉토리/]
    end
    Dev --> FEdev
    Dev --> BEdev
    FEdev -->|NEXT_PUBLIC_API_URL| BEdev
    BEdev --> SQLITEdev
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
        DBprod[(SQLite → Postgres<br/>마이그레이션 검토)]
        S3[("오브젝트 스토리지<br/>S3 호환")]
    end

    Client -->|HTTPS| FEhost
    FEhost -->|/api| BEhost
    Client -->|이미지 CDN/URL| S3
    BEhost --> DBprod
    BEhost -->|STORAGE_DRIVER=s3| S3

    note1["출시 시 전환 포인트:<br/>① 로컬 디스크 → S3<br/>② SQLite → Postgres(선택)<br/>③ HTTPS/도메인/시크릿 관리"]
```

> 운영 환경 전환은 WBS의 8.4(배포 구성), 8.5(S3 스파이크)에서 다룹니다.
> 스토리지/DB가 인터페이스·설정으로 분리되어 있어 코드 변경 최소화가 목표입니다.

---

## 9. 기술 결정 요약 (ADR 축약)

| 결정                     | 선택                    | 이유                                        | 대안/전환                        |
| ------------------------ | ----------------------- | ------------------------------------------- | -------------------------------- |
| 프론트 프레임워크        | Next.js 14 App Router   | SSR/라우팅/DX, shadcn 생태계                | -                                |
| 백엔드                   | Express + TS            | 가볍고 친숙, 빠른 MVP                       | NestJS(규모 커지면)              |
| DB                       | SQLite (better-sqlite3) | 개발 단순성, 무설정, 동기 API               | Postgres(운영/동시성)            |
| 인증                     | JWT (Bearer)            | 무상태, FE/BE 분리에 적합                   | 세션+쿠키(보안 강화 시)          |
| 이미지 저장              | 로컬 디스크 + 추상화    | MVP 단순, Storage 인터페이스로 S3 여지 확보 | S3(STORAGE_DRIVER로 전환)        |
| 데이터 직렬화(재료/단계) | JSON 문자열 컬럼        | 스키마 단순, MVP 충분                       | 정규화 테이블(검색/통계 필요 시) |
