/**
 * Mock AI 응답.
 *
 * 실제 Gemini API 호출 전 단계 — UI 동작·멀티턴 흐름 검증을 위한 정적 응답.
 * Case A (에어팟 프로3) 시뮬레이션 흐름(docs/engineering/comparison-results/v1-validation.md)에서 발췌.
 *
 * 추후 USE_MOCK_AI=false 로 전환하면 실제 호출로 바뀐다.
 */

const MOCK_TURN_RESPONSES: string[] = [
  // 턴 1
  `프로3 기능 중에 자동 번역이랑 제스처 볼륨 두 개를 들었어. 자동 번역은 지난 한 달 기준 실제로 필요했던 적이 몇 번이야?
[show_decide_button: false]`,

  // 턴 2
  `자동 번역은 모르겠다고 했어. 배터리 충전이 귀찮다고 했는데, 하루에 몇 번 충전해?
[show_decide_button: false]`,

  // 턴 3
  `하루 한 번이면 하루 종일 못 쓸 정도야, 아니면 하루는 버티는데 귀찮은 거야?
[show_decide_button: false]`,

  // 턴 4 (체감 비용 #3)
  `그럼 충전 한 번이 귀찮은 거네. 35만원이면 한 달 30일 기준 하루 1만원짜리 귀찮음 해소야. 제스처 볼륨은 폰을 가방에 두는데 볼륨 조절 자주 해?
[show_decide_button: true]`,

  // 턴 5
  `정리하면 자동 번역은 모르겠음, 충전은 하루 1회로 버팀, 제스처 볼륨은 가방에서 폰 꺼내는 게 불편함. 35만원이 세 가지 중 어디에 가장 비중이 큰 거야?
[show_decide_button: true]`,

  // 턴 6 (유지비 #6 + 모순 #4)
  `네가 말한 숫자만 보면 배터리 교체 7~8만원, 새 제품 35만원이야. 차액 27~28만원은 배터리 문제가 아니라 새 모델 기능값으로 보는 셈이야. 그게 정리되는 느낌이야?
[show_decide_button: true]`,

  // 턴 7 (마무리 발화)
  `정리해보면, 자동 번역은 모르겠음 / 배터리는 하루 버팀 / 제스처 볼륨이랑 충전 귀찮음에 27~28만원 차액인 거 인정했어. 결정할 준비 됐어?
[show_decide_button: true]`,
];

const FALLBACK_RESPONSE = `방금 한 말이 좀 추상적이야. 좀 더 구체적으로 설명해줄 수 있어?
[show_decide_button: false]`;

const MOCK_DECIDE_SUMMARY = `- 자동 번역 기능은 실제로 얼마나 쓸지 모르겠다고 했음
- 제스처 볼륨은 일상적으로 잘 쓸 것 같다고 했음
- 현재 프로1 배터리는 하루 1회 충전으로 하루는 버틴다고 했음
- 충전 자체는 가능하지만 귀찮음 수준이라고 인정했음
- 핸드폰을 가방에 두고 볼륨 조절 시 폰을 꺼내야 해서 불편하다고 했음
- 배터리 교체 비용은 7~8만원이라고 했음
- 새 제품 35만원과 배터리 교체 7~8만원의 차액 27~28만원은 새 기능값임을 인정했음
[show_decide_button: true]`;

/**
 * mock 응답을 반환한다.
 *
 * @param userTurnIndex 사용자 메시지의 0-based 인덱스 (첫 사용자 메시지가 0).
 * @param userMessage 사용자 본문. "<<DECIDE>>"면 요약 모드로 분기.
 * @returns 메타 태그가 포함된 raw 응답 텍스트.
 */
export function getMockResponse(userTurnIndex: number, userMessage: string): string {
  if (userMessage.trim() === "<<DECIDE>>") {
    return MOCK_DECIDE_SUMMARY;
  }
  return MOCK_TURN_RESPONSES[userTurnIndex] ?? FALLBACK_RESPONSE;
}
