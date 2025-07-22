// 파일 경로: /api/ask.js
// 이 파일이 Vercel에 의해 서버리스 함수(API)로 자동 변환됩니다.

export default async function handler(req, res) {
    // 1. 프론트엔드에서 보낸 질문을 꺼냄
    const { question } = req.body;

    // 질문이 없으면 오류 메시지 전송
    if (!question) {
        return res.status(400).json({ message: '질문이 없습니다.' });
    }

    // 2. 🚨 Vercel에 저장된 나의 비밀 API 키를 안전하게 불러옴
    // 절대로 코드에 API 키를 직접 쓰지 않습니다!
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ message: '서버에 API 키가 설정되지 않았습니다.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    // 3. Gemini API가 이해할 수 있는 형태로 요청 데이터를 만듦
    const requestBody = {
        "contents": [{
            "parts": [{ "text": question }]
        }]
    };

    try {
        // 4. 우리 서버가 프론트엔드 대신 Gemini API에 요청을 보냄
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!geminiResponse.ok) {
            console.error('Gemini API Error:', await geminiResponse.text());
            throw new Error('Gemini API로부터 응답을 받는데 실패했습니다.');
        }

        const geminiData = await geminiResponse.json();
        
        // 5. Gemini가 생성한 답변 텍스트를 추출
        const answer = geminiData.candidates[0].content.parts[0].text;

        // 6. 성공적으로 받은 답변을 다시 프론트엔드로 보내줌
        res.status(200).json({ answer: answer });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}