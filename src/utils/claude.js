const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const USE_MOCK = true // 화면 개발 중 — true면 API 안 씀
const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL   = 'claude-haiku-4-5-20251001'

export async function callClaude(systemPrompt, userMessage) {
  if (USE_MOCK) throw new Error('mock') // 폴백 로직 타도록
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'API 호출 실패')
  }

  const data = await res.json()
  return data.content[0].text
}
