// 파일 경로: /api/ask.js
// Vercel이 이 파일을 서버리스 함수 API로 자동 변환합니다.

export default async function handler(request, response) {
    // 1. 요청 방식이 POST가 아니면 오류 처리 (보안 및 안정성)
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'POST 요청만 허용됩니다.' });
    }

    // 2. 프론트엔드에서 보낸 질문 데이터(question)를 꺼냄
    const { question } = request.body;

    // 3. 질문이 비어있는 경우 오류 처리
    if (!question) {
        return response.status(400).json({ message: '질문 내용이 없습니다.' });
    }

    // 4. Vercel 환경 변수에 저장된 Gemini API 키를 안전하게 불러옴
    // "서버 에러"의 가장 흔한 원인 중 하나는 이 키가 설정되지 않았을 때입니다.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("서버에 GEMINI_API_KEY가 설정되지 않았습니다.");
        return response.status(500).json({ message: '서버 설정 오류: API 키가 없습니다.' });
    }

    // 5. Gemini API에 요청을 보낼 주소와 형식(requestBody)을 준비
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    const requestBody = {
        contents: [{
            parts: [{ "text": question }]
        }]
    };

    // 6. 실제 API 호출 (try-catch로 감싸 네트워크 오류 등 예외 처리)
    try {
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        // Gemini 서버에서 오류 응답을 보냈는지 확인
        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error('Gemini API 에러 응답:', errorBody);
            return response.status(geminiResponse.status).json({ message: 'Gemini API로부터 오류 응답을 받았습니다.' });
        }

        const geminiData = await geminiResponse.json();

        // 7. Gemini의 답변 중에서 실제 텍스트 부분만 추출
        // 참고: 실제 서비스에서는 candidates 배열이 비어있는 경우도 고려해야 합니다.
        const answer = geminiData.candidates[0].content.parts[0].text;

        // 8. 성공적으로 받은 답변을 프론트엔드로 다시 전송
        response.status(200).json({ answer: answer });

    } catch (error) {
        // 네트워크 문제 등 fetch 과정 자체에서 발생한 에러 처리
        console.error('서버 내부 오류:', error);
        response.status(500).json({ message: '서버 내부에서 오류가 발생했습니다.' });
    }
}