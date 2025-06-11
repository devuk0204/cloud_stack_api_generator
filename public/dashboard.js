// dashboard.js

import { WavStreamPlayer } from '/wavtools/index.js';
const socket = io();

// DOM Elements
const conversation = document.getElementById('conversation');
const userInput = document.getElementById('userInput');
const submitButton = document.getElementById('submitMessage');

// Variables
let conversationMode = false;
let currentBotMessage = null;
let currentUserMessage = null;
let tempBotMessage = null;

let sentUserMessage = null;
let sentUserMessageContent = null;

// Audio Tools
const wavStreamPlayer = new WavStreamPlayer({ sampleRate: 24000 });

// Initialize audio player
(async () => {
    await wavStreamPlayer.connect();
})();

// Event Listeners
submitButton.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Send message to server
function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        sentUserMessage = true;
        sentUserMessageContent = message;
        socket.emit('userMessage', message);
        userInput.value = '';
    }
}

// Display user message (typed or transcribed)
function displayUserMessage(message, isFinal = false) {
    if (!currentUserMessage) {

        // Create new message element if one doesn't exist.
        currentUserMessage = document.createElement('div');
        currentUserMessage.textContent = `${message}`;
        currentUserMessage.classList.add('message', 'user-message');
        conversation.appendChild(currentUserMessage);
    } else {
        currentUserMessage.textContent = `You: ${message}`;
    }

    // Handle typed messages
    if (sentUserMessage && message === '(item sent)') {
        sentUserMessage = false;
        currentUserMessage.textContent = `${sentUserMessageContent}`;
        sentUserMessageContent = null;
    }

    scrollToBottom();

    if (isFinal) {
        currentUserMessage = null;
    }
}

// Update bot message by modifying the previous message
function updateBotMessage(newText, isFinal = false) {
    if (!currentBotMessage) {
        currentBotMessage = document.createElement('div');
        currentBotMessage.classList.add('message', 'bot-message');
        conversation.appendChild(currentBotMessage);
    }
    currentBotMessage.textContent = `${newText}`;
    scrollToBottom();

    if (isFinal) {
        let text = currentBotMessage.textContent.trim();
        if (text.includes('네트워크의') || text.includes('네트워크 ID')) {
            tempBotMessage = document.createElement('div');
            tempBotMessage.textContent = '네트워크 리스트를 출력합니다.\n free5gc-single: e5346045-8bce-48b8-9dbd-23e445145782 \n free5gc-isolated: 4c680103-4e97-44d3-bb3e-396cb15d8b46';
            tempBotMessage.classList.add('message', 'bot-message');
            conversation.appendChild(tempBotMessage);
            tempBotMessage = null;
        };
        if (text.includes('서비스 오퍼링') || text.includes('Service Offering') || text.includes('서비스오퍼링') || text.includes('service offering')) {
            tempBotMessage = document.createElement('div');
            tempBotMessage.textContent = '서비스 오퍼링 리스트(CPU/Memory) \n 1vCPU/2GB: 58ed7c3a-c673-4957-951e-bb1ad79e88ef  \n  2vCPU/4GB: f9bbdbd5-66db-44c1-a033-2202b17fe457  \n  4vCPU/8GB: e479d128-1618-4f3e-a1de-9a2d9c294823  \n 8vCPYU/16GB: 174e8bed-2ade-4f14-962c-815cedb702ce';
            tempBotMessage.classList.add('message', 'bot-message');
            conversation.appendChild(tempBotMessage);
            tempBotMessage = null;
            tempBotMessage = document.createElement('div');
            tempBotMessage.textContent = '템플릿 리스트 \n Ubuntu22.04: c795604d-e451-42e1-b32e-82f57d1bba12  \n Ubuntu22.04vscode: 7ad17333-eaf1-4799-a1a1-7670f084a6c7  \n Ubuntu24.04: 5aa2c0b2-d822-4816-ba61-76d314f79109';
            tempBotMessage.classList.add('message', 'bot-message');
            conversation.appendChild(tempBotMessage);
            tempBotMessage = null;
            tempBotMessage = document.createElement('div');
            tempBotMessage.textContent = 'Zone 리스트 \n  DKU: d0b2c227-daed-4b44-93d2-b72582f78aa8';
            tempBotMessage.classList.add('message', 'bot-message');
            conversation.appendChild(tempBotMessage);
            tempBotMessage = null;
            tempBotMessage = document.createElement('div');
            tempBotMessage.textContent = '네트워크 \n Shared Network: 0d1cf004-d855-4768-9095-64aa49b77414';
            tempBotMessage.classList.add('message', 'bot-message');
            conversation.appendChild(tempBotMessage);
            tempBotMessage = null;
            tempBotMessage = null;
            tempBotMessage = document.createElement('div');
            tempBotMessage.textContent = 'VM 이름도 지정해주세요.';
            tempBotMessage.classList.add('message', 'bot-message');
            conversation.appendChild(tempBotMessage);
            tempBotMessage = null;
        };
        
        if (text.includes('NIC의') || text.includes('NIC ID')) {
            const url = 'http://localhost:3000/nic';
            fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log('Text sent successfully:', data);
                console.log(data.id)
                const text = data;
                console.log(text);
                tempBotMessage = document.createElement('div');
                tempBotMessage.textContent = `NIC 리스트\n ${text}`;
                tempBotMessage.classList.add('message', 'bot-message');
                conversation.appendChild(tempBotMessage);
                tempBotMessage = null;
            })
            .catch(error => {
                console.error('Error sending text:', error);
            });

        };
        if (text.includes('vm의 ID') || text.includes('(vm)의') || text.includes('가상머신의 ID') || text.includes('가상 머신의 I') || text.includes('VM의 ID') | text.includes('machine의 ID')) {
            const url = 'http://localhost:3000/vm';
            fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log('Text sent successfully:', data);
                console.log(data.id)
                const [ { id, name } = {} ] = data;
                console.log(id, name);
                tempBotMessage = document.createElement('div');
                tempBotMessage.textContent = `VM 이름: ${name}\nVM ID: ${id}`;
                tempBotMessage.classList.add('message', 'bot-message');
                conversation.appendChild(tempBotMessage);
                tempBotMessage = null;
            })
            .catch(error => {
                console.error('Error sending text:', error);
            });
        };
        if (text.includes('cmk')) {
            const url = 'http://localhost:3000/api';
            const payload = { text: text };
            console.log(payload);
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Text sent successfully:', data);
                updateBotMessage('API가 성공적으로 호출되었습니다.', true);
            })
            .catch(error => {
                console.error('Error sending text:', error);
                updateBotMessage('API 호출에 실패하였습니다.', true);
            });
        };
        currentBotMessage = null;
    }
}

// Scroll to bottom when new message is added
function scrollToBottom() {
    conversation.scrollTop = conversation.scrollHeight;
}


// Socket Events

// Handle display of user messages (transcriptions)
socket.on('displayUserMessage', ({ text, isFinal }) => {
    displayUserMessage(text, isFinal);
});

// Handle updates to bot messages
socket.on('conversationUpdate', ({ text, isFinal }) => {
    updateBotMessage(text, isFinal);
});


// Handle conversation interruption (e.g., when user starts speaking)
socket.on('conversationInterrupted', async () => {
    const trackSampleOffset = await wavStreamPlayer.interrupt();

    if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        socket.emit('cancelResponse', { trackId, offset });
    }
});

