# 로컬 테스트용 Kubernetes 매니페스트

Docker Desktop(k8s) / minikube / kind 등 **로컬 단일 노드 클러스터**에서 CookShare를 테스트하기 위한 매니페스트입니다.
운영용이 아니며, 개발 이미지(`cookshare:dev`)와 dev 실행 명령을 그대로 사용합니다.

## 구성

| 리소스                                         | 설명                                                           |
| ---------------------------------------------- | -------------------------------------------------------------- |
| Namespace `cookshare`                          | 격리 네임스페이스                                              |
| ConfigMap `backend-config` / `frontend-config` | 비밀이 아닌 환경설정                                           |
| Secret `backend-secret`                        | `JWT_SECRET` (로컬 전용 값)                                    |
| PVC `cookshare-db` / `cookshare-uploads`       | SQLite 파일 + 업로드물 영속화 (RWO)                            |
| Deployment/Service `backend`                   | Express(:4000), `replicas:1`, `Recreate`, `/api/health` 프로브 |
| Deployment/Service `frontend`                  | Next.js dev(:3000), `/` 프로브                                 |
| Ingress (선택)                                 | ingress-nginx 사용 시 단일 호스트 라우팅                       |

> **왜 backend `replicas: 1` 인가?** SQLite는 단일 파일 writer이고 PVC가 ReadWriteOnce라서
> 여러 파드가 동시에 쓸 수 없습니다. 수평 확장은 Postgres 전환 이후의 과제입니다.

## 사전 준비: 이미지 빌드 & 클러스터에 로드

매니페스트는 `imagePullPolicy: IfNotPresent` 이므로 **로컬에서 빌드한 이미지**를 클러스터에 올려야 합니다.

```bash
# 1) dev 이미지 빌드
docker build -f Dockerfile.dev -t cookshare:dev .

# 2) 클러스터로 이미지 로드 (사용하는 도구에 맞게 택1)
kind load docker-image cookshare:dev               # kind
minikube image load cookshare:dev                  # minikube
# Docker Desktop(k8s)는 로컬 데몬 이미지를 그대로 사용 → 별도 로드 불필요
```

## 배포

```bash
kubectl apply -k k8s/
kubectl -n cookshare rollout status deploy/backend
kubectl -n cookshare rollout status deploy/frontend
```

## 접근 (기본: 포트포워드)

가장 이식성 높은 방법입니다. 두 개의 터미널에서:

```bash
kubectl -n cookshare port-forward svc/frontend 3000:3000
kubectl -n cookshare port-forward svc/backend  4000:4000
```

- 앱: http://localhost:3000
- API 헬스체크: http://localhost:4000/api/health

> 프론트는 브라우저에서 `NEXT_PUBLIC_API_URL=http://localhost:4000/api` 로 백엔드를 호출합니다.
> 그래서 backend 포트포워드(4000)가 함께 필요합니다.

## 접근 (선택: Ingress)

ingress-nginx 컨트롤러가 설치된 경우:

```bash
# 1) hosts 파일에 추가:  127.0.0.1 cookshare.local
# 2) NEXT_PUBLIC_API_URL 을 같은 오리진으로 변경
kubectl -n cookshare patch configmap frontend-config \
  --type merge -p '{"data":{"NEXT_PUBLIC_API_URL":"http://cookshare.local/api"}}'
kubectl -n cookshare rollout restart deploy/frontend
# 3) 인그레스 적용
kubectl apply -f k8s/ingress.yaml
```

접근: http://cookshare.local (API/업로드는 `/api`, `/uploads` 로 백엔드 라우팅, CORS 불필요)

## 정리

```bash
kubectl delete -k k8s/
kubectl -n cookshare delete pvc cookshare-db cookshare-uploads   # 데이터까지 삭제
```

## 참고/한계

- **dev 이미지/명령 사용**: 핫 리로드용 소스 마운트는 하지 않으므로, 코드 변경 시 이미지를 다시 빌드·로드하고 `kubectl rollout restart` 해야 반영됩니다. (소스 핫 리로드가 필요하면 `docker-compose.dev.yml` 사용 권장)
- **JWT_SECRET** 은 로컬 전용 더미 값입니다(리스크 R1). 운영 배포에는 절대 사용하지 마세요.
- **아키텍처(amd64)**: `cookshare:dev` 는 빌드한 호스트 아키텍처용입니다. 노드 아키텍처와 일치해야 합니다(better-sqlite3 네이티브).
