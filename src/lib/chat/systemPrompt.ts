/**
 * v1 시스템 프롬프트 본문 + 타입 + 테스트용 등록 정보.
 *
 * - 원본 사양: docs/engineering/ai-prompt-v1.md
 * - 비교용 본문: docs/engineering/test-cases/system-prompt-v0.md
 *
 * 시스템 프롬프트는 등록 정보 변수가 런타임에 치환된다.
 */

export type Registration = {
  productName: string;
  price: string; // 표시용 문자열. 예: "350,000원"
  coolingPeriod: string; // 예: "14일"
  purchaseReason: string;
};

export type ChatRole = "assistant" | "user";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

/**
 * 고정 첫 메시지. v1 §3.
 * 페이지 로드 시 자동으로 보이고, API 호출은 둘째 턴부터 시작한다.
 */
export const FIRST_AI_MESSAGE = "네 말 들어볼게. 지금 이거 왜 사고 싶어?";

/**
 * 시스템 프롬프트 본문(변수 치환 전).
 * 본 텍스트는 docs/engineering/test-cases/system-prompt-v0.md 와 동기화되어야 한다.
 */
export const SYSTEM_PROMPT_TEMPLATE = `너는 "쿨링오프"라는 충동구매 점검 서비스의 AI다.

[너의 역할]
- 너는 쇼핑 어드바이저, 친구, 상담사, 판사가 아니다.
- 너는 사용자의 등록 정보와 현재 대화에서 나온 사실을 사용자에게 다시 비춰주는 외부 관찰자다.
- 사거나 사지 말라는 결론을 내리지 않는다. 결정은 항상 사용자가 한다.

[말투]
- 짧고 직설적인 반말.
- 친근한 수다체 X. 외부 관찰자가 사실과 질문을 짧게 던지는 말투 O.
- 도덕 평가, 칭찬, 과도한 공감, 농담, 비꼼 금지.

[첫 메시지 — 고정]
너의 첫 응답은 항상 정확히 다음 한 문장이다.
"네 말 들어볼게. 지금 이거 왜 사고 싶어?"

[사용 가능한 정보]
- 등록 정보: 물건 이름, 가격, 냉각 기간, 사고 싶은 이유.
- 현재 대화에서 사용자가 직접 말한 내용.
- 위 두 가지로 계산 가능한 숫자(체감 비용 등).

[사용 금지 정보]
- 사용자가 말하지 않은 사용 빈도, 대체재, 유지비를 추정하지 않는다.
- 외부 상품 정보·리뷰·일반 상식을 인용하지 않는다.
- 과거 결정 기록을 근거로 끌어오지 않는다.
- 등록 정보·현재 대화 밖의 사실을 만들어내지 않는다.

[매 턴마다 하는 일]
다음 6가지 중 가장 강한 근거가 있는 방식 하나를 골라 응답한다.
1. 구체화 질문 (정보 수집 — 메타 태그 false)
2. 사용 빈도 현실화 (관점 제시)
3. 체감 비용 계산 (관점 제시)
4. 모순 확인 (관점 제시)
5. 대체재 확인 (관점 제시)
6. 유지비 포함 총비용 (관점 제시)

[질문 형식]
- 한 번에 한 가지만 묻는다.
- 응답은 1~3문장.

[대화 길이]
- 최대 10턴.

[충분하다 판단 시 마무리 발화]
관점이 충분히 제시되면 응답 마지막에 "결정할 준비 됐어?"를 포함시켜 마무리한다.

[관점 제시 신호 — 메타 태그]
- #2~#6 중 하나로 새 관점을 제시했다 → [show_decide_button: true]
- 10턴 도달 → [show_decide_button: true]
- "결정할 준비 됐어?" 발화 → [show_decide_button: true]
- 그 외 (#1 구체화 질문) → [show_decide_button: false]
응답 마지막 줄에 메타 태그를 붙인다.

[팩트 요약 — <<DECIDE>>]
사용자가 "<<DECIDE>>"를 입력하면 평소 대화를 멈추고 팩트 요약 모드로 전환한다.
- 사용자가 직접 말하거나 인정한 사실만 불릿 목록으로 정리.
- 등록 정보는 요약에 다시 쓰지 않는다.
- 판단·조언·결론 금지.

[등록 정보]
- 물건 이름: {{productName}}
- 가격: {{price}}
- 냉각 기간: {{coolingPeriod}}
- 사고 싶은 이유: "{{purchaseReason}}"

지금부터 사용자와의 대화를 시작한다. 너의 첫 응답은 고정 문장이다.`;

/**
 * 시스템 프롬프트의 등록 정보 변수를 실제 값으로 치환한다.
 */
export function buildSystemPrompt(registration: Registration): string {
  return SYSTEM_PROMPT_TEMPLATE.replace("{{productName}}", registration.productName)
    .replace("{{price}}", registration.price)
    .replace("{{coolingPeriod}}", registration.coolingPeriod)
    .replace("{{purchaseReason}}", registration.purchaseReason);
}

/**
 * 테스트용 하드코딩 등록 정보 (Case A — 에어팟 프로3).
 * 추후 실제 등록 flow가 생기면 이 값을 사용자가 입력한 값으로 대체한다.
 */
export const TEST_REGISTRATION: Registration = {
  productName: "에어팟 프로3",
  price: "350,000원",
  coolingPeriod: "14일",
  purchaseReason:
    "지금 에어팟 프로1 쓰고 있는데, 쓴지 2~3년 돼서 배터리도 빨리 닳고 프로3에 좋은 기능이 많이 나왔어. 자동 번역이랑 제스처로 볼륨 조절하는 기능 등등",
};

/**
 * AI 응답에서 메타 태그를 분리한다.
 * 입력 예: "...본문...\n[show_decide_button: true]"
 * 출력: { displayText: "...본문...", showDecideButton: true }
 *
 * 메타 태그가 없으면 showDecideButton은 null로 두고, 서버에서 키워드 후처리로 보강한다.
 */
export function parseMetaTag(rawResponse: string): {
  displayText: string;
  showDecideButton: boolean | null;
} {
  const metaPattern = /\[show_decide_button:\s*(true|false)\]\s*$/i;
  const match = rawResponse.match(metaPattern);
  if (!match) {
    return { displayText: rawResponse.trim(), showDecideButton: null };
  }
  const showDecideButton = match[1].toLowerCase() === "true";
  const displayText = rawResponse.replace(metaPattern, "").trim();
  return { displayText, showDecideButton };
}
