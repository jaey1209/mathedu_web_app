# mathedu_web_app

수학 수업용 웹 자료 모음.

## conic-history — 《신탁이 남긴 수수께끼: 이차곡선의 탄생》

원뿔곡선 단원 도입용 수학사 애니메이션(약 4분 32초, 16:9, 1920×1080 가상 해상도).
델로스의 신탁 → 정육면체 배적문제 → 히포크라테스의 비례중항 → 메나이크모스의 원뿔곡선 → 아폴로니오스로 이어지는 역사 서사를
지브리풍 손그림 2D 애니메이션(Canvas 2D)으로 구성했습니다.

- **바로 사용:** `conic-history/index.html` 하나만 열면 됩니다(외부 의존성 없음, 오프라인 동작).
- 조작: `Space` 재생/정지 · `←/→` 5초 이동 · `1~7` 장면 이동 · `S` 자막 · `V` 음성 해설(브라우저 TTS) · `M` 음향 · `F` 전체화면
- 수업 활용: 장면 버튼으로 원하는 대목(예: 5번 원뿔 절단, 6번 두 포물선의 교점)으로 바로 이동할 수 있습니다.

### 개발
```bash
cd conic-history
node tools/build.js                      # src/* → index.html (단일 파일)
node tools/shoot.js --scene s05 --n 8 --out shots/s05 --sheet   # Playwright 스크린샷
```
구조와 제작 규칙은 `conic-history/GUIDE.md` 참고.
