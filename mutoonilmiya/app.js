const STORAGE_KEY = "abuumair_mutoon_data";
const THEME_KEY = "abuumair_theme_preference";

let userProgress = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let currentActiveMatnId = null;

function initApp() {
    // 1. Theme Setup on Load
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // 2. Data Setup
    mutoonData.forEach(book => {
        if (!userProgress[book.id]) {
            userProgress[book.id] = {};
        }
    });
    saveProgress();
    renderFehrist();
}

// ---- THEME TOGGLE LOGIC ----
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeBtn = document.getElementById('theme-toggle');
    if (theme === 'light') {
        themeBtn.innerText = '🌙'; // Switch to dark moon
    } else {
        themeBtn.innerText = '☀️'; // Switch to light sun
    }
}

// ---- PROGRESS LOGIC ----
function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
}

function getProgressPercentage(bookId) {
    const book = mutoonData.find(b => b.id === bookId);
    if(!book) return 0;
    const total = book.targets.length;
    const completed = Object.values(userProgress[bookId]).filter(val => val === true).length;
    return Math.round((completed / total) * 100) || 0;
}

// ---- RENDERING ----
function renderFehrist() {
    const container = document.getElementById('books-container');
    container.innerHTML = '';

    mutoonData.forEach(book => {
        const percent = getProgressPercentage(book.id);
        const color = percent === 100 ? 'var(--success-green)' : 'var(--primary-gold)';

        container.innerHTML += `
            <div class="book-card" onclick="openMatn('${book.id}')">
                <div class="book-title">${book.title}</div>
                <div class="book-author">${book.author}</div>
                <div class="progress-bg">
                    <div class="progress-fill" style="width: ${percent}%; background-color: ${color}"></div>
                </div>
                <div class="progress-text">${percent}% :تم الحفظ</div>
            </div>
        `;
    });
}

// ---- NAVIGATION & HISTORY API (Android Back Button Fix) ----
function openMatn(bookId) {
    currentActiveMatnId = bookId;
    const book = mutoonData.find(b => b.id === bookId);
    
    document.getElementById('fehrist-view').classList.remove('active');
    document.getElementById('matn-view').classList.add('active');

    renderMatnContent(book);
    window.scrollTo(0, 0); // Scroll to top when opening

    // History API: Add state so physical back button is trapped
    history.pushState({ page: 'matn_details' }, '', '#matn');
}

// Handle Hardware Back Button or Swipe Back
window.addEventListener('popstate', function(event) {
    // If user pressed back button on mobile
    if (currentActiveMatnId !== null) {
        closeMatnView();
    }
});

function goBack(fromButton = true) {
    closeMatnView();
    // If the on-screen back button was pressed, manually go back in browser history 
    // to clear the pushed state, so we don't trap the user forever.
    if (fromButton) {
        history.back();
    }
}

function closeMatnView() {
    currentActiveMatnId = null;
    document.getElementById('matn-view').classList.remove('active');
    document.getElementById('fehrist-view').classList.add('active');
    renderFehrist(); 
}

// ---- MATN CONTENT RENDERING ----
function renderMatnContent(book) {
    const container = document.getElementById('matn-content-container');
    const progressContainer = document.getElementById('current-matn-progress');
    
    const percent = getProgressPercentage(book.id);
    const color = percent === 100 ? 'var(--success-green)' : 'var(--primary-gold)';

    progressContainer.innerHTML = `
        <div class="matn-header-title">${book.title}</div>
        <div class="matn-progress-card">
            <div class="progress-row">
                <span>نسبة الإنجاز</span>
                <span id="matn-percent-text" style="color: ${color}; font-weight:bold;">${percent}%</span>
            </div>
            <div class="progress-bg">
                <div id="matn-progress-fill" class="progress-fill" style="width: ${percent}%; background-color: ${color}"></div>
            </div>
        </div>
    `;

    container.innerHTML = '';
    book.targets.forEach((target) => {
        const isCompleted = userProgress[book.id][target.day] || false;
        
        container.innerHTML += `
            <div class="day-card ${isCompleted ? 'completed' : ''}" id="card_${target.day}">
                <div class="day-title">${target.title}</div>
                <div class="matn-text">
                    ${target.text}
                </div>
                <div class="action-area">
                    <input type="checkbox" id="check_${target.day}" ${isCompleted ? 'checked' : ''} onchange="toggleDayStatus(${target.day}, this)">
                    <label for="check_${target.day}">أتممت حفظ هذا القسم</label>
                </div>
            </div>
        `;
    });
}

window.toggleDayStatus = function(day, checkbox) {
    const bookId = currentActiveMatnId;
    userProgress[bookId][day] = checkbox.checked;
    saveProgress();

    const card = document.getElementById(`card_${day}`);
    if(checkbox.checked) {
        card.classList.add('completed');
    } else {
        card.classList.remove('completed');
    }

    updateMatnProgressBar(bookId);
}

function updateMatnProgressBar(bookId) {
    const percent = getProgressPercentage(bookId);
    const fill = document.getElementById('matn-progress-fill');
    const text = document.getElementById('matn-percent-text');
    const color = percent === 100 ? 'var(--success-green)' : 'var(--primary-gold)';
    
    fill.style.width = `${percent}%`;
    fill.style.backgroundColor = color;
    text.innerText = `${percent}%`;
    text.style.color = color;
}

// Start Application
initApp();