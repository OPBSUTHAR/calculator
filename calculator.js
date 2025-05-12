let currentInput = '0';
let operation = null;
let resetInput = false;
let calculationHistory = [];
let isScientific = false;
let memory = 0;
let angleMode = 'radians'; // 'radians' or 'degrees'

const display = document.getElementById('display');
const voiceStatus = document.getElementById('voiceStatus');
const modeToggle = document.getElementById('modeToggle');
const calculator = document.querySelector('.calculator');
const basicCalculator = document.getElementById('basicCalculator');
const scientificCalculator = document.getElementById('scientificCalculator');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');

let saveTimeout;

// Initialize the calculator
document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    loadHistory();
    setupModeSwitching();
    setupKeyboardInput();
});

function setupModeSwitching() {
    modeToggle.addEventListener('click', () => {
        isScientific = !isScientific;
        if (isScientific) {
            modeToggle.textContent = 'Scientific Mode';
            modeToggle.setAttribute('aria-label', 'Switch to Basic mode');
            calculator.classList.remove('basic-mode');
            calculator.classList.add('scientific-mode');
            basicCalculator.classList.add('hidden');
            scientificCalculator.classList.remove('hidden');
        } else {
            modeToggle.textContent = 'Basic Mode';
            modeToggle.setAttribute('aria-label', 'Switch to Scientific mode');
            calculator.classList.remove('scientific-mode');
            calculator.classList.add('basic-mode');
            basicCalculator.classList.remove('hidden');
            scientificCalculator.classList.add('hidden');
        }
        historyPanel.classList.add('hidden');
    });
}

function updateDisplay() {
    display.textContent = currentInput;
    display.scrollLeft = display.scrollWidth;
}

function appendToDisplay(value) {
    if (currentInput === '0' || resetInput) {
        currentInput = value;
        resetInput = false;
    } else {
        currentInput += value;
    }
    
    if (value === 'Math.PI') {
        currentInput = Math.PI.toString();
    }
    
    updateDisplay();
}

function clearDisplay() {
    currentInput = '0';
    operation = null;
    updateDisplay();
}

function backspace() {
    if (currentInput.length === 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
        currentInput = '0';
    } else {
        currentInput = currentInput.slice(0, -1);
    }
    updateDisplay();
}

function chooseOperation(op) {
    if (currentInput === '') return;
    
    operation = op;
    currentInput += op;
    resetInput = false;
    updateDisplay();
}

function calculate() {
    try {
        let expression = currentInput.replace(/Math\.PI/g, Math.PI);
        let result = eval(expression);
        
        if (isNaN(result) || !isFinite(result)) {
            displayError("Invalid result");
            return;
        }
        
        result = formatResult(result);
        
        const historyItem = {
            expression: currentInput,
            result: result
        };
        
        addToHistory(historyItem);
        
        currentInput = result;
        operation = null;
        resetInput = true;
        updateDisplay();
    } catch (e) {
        displayError("Calculation error");
    }
}

function calculateFunction(func) {
    try {
        let value = parseFloat(currentInput);
        if (isNaN(value)) {
            displayError("Invalid number");
            return;
        }
        
        if (angleMode === 'degrees' && ['Math.sin', 'Math.cos', 'Math.tan'].includes(func)) {
            value = value * Math.PI / 180;
        }
        
        let computation;
        switch (func) {
            case 'Math.sin':
                computation = Math.sin(value);
                break;
            case 'Math.cos':
                computation = Math.cos(value);
                break;
            case 'Math.tan':
                computation = Math.tan(value);
                break;
            case 'Math.log':
                if (value <= 0) {
                    displayError("ln: x must be positive");
                    return;
                }
                computation = Math.log(value);
                break;
            case 'Math.log10':
                if (value <= 0) {
                    displayError("log: x must be positive");
                    return;
                }
                computation = Math.log10(value);
                break;
            case 'Math.sqrt':
                if (value < 0) {
                    displayError("sqrt: x cannot be negative");
                    return;
                }
                computation = Math.sqrt(value);
                break;
            default:
                return;
        }
        
        let result = formatResult(computation);
        
        const historyItem = {
            expression: `${func.replace('Math.', '')}(${currentInput})`,
            result: result
        };
        
        addToHistory(historyItem);
        
        currentInput = result;
        resetInput = true;
        updateDisplay();
    } catch (e) {
        displayError("Calculation error");
    }
}

function formatResult(computation) {
    if (isNaN(computation) || !isFinite(computation)) {
        throw new Error("Invalid result");
    }
    if (Number.isInteger(computation)) {
        return computation.toString();
    }
    return parseFloat(computation.toFixed(10)).toString();
}

function addToHistory(historyItem) {
    calculationHistory.unshift(historyItem);
    if (calculationHistory.length > 20) {
        calculationHistory.pop();
    }
    saveHistory();
    updateHistoryDisplay();
}

function displayError(message) {
    currentInput = `Error: ${message}`;
    updateDisplay();
    setTimeout(() => {
        clearDisplay();
    }, 2000);
}

function saveHistory() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        localStorage.setItem('calculatorHistory', JSON.stringify(calculationHistory));
    }, 100);
}

function loadHistory() {
    const savedHistory = localStorage.getItem('calculatorHistory');
    if (savedHistory) {
        calculationHistory = JSON.parse(savedHistory);
        updateHistoryDisplay();
    }
}

function updateHistoryDisplay() {
    historyList.innerHTML = '';
    calculationHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.setAttribute('tabindex', '0');
        historyItem.setAttribute('aria-label', `History item: ${item.expression} equals ${item.result}`);
        historyItem.innerHTML = `
            <div class="history-expression">${item.expression}</div>
            <div class="history-result">${item.result}</div>
        `;
        historyItem.addEventListener('click', () => {
            currentInput = item.result;
            updateDisplay();
        });
        historyItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                currentInput = item.result;
                updateDisplay();
            }
        });
        historyList.appendChild(historyItem);
    });
}

function clearHistory() {
    calculationHistory = [];
    saveHistory();
    updateHistoryDisplay();
}

function setupKeyboardInput() {
    document.addEventListener('keydown', function(event) {
        const key = event.key;
        if ((key >= '0' && key <= '9') || 
            key === '.' || 
            ['+', '-', '*', '/', '(', ')', '%'].includes(key) ||
            ['Enter', '=', 'Escape', 'Backspace'].includes(key) ||
            (isScientific && ['s', 'c', 't', 'l', 'r'].includes(key.toLowerCase()))) {
            event.preventDefault();
        }

        if (key >= '0' && key <= '9') {
            appendToDisplay(key);
        } else if (key === '.') {
            appendToDisplay('.');
        } else if (key === '+') {
            chooseOperation('+');
        } else if (key === '-') {
            chooseOperation('-');
        } else if (key === '*') {
            chooseOperation('*');
        } else if (key === '/') {
            chooseOperation('/');
        } else if (key === '%') {
            appendToDisplay('%');
        } else if (key === 'Enter' || key === '=') {
            calculate();
        } else if (key === 'Escape') {
            clearDisplay();
        } else if (key === 'Backspace') {
            backspace();
        } else if (isScientific) {
            if (key.toLowerCase() === 's') {
                calculateFunction('Math.sin');
            } else if (key.toLowerCase() === 'c') {
                calculateFunction('Math.cos');
            } else if (key.toLowerCase() === 't') {
                calculateFunction('Math.tan');
            } else if (key.toLowerCase() === 'l') {
                calculateFunction('Math.log');
            } else if (key.toLowerCase() === 'r') {
                calculateFunction('Math.sqrt');
            }
        }
    });
}