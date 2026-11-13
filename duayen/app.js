let allDuas = duasData; 
let bookmarkedIds = JSON.parse(localStorage.getItem('kitab_sunnat_bookmarks')) || [];
let currentView = 'home'; // 'home', 'chapter', 'detail', 'bookmarks', 'search'
let selectedChapter = '';
let currentListData = [];

document.addEventListener('DOMContentLoaded', () => {
    renderChapters();
});

// 1. Home Screen (Show Chapters)
function renderChapters() {
    currentView = 'home';
    const content = document.getElementById('content');
    document.getElementById('backBtn').classList.add('hidden');
    document.getElementById('pageTitle').innerText = 'فہرست ابواب';
    
    const chapters = [...new Set(allDuas.map(d => d.chapter))];
    
    content.innerHTML = '';
    chapters.forEach(chapter => {
        content.innerHTML += `
            <div class="list-card" onclick="openChapter('${chapter}')">
                <h3 class="list-card-title">${chapter}</h3>
                <svg class="chapter-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </div>
        `;
    });
}

// 2. Chapter Screen
function openChapter(chapter) {
    currentView = 'chapter';
    selectedChapter = chapter;
    const content = document.getElementById('content');
    document.getElementById('backBtn').classList.remove('hidden');
    document.getElementById('pageTitle').innerText = chapter;
    
    currentListData = allDuas.filter(d => d.chapter === chapter);
    renderDuaList(currentListData);
    window.scrollTo(0, 0);
}

// Render List
function renderDuaList(list) {
    const content = document.getElementById('content');
    content.innerHTML = '';
    
    if(list.length === 0) {
        content.innerHTML = '<p style="text-align:center; margin-top:30px; font-size:1.2rem; color:#64748b;">کوئی نتیجہ نہیں ملا</p>';
        return;
    }

    list.forEach(item => {
        const isBookmarked = bookmarkedIds.includes(item.id) ? 'active' : '';
        
        const bookmarkSvg = bookmarkedIds.includes(item.id) ? 
            `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>` : 
            `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

        content.innerHTML += `
            <div class="list-card" onclick="openDua(${item.id})">
                <h3 class="list-card-title">${item.title}</h3>
                <button class="bookmark-icon ${isBookmarked}" onclick="toggleBookmark(event, ${item.id})">
                    ${bookmarkSvg}
                </button>
            </div>
        `;
    });
}

// 3. Detail Screen
function openDua(id) {
    currentView = 'detail';
    const item = allDuas.find(d => d.id === id);
    if (!item) return;

    document.getElementById('backBtn').classList.remove('hidden');
    document.getElementById('pageTitle').innerText = item.title;

    const content = document.getElementById('content');
    
    // Yahan font-family ko 'Jameel' kar diya gaya hai
    let rawiHtml = item.rawi ? `<p style="font-family: 'Jameel', serif; font-size: 1.4rem; text-align: right; color: #64748b; margin-bottom: 5px;">${item.rawi}</p>` : '';
    let tarjumaHtml = item.tarjuma ? `<hr class="divider"><p style="font-family: 'Jameel', serif; font-size: 1.5rem; text-align: right; line-height: 2.2; color: var(--text-main); margin-bottom: 20px;">${item.tarjuma}</p>` : '';
    
    content.innerHTML = `
        <div class="detail-card">
            <p class="${item.matan_lang === 'ur' ? 'matan-ur' : 'matan-ar'}">
                ${item.matan}
            </p>
            ${rawiHtml}
            ${tarjumaHtml}
            <hr class="divider">
            <div class="takhreej-box">
                <p class="takhreej-text" style="font-family: 'Jameel', serif;">تخریج: ${item.takhreej}</p>
                <p class="hukm-text" style="font-family: 'Jameel', serif;">حکم: ${item.hukm}</p>
            </div>
        </div>
    `;
    window.scrollTo(0, 0);
}

// Back Navigation
function goBack() {
    document.getElementById('searchInput').value = '';
    if (currentView === 'detail') {
        if (selectedChapter) {
            openChapter(selectedChapter);
        } else if (document.getElementById('pageTitle').innerText === 'محفوظ دعائیں') {
            showBookmarks();
        } else {
            renderChapters();
        }
    } else if (currentView === 'chapter' || currentView === 'bookmarks' || currentView === 'search') {
        selectedChapter = '';
        renderChapters();
    }
}

// Bookmarks
function toggleBookmark(event, id) {
    event.stopPropagation();
    const index = bookmarkedIds.indexOf(id);
    if (index > -1) {
        bookmarkedIds.splice(index, 1);
    } else {
        bookmarkedIds.push(id);
    }
    localStorage.setItem('kitab_sunnat_bookmarks', JSON.stringify(bookmarkedIds));
    
    if (currentView === 'bookmarks') showBookmarks();
    else if (currentView === 'chapter') openChapter(selectedChapter);
    else if (currentView === 'search') searchDua();
}

function showBookmarks() {
    currentView = 'bookmarks';
    selectedChapter = '';
    document.getElementById('pageTitle').innerText = 'محفوظ دعائیں';
    document.getElementById('backBtn').classList.remove('hidden');
    
    const bookmarkedDuas = allDuas.filter(d => bookmarkedIds.includes(d.id));
    renderDuaList(bookmarkedDuas);
}

// Search
function searchDua() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (query === '') {
        if(currentView === 'search') renderChapters();
        return;
    }
    
    currentView = 'search';
    document.getElementById('backBtn').classList.remove('hidden');
    document.getElementById('pageTitle').innerText = 'تلاش کے نتائج';
    
    // Yahan arabic aur urdu_tarjuma ko matan aur tarjuma se badal diya gaya hai
    const filtered = allDuas.filter(d => 
        (d.title && d.title.includes(query)) || 
        (d.chapter && d.chapter.includes(query)) || 
        (d.tarjuma && d.tarjuma.includes(query)) || 
        (d.matan && d.matan.includes(query))
    );
    renderDuaList(filtered);
}