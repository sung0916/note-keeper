📘 Note Keeper 진행상황

- 현재 메모장 모달 AI 추천 기능 구현 중🐒

1. 🛠 기술 스택 (Tech Stack)
- Monorepo 구조 (extension: 프론트엔드, server: 백엔드)
- 프론트엔드: React + TypeScript + Tailwind CSS
- 백엔드: Next.js 15	App Router 기반 API 서버
- DB / Auth	Supabase:	BaaS, Google OAuth 인증
- AI	OpenAI API	gpt-3.5-turbo 기반 텍스트 요약 및 분석

2. 🗂 프로젝트 폴더 구조 (Project Structure)<br>
note-keeper/<br>
├── extension/                  # [Frontend] 크롬 확장 프로그램 소스<br>
│   ├── manifest.json           # 권한(permissions), 사이드 패널, CSP 설정<br>
│   ├── vite.config.ts          # Server Port(5173), CORS, HMR 설정<br>
│   └── src/<br>
│       ├── App.tsx             # 메인 엔트리: URL 감지, 라우팅, 전역 상태 관리<br>
│       ├── supabase.ts         # Supabase Client 설정 (Anon Key 사용)<br>
│       ├── types.ts            # Note, User 등 공통 타입 정의 인터페이스<br>
│       └── components/<br>
│           ├── AuthButton.tsx  # 구글 로그인 (Nonce 보안 로직 포함)<br>
│           ├── NoteList.tsx    # 메모 리스트 (Accordion UI, CRUD 핸들러)<br>
│           ├── NoteItem.tsx    # 개별 메모 카드 (색상 테마 적용)<br>
│           ├── NoteModal.tsx   # 메모 작성 모달 (URL 스냅샷, 색상 팔레트)<br>
│           ├── Header.tsx      # 상단 바: 페이지 제목 표시, 유저 메뉴 드롭다운<br>
│           ├── ActionBar.tsx   # 중간 바: 글쓰기 버튼, 다중 선택 메뉴<br>
│           └── ColorPicker.tsx # 16색 파스텔톤 색상 선택기<br>
│<br>
└── web/                        # [Backend] Next.js API 서버 & 웹 대시보드<br>
    ├── app/api/ai/recommend/   # [POST] AI 요약 요청 엔드포인트<br>
    └── lib/supabase-server.ts  # 서버 사이드 Supabase 클라이언트<br>

3. 💾 데이터베이스 및 보안 (Database & Security)
- Supabase 참고

4. 기능 구현
① 인증 (Google Auth) - AuthButton.tsx
- Supabase 설정에서 "Skip nonce checks"는 OFF(보안 강화) 상태로 SHA-256으로 해싱하여 보완

② 메모 작성 (Snapshot Logic) - App.tsx, NoteModal.tsx
- 사용자가 메모를 작성하며 다른 페이지를 참고할 수 있도록 "스냅샷" 방식을 사용합니다.

③ 메모 리스트 (Context-aware) - NoteList.tsx
- 브라우저의 탭 변경을 실시간으로 감지하여 데이터를 갱신합니다.

④ AI 백엔드 - web/app/api/ai/recommend/route.ts
- 확장 프로그램(Client)에서 직접 OpenAI를 호출하지 않고, Next.js 서버를 경유
