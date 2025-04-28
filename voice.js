const voiceStatus = document.getElementById('voiceStatus');
const display = document.getElementById('display');

let recognition;
let isListening = false;
let recognitionTimeout;

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
} else if ('SpeechRecognition' in window) {
    recognition = new SpeechRecognition();
} else {
    voiceStatus.innerHTML = '<i class="fas fa-microphone-slash"></i> Voice input not supported';
    voiceStatus.style.cursor = 'default';
    voiceStatus.setAttribute('aria-disabled', 'true');
    return;
}

recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'en-US';

const voiceCommands = {
    'zero': '0',
    'one': '1',
    'two': '2',
    'three': '3',
    'four': '4',
    'five': '5',
    'six': '6',
    'seven': '7',
    'eight': '8',
    'nine': '9',
    'point': '.',
    'decimal': '.',
    'plus': '+',
    'minus': '-',
    'times': '*',
    'multiply': '*',
    'multiplied by': '*',
    'divide': '/',
    'divided by': '/',
    'over': '/',
    'modulo': '%',
    'percent': '%',
    'power': '^',
    'to the power of': '^',
    'factorial': '!',
    'equals': '=',
    'equal': '=',
    'clear': 'AC',
    'all clear': 'AC',
    'delete': 'backspace',
    'backspace': 'backspace',
    'open bracket': '(',
    'close bracket': ')',
    'left bracket': '(',
    'right bracket': ')',
    'pi': 'Math.PI',
    'sine': 'sin',
    'cosine': 'cos',
    'tangent': 'tan',
    'log': 'log',
    'natural log': 'ln',
    'square root': '√',
    'root': '√',
    'degrees': 'deg',
    'degree': 'deg',
    'radians': 'rad',
    'radian': 'rad',
    'memory plus': 'M+',
    'memory minus': 'M-',
    'memory recall': 'MR',
    'memory clear': 'MC'
};

voiceStatus.addEventListener('click', toggleVoiceRecognition);

function toggleVoiceRecognition() {
    if (isListening) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

function startVoiceRecognition() {
    recognition.start();
    voiceStatus.classList.add('listening');
    voiceStatus.innerHTML = '<i class="fas fa-microphone"></i> Listening for commands...';
    isListening = true;
    
    recognitionTimeout = setTimeout(() => {
        stopVoiceRecognition();
    }, 10000);
}

function stopVoiceRecognition() {
    recognition.stop();
    voiceStatus.classList.remove('listening');
    voiceStatus.innerHTML = '<i class="fas fa-microphone"></i> Click mic or say "Calculate"';
    isListening = false;
    clearTimeout(recognitionTimeout);
}

recognition.onresult = function(event) {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    processVoiceCommand(transcript);
    clearTimeout(recognitionTimeout);
    recognitionTimeout = setTimeout(() => {
        stopVoiceRecognition();
    }, 5000);
};

recognition.onerror = function(event) {
    console.error('Voice recognition error', event.error);
    stopVoiceRecognition();
    
    let message = "Voice recognition failed";
    if (event.error === 'not-allowed') {
        message = "Microphone access denied";
    } else if (event.error === 'no-speech') {
        message = "No speech detected";
    } else if (event.error === 'aborted') {
        message = "Voice recognition aborted";
    }
    displayError(message);
};

recognition.onend = function() {
    if (isListening) {
        recognition.start();
    }
};

function processVoiceCommand(command) {
    if (command.includes('calculate') || command.includes('calculator')) {
        const actualCommand = command.replace(/calculate|calculator/g, '').trim();
        if (actualCommand) {
            processVoiceCommand(actualCommand);
        }
        return;
    }
    
    let processedCommand = command;
    
    for (const [key, value] of Object.entries(voiceCommands)) {
        if (key.length > 1 && processedCommand.includes(key)) {
            processedCommand = processedCommand.replace(new RegExp(key, 'g'), value);
        }
    }
    
    const words = processedCommand.split(' ');
    let result = [];
    let isDegreeMode = false;
    
    for (let i = 0; i < words.length; i++) {
        if (voiceCommands[words[i]]) {
            if (words[i] === 'deg') {
                isDegreeMode = true;
                continue;
            } else if (words[i] === 'rad') {
                continue;
            }
            result.push(voiceCommands[words[i]]);
        } else {
            result.push(words[i]);
        }
    }
    
    processedCommand = result.join('');
    
    if (processedCommand === 'AC' || processedCommand === 'clear') {
        clearDisplay();
        stopVoiceRecognition();
    } else if (processedCommand === 'backspace' || processedCommand === 'delete') {
        backspace();
    } else if (processedCommand === '=' || processedCommand === 'equals' || processedCommand === 'equal') {
        calculate();
        stopVoiceRecognition();
    } else if (processedCommand === 'sin' || processedCommand === 'sine') {
        if (isDegreeMode) toggleAngleMode();
        calculateFunction('Math.sin');
        if (isDegreeMode) toggleAngleMode();
    } else if (processedCommand === 'cos' || processedCommand === 'cosine') {
        if (isDegreeMode) toggleAngleMode();
        calculateFunction('Math.cos');
        if (isDegreeMode) toggleAngleMode();
    } else if (processedCommand === 'tan' || processedCommand === 'tangent') {
        if (isDegreeMode) toggleAngleMode();
        calculateFunction('Math.tan');
        if (isDegreeMode) toggleAngleMode();
    } else if (processedCommand === 'ln' || processedCommand === 'natural log') {
        calculateFunction('Math.log');
    } else if (processedCommand === 'log') {
        calculateFunction('Math.log10');
    } else if (processedCommand === '√' || processedCommand === 'square root' || processedCommand === 'root') {
        calculateFunction('Math.sqrt');
    } else if (processedCommand === '!') {
        factorial();
    } else if (processedCommand === '%') {
        percentage();
    } else if (processedCommand === '^') {
        powerFunction();
    } else if (processedCommand === 'Math.PI' || processedCommand === 'pi') {
        appendToDisplay('Math.PI');
    } else if (processedCommand === 'M+') {
        memoryAdd();
    } else if (processedCommand === 'M-') {
        memorySubtract();
    } else if (processedCommand === 'MR') {
        memoryRecall();
    } else if (processedCommand === 'MC') {
        memoryClear();
    } else {
        const validChars = processedCommand.split('').filter(c => 
            /[0-9+\-*/.^!%()]/.test(c) || c === '.' || c === 'Math.PI'
        ).join('');
        
        if (validChars) {
            currentInput = currentInput === '0' ? validChars : currentInput + validChars;
            updateDisplay();
        } else {
            displayError("Unrecognized command");
        }
    }
}

function displayError(message) {
    currentInput = `Error: ${message}`;
    updateDisplay();
    setTimeout(() => {
        clearDisplay();
    }, 2000);
}