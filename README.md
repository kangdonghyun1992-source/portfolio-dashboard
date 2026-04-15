# Portfolio Dashboard

개인 자산을 한눈에 관리하는 대시보드. 현금, 주식, 크립토, 연금, 부동산, 부채를 카테고리별로 추적하고 자산배분 현황과 순자산 추이를 시각화합니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kangdonghyun1992/portfolio-dashboard&env=TURSO_DATABASE_URL,TURSO_AUTH_TOKEN&envDescription=Turso%20DB%20credentials&project-name=my-portfolio)

## 시작하기

### 1. Turso DB 생성

```bash
# Turso CLI 설치
curl -sSfL https://get.tur.so/install.sh | bash

# 로그인 & DB 생성
turso auth login
turso db create my-portfolio
turso db tokens create my-portfolio
```

### 2. Deploy to Vercel

위의 **Deploy with Vercel** 버튼을 클릭하고, 환경변수를 입력하세요:

| 환경변수 | 설명 |
|---|---|
| `TURSO_DATABASE_URL` | `turso db show my-portfolio --url` 으로 확인 |
| `TURSO_AUTH_TOKEN` | `turso db tokens create my-portfolio` 으로 생성 |

테이블은 첫 요청 시 자동으로 생성됩니다.

### 3. 로컬 개발

```bash
cp .env.local.example .env.local
# TURSO_DATABASE_URL, TURSO_AUTH_TOKEN 입력

npm install
npm run dev
```

## 기능

- 월별 자산 현황 조회 및 관리
- 카테고리별 자산 추가/수정/삭제 (현금, 주식, 크립토, 연금, 부동산, 부채)
- 자산배분 파이차트 & 전략적 자산배분(SAA) 비교
- 순자산 추이 차트
- 카테고리별 추이 차트

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Database**: Turso (libSQL)
- **UI**: Tailwind CSS, shadcn/ui, Recharts
- **Deploy**: Vercel

## 스크린샷

<!-- 스크린샷을 추가하세요 -->

---

MIT License
