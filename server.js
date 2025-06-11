import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { exec } from 'child_process';
dotenv.config();

import { RealtimeClient } from '@openai/realtime-api-beta';

// Express setup
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Set up view engine and static files
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.json());
// Main Route
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/nic', (req, res) => {
    const cmd = 'cmk list virtualmachines name=api-test response=json';
    console.log('Executing CMK command:', cmd);
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error('exec error:', err);
            return res.status(500).send(err.message);
        }
        if (stderr) {
            console.warn('exec stderr:', stderr);
        }
        let data = JSON.parse(stdout);
        console.log('exec stdout', stdout);
        const result = data.virtualmachine
            .flatMap(vm =>
                vm.nic.map(n => ({
                id: n.id,
                networkname: n.networkname
                }))
            );
        const text = result
            .map(n => `${n.networkname} (${n.id})`)
            .join(', ');
        console.log(text);
        res.json(text);
    });
})

app.get('/vm', (req, res) => {
    const cmd = 'cmk list virtualmachines name=api-test response=json';
    console.log('Executing CMK command:', cmd);
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error('exec error:', err);
            return res.status(500).send(err.message);
        }
        if (stderr) {
            console.warn('exec stderr:', stderr);
        }
        let data = JSON.parse(stdout);
        console.log('exec stdout', stdout);
        const result = Array.isArray(data.virtualmachine)
            ? data.virtualmachine.map(vm => ({
                name: vm.name,
                id: vm.id
            }))
            : [];
        res.json(result);
    });
})

app.post('/api', (req, res) => {
    const text = req.body.text;
    if (typeof text !== 'string') {
        return res.status(400).send('Request body must include a text string');
    };
    const idx = text.indexOf('cmk');
    if (idx === -1) {
        return res.status(400).send('No cmk found in text');
    }
    let cmdArgs = text.slice(idx).trim();
    cmdArgs = cmdArgs.replace(/[\x00-\x1F\x7F]/g, '');
    console.log('Executing CMK with args:', cmdArgs, ' response=json');
    const fullCmd = `${cmdArgs} response=json`;

    exec(fullCmd, (err, stdout, stderr) => {
        if (err) {
        console.error('exec error:', err);
        return res.status(500).send(err.message);
        }
        if (stderr) {
        console.warn('exec stderr:', stderr);
        }
        console.log('exec stdout', stdout);
        res.send(stdout);
    });
});

// Socket.io setup
io.on('connection', (socket) => {
    const client = new RealtimeClient({ apiKey: process.env.OPENAI_API_KEY });

    client.updateSession({
        instructions: '당신은 CloudMonkey(CMK) CLI 명령어 생성 도우미입니다.사용자가 명령어 실행에 필요한 필수 요소(리소스 종류, 리소스 이름/ID 를 제공하지 않았으면, 절대 커맨드를 바로 생성하지 말고. 어떤 리소스를 다루고 싶은지(예: virtualmachine, template, snapshot) 해당 리소스의 이름(name) 또는 ID 필요하다면 zone/region, output format 등 를 구체적으로 질문해서 정보를 모두 취합한 뒤에야 최종 cmk ... 커맨드를 출력하세요. 그리고 절대 cmk ... 이외의 부가 설명은 출력하지 마세요. 사용자에게는 cloudmonkey 명령어를 실행할 수 있는 권한이 없습니다. 사용자가 입력한 내용을 그대로 출력하지 말고, 필요한 정보를 물어보세요. 사용자가 입력한 내용은 커맨드의 일부로 사용될 수 있습니다. add nic 이런거처럼 띄어쓰지 말고 addNictoVirtualMachine 이런식으로 CamelCase로 변환해서 사용하세요. 그리고 절대 cmk ... 이렇게 명령어를 만들었을떄는 이 명령어 이외의 부가 설명은 출력하지 마세요. 사용자가 입력한 내용은 커맨드의 일부로 사용될 수 있습니다. 그리고 절대 cmk ... 이렇게 명령어를 만들었을떄는 이 명령어 이외의 부가 설명은 출력하지 마세요. 특히 = 이외의 어느 특수문자도 출력하지 마세요.',
        voice: 'alloy',
        turn_detection: { type: 'server_vad', threshold: 0.3 },
        output_audio: { model: 'audio-davinci', format: 'pcm' },
        input_audio_transcription: { model: 'whisper-1' },
    });

    client.connect().catch((error) => {
        console.error('Failed to connect:', error);
        socket.emit('error', 'Failed to connect to OpenAI API.');
    });

    client.on('error', (error) => {
        console.error('Realtime API error:', error);
    });

    // Handle conversation updates for transcription and audio
    client.on('conversation.updated', (event) => {
        const { item, delta } = event;

        // Handle user input (partial or complete transcription)
        if (item.role === 'user' && item.formatted.transcript) {
            socket.emit('displayUserMessage', {
                text: item.formatted.transcript,
                isFinal: item.status === 'completed',
            });
        } else if (item.role === 'user' && item.formatted.audio?.length && !item.formatted.transcript) {

            // Emit placeholder while waiting for transcript if audio is present
            socket.emit('displayUserMessage', {
                text: "(awaiting transcript)",
                isFinal: false
            });
        } else if (item.role === 'user' && !item.formatted.transcript) {

            // Fallback in case neither transcript nor audio is present
            socket.emit('displayUserMessage', {
                text: "(item sent)",
                isFinal: true
            });
        }

        // Send bot responses to the client
        if (item.role !== 'user' && item.formatted.transcript) {
            socket.emit('conversationUpdate', {
                text: item.formatted.transcript,
                isFinal: item.status === 'completed',
            });
        }

        // Send audio updates to client
        if (delta?.audio) {
            const audioData = delta.audio.buffer || delta.audio;
            socket.emit('audioStream', audioData, item.id);
        }
    });

    // Handle incoming audio data from the client
    socket.on('audioInput', async (data) => {
        if (data) {
            try {
                const buffer = new Uint8Array(data).buffer;
                const int16Array = new Int16Array(buffer);
                await client.appendInputAudio(int16Array);
            } catch (error) {
                console.error('Error processing audio data:', error);
            }
        }
    });

    // Handle conversation interruption
    client.on('conversation.interrupted', async () => {
        socket.emit('conversationInterrupted');
    });

    // Handle cancel response requests from the client
    socket.on('cancelResponse', async ({ trackId, offset }) => {
        if (trackId) {
            try {
                await client.cancelResponse(trackId, offset);
            } catch (error) {
                console.error('Error canceling response:', error);
            }
        }
    });

    // Handle text messages from the user
    socket.on('userMessage', (message) => {
        client. sendUserMessageContent([{ type: 'input_text', text: message }]);
    });

    socket.on('disconnect', () => {
        client.disconnect();
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
