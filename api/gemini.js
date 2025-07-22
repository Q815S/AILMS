// /api/gemini.js

// --- 1. 설정: Python 코드의 상단 부분과 동일한 역할 ---

// API 키와 문제 출제 정보를 Vercel 환경 변수에서 가져옵니다.
// Python의 userdata.get('GOOGLE_API_KEY')와 userdata.get('m11')에 해당합니다.
const API_KEY = process.env.GEMINI_API_KEY;
const QUIZ_CONTEXT = process.env.QUIZ_CONTEXT; // 'm11' 데이터


const MODEL_NAME = 'gemini-2.5-flash';

// 시스템 지침(System Instruction)을 구성합니다.
// Python의 system_instruction = ('...', m11) 부분에 해당합니다.
const systemInstruction = {
  parts: [{
    text: `당신은 주어진 정보를 바탕으로 사용자의 요구에 맞춰 문제를 출제하는 출제자입니다. 다음 정보는 당신이 문제를 출제할 때 사용해야 할 자료.\n\n[정보]\n${QUIZ_CONTEXT}`
  }]
};

// 최종 API 요청 URL을 조합합니다.
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;


// --- 2. API 요청 핸들러: 사용자의 입력을 받아 Gemini API와 통신 ---

export default async function handler(request, response) {
  // POST 요청이 아니거나, 본문이 없으면 에러 처리
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!request.body) {
    return response.status(400).json({ error: 'Invalid request' });
  }

  // 프론트엔드로부터 대화 기록(history)과 새로운 프롬프트(prompt)를 받습니다.
  // Python의 chat.send_message(user_input)과 유사한 역할을 합니다.
  const { history, prompt } = request.body;

  if (!prompt) {
    return response.status(400).json({ error: 'Prompt is required' });
  }

  // Gemini API에 보낼 전체 대화 내용(contents) 구성
  // Python의 chat.history와 새로운 user_input을 합치는 것과 같습니다.
  const contents = [...(history || []), { role: "user", parts: [{ text: prompt }] }];

  try {
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: systemInstruction, // 위에서 정의한 시스템 지침을 포함
      }),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.json();
      console.error('Gemini API Error:', errorBody);
      return response.status(apiResponse.status).json({ error: errorBody.error.message || 'Gemini API에서 오류가 발생했습니다.' });
    }

    const data = await apiResponse.json();
    
    // API 응답이 비정상적인 경우에 대한 방어 코드
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      // 안전망: 모델이 콘텐츠를 생성하지 못했을 때
      const safeResponse = "죄송합니다. 답변을 생성할 수 없습니다. 다른 질문을 시도해주세요.";
      return response.status(200).json({ text: safeResponse });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    response.status(200).json({ text: aiText });

  } catch (error) {
    console.error('Internal Server Error:', error);
    response.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}