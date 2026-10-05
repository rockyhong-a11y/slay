# 모바일 조작 검수 — 2026-10-05

화면 전체를 고정하고, 긴 지도·도감·도움말과 상세 창만 내부에서 스크롤하도록 변경했다. 손패는 고정된 카드 위치를 기준으로 드래그 중 한 장씩 16px 상승·금색 강조하며, 같은 카드의 유효한 320ms 더블탭을 한 번의 사용으로 처리한다. 경로도 같은 320ms 더블탭으로 연결된 다음 노드에 진입한다.

## 실행 결과

- `npm test`: 111개 통과. 기존 전투·저장·아트·경로·보급 78개와 손패 16개, 경로 탭 6개, 모바일 기본 동작 11개.
- `BASE_PATH=/slay/ npm run build`: 성공. DEV 검수 진입점은 배포 번들에서 제거.
- Codex In-app Browser에서 네이티브 클릭·더블클릭·드래그·휠·키보드 입력으로 확인. 콘솔 오류 0개.
- 320×720, 393×852, 667×375, 844×390, 1280×720 × 손패 5장·10장: 문서 크기 = 화면 크기, 문서 scrollX/Y = 0. 두 선수·모든 카드·사용/턴 버튼이 화면 안에 있으며 카드와 턴 버튼이 겹치지 않음.
- 손패 1번 위치에서 9번으로 드래그: 9번만 선택·상승, 손패 10장·에너지 10 유지. 파워밤 위치 더블클릭: 손패 9장, 에너지 8, 상대 체력 100→79. 시전은 한 번만 진행됨.
- 열기 2에서 챔피언십 드라이브 더블클릭: 선택만 변경, 카드·에너지 유지, 시전 없음.
- 전투 화면 휠 이동 시 문서와 main scrollTop은 모두 0.
- 지도 f2-1 단일 클릭: 라커룸 위험·보상 확인, main scrollTop 669, 문서 scrollY 0, 상단 메뉴 y=0. 같은 노드 더블클릭: LOCKER ROOM 컷신과 현재 구간 02, 한 번 진입.
- 도움말 09 목차: 내부 main scrollTop 6968.5, 섹션 상단 y=96, 문서 scrollY 0. 텍스트 드래그 선택은 빈 문자열, 오른쪽 클릭 팝업 없음, 더블클릭 visualViewport.scale=1.
- 도감 ‘파워밤’ 검색: 6개 결과, 입력 글꼴 16px. 667×375 상세 창은 높이 351px의 내부 스크롤, scrollHeight 798px, scrollTop 375로 이동. 문서 scrollY 0, Esc로 닫힘.

[좌표·상태 원본 JSON](mobile-gestures-browser-checks.json) · [세로 화면](touch-hand-393x852.jpg) · [가로 화면](touch-hand-667x375.jpg)

## 입력 구분

드래그·취소·멀티터치·450ms 초과 롱프레스는 카드 사용/경로 이동으로 처리하지 않는다. 다른 카드·노드의 연속 탭과 만료된 탭도 사용하지 않는다. Pointer capture는 드래그를 이어 주고, 카드 좌표는 상승한 그림의 z-index와 무관하게 유지한다. 사용 불가 카드도 확인할 수 있으며, 기존 사용/진입 버튼과 키보드 조작을 유지한다.

root 밖에 렌더되는 기술 연출의 텍스트도 user-select:none과 touch-action:manipulation 적용을 실제 시전 중 확인했다.

문서에서 native contextmenu/selectstart/dragstart/dblclick 기본 동작을 차단한다. Safari 보완은 두 번째 짧은 touchend 기본 동작과 내부 스크롤 경계를 벗어나는 touchmove만 취소하며, 게임의 pointer 이벤트 전파는 유지한다. 10px 이동으로 시작된 스크롤의 방향을 고정해 작은 수직·수평 흔들림에도 내부 스크롤이 끊기지 않도록 한다. 검색 입력과 정상적인 내부 스크롤은 별도 테스트로 확인했다. 장치 키보드가 나타날 때 visualViewport 높이에 맞춰 앱 높이를 갱신하며 설치/해제 시 리스너를 정리한다.

## 검수 범위

실제 브라우저 검수는 Chromium 기반 In-app Browser에서 실행했다. iOS Safari 실기기·주소창 바운스·실제 터치 롱프레스 팝업은 실기기에서 확인하지 않았다. Safari 기본 동작 차단은 CSS와 이벤트 보완 및 순수 이벤트 회귀 테스트로 검증했다. 별도의 실제 장치 성능 측정이나 전체 접근성 감사는 수행하지 않았다.

구현 참고: [WebKit의 touch-action: manipulation 설명](https://webkit.org/blog/5610/more-responsive-tapping-on-ios/), [WebKit의 더블탭 확대 처리 수정 기록](https://bugs.webkit.org/show_bug.cgi?id=319730), [MDN의 -webkit-touch-callout 설명](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/-webkit-touch-callout).
