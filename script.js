const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// 대화 기록을 저장할 배열
let chatHistory = [];

// 메시지를 채팅창에 추가하는 함수
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.innerHTML = text.replace(/\n/g, '<br>'); // 줄바꿈을 <br>로 변환하여 표시
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// AI 응답을 요청하는 함수
async function getAiResponse(prompt) {
    addMessage("문제 생성 중...", "ai", "loading");

    // 현재 사용자 메시지를 대화 기록에 추가
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // 대화 기록 전체와 현재 프롬프트를 함께 서버에 전송
            body: JSON.stringify({ history: chatHistory, prompt: prompt }),
        });
        
        const loadingMessage = chatBox.querySelector(".loading");
        if(loadingMessage) chatBox.removeChild(loadingMessage);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'AI 응답을 가져오는 데 실패했습니다.');
        }

        const data = await response.json();
        addMessage(data.text, 'ai');

        // AI 응답도 대화 기록에 추가
        chatHistory.push({ role: "model", parts: [{ text: data.text }] });

    } catch (error) {
        console.error('Error:', error);
        addMessage(`오류가 발생했습니다: ${error.message}`, 'ai');
    }
}

sendBtn.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message) {
        addMessage(message, 'user');
        getAiResponse(message);
        userInput.value = '';
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

// 초기 메시지
const initialMessage = "안녕하세요! 제공된 정보를 바탕으로 문제를 만들어 드립니다.<br>원하는 문제 유형을 말씀해주세요. (예: '주관식 문제 3개 내줘', '여기서 가장 중요한 개념으로 o/x 퀴즈 내줘')";
addMessage(initialMessage, 'ai');
chatHistory.push({ role: "model", parts: [{ text: initialMessage }] });