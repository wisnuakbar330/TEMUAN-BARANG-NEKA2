// --- DATA AWAL SIMULASI ---
const INITIAL_DATA = [
    {
        id: "RPT-1001",
        type: "Temuan",
        reporterName: "Budi Santoso",
        reporterClass: "Kelas 10",
        itemName: "Botol Tupperware Biru",
        category: "Botol/Tempat Makan",
        location: "Kantin Sekolah",
        description: "Botol minum Tupperware warna biru tua kapasitas 750ml dengan stiker anime.",
        tags: ["tupperware", "biru", "750ml", "stiker", "kantin"],
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=60",
        date: "2026-03-28 09:30",
        status: "Aktif",
        claimedBy: null
    },
    {
        id: "RPT-1002",
        type: "Hilang",
        reporterName: "Siti Rahma",
        reporterClass: "Kelas 11",
        itemName: "Botol Minum Biru Ada Stiker",
        category: "Botol/Tempat Makan",
        location: "Kantin Sekolah",
        description: "Hilang botol Tupperware warna biru dekat meja kantin.",
        tags: ["botol", "biru", "tupperware", "kantin"],
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=60",
        date: "2026-03-28 10:15",
        status: "Aktif",
        claimedBy: null
    }
];

let reportsData = [];
let currentUser = null; // { name, role: 'penemu'|'admin', class }

// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('findit_reports');
    if (savedData) {
        try { reportsData = JSON.parse(savedData); } catch (e) { reportsData = [...INITIAL_DATA]; }
    } else {
        reportsData = [...INITIAL_DATA];
        saveToLocalStorage();
    }

    const savedUser = localStorage.getItem('findit_session_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }

    updateAuthUI();
    renderData();
    calculateAIMatches();
    updateStatistics();
});

function saveToLocalStorage() {
    localStorage.setItem('findit_reports', JSON.stringify(reportsData));
}

// --- SYSTEM LOGIN & MODAL ---
function openLoginModal(roleType) {
    const modal = document.getElementById('loginModal');
    const roleInput = document.getElementById('loginRoleType');
    const modalTitle = document.getElementById('loginModalTitle');
    const classGroup = document.getElementById('classInputGroup');
    const passGroup = document.getElementById('passInputGroup');

    roleInput.value = roleType;

    if (roleType === 'admin') {
        modalTitle.innerText = "Login Guru BK / Admin Verifikator";
        classGroup.classList.add('hidden');
        passGroup.classList.remove('hidden');
    } else {
        modalTitle.innerText = "Login / Reg Penemu Barang";
        classGroup.classList.remove('hidden');
        passGroup.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
}

function handleLoginSubmit(event) {
    event.preventDefault();
    const roleType = document.getElementById('loginRoleType').value;
    const name = document.getElementById('loginName').value.trim();
    const userClass = document.getElementById('loginClass').value;
    const pass = document.getElementById('loginPass').value;

    if (roleType === 'admin') {
        if (pass !== 'admin123') {
            alert('Password Admin salah! (Gunakan password default: admin123)');
            return;
        }
        currentUser = { name, role: 'admin', class: 'Guru BK / Tim Kesiswaan' };
    } else {
        currentUser = { name, role: 'penemu', class: userClass };
    }

    localStorage.setItem('findit_session_user', JSON.stringify(currentUser));
    closeLoginModal();
    updateAuthUI();
    renderData();
    calculateAIMatches();
    alert(`Selamat datang, ${currentUser.name}! Anda berhasil masuk.`);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('findit_session_user');
    updateAuthUI();
    renderData();
    calculateAIMatches();
    alert('Anda telah keluar.');
}

function updateAuthUI() {
    const container = document.getElementById('authStatusContainer');
    const loggedOutForm = document.getElementById('formLoggedOutState');
    const loggedInForm = document.getElementById('formLoggedInState');
    const bkBanner = document.getElementById('bkBanner');
    const reporterBadge = document.getElementById('reporterBadge');

    if (currentUser) {
        // Tampilan Header ketika sudah Login
        container.innerHTML = `
            <div class="flex items-center gap-2 bg-indigo-800/80 px-3 py-1.5 rounded-xl border border-indigo-500/40 text-xs">
                <i class="fa-solid ${currentUser.role === 'admin' ? 'fa-user-shield text-amber-300' : 'fa-user-check text-emerald-300'}"></i>
                <div>
                    <p class="font-bold text-white leading-tight">${currentUser.name}</p>
                    <p class="text-[10px] text-indigo-200">${currentUser.class}</p>
                </div>
                <button onclick="logout()" class="ml-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                    Keluar
                </button>
            </div>
        `;

        // Tampilkan Form Laporan jika sudah Login
        loggedOutForm.classList.add('hidden');
        loggedInForm.classList.remove('hidden');
        reporterBadge.innerText = `${currentUser.name} (${currentUser.class})`;

        if (currentUser.role === 'admin') {
            bkBanner.classList.remove('hidden');
        } else {
            bkBanner.classList.add('hidden');
        }
    } else {
        // Tampilan Header jika BELUM Login (Bisa lihat & cari barang)
        container.innerHTML = `
            <button onclick="openLoginModal('penemu')" class="bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm">
                <i class="fa-solid fa-right-to-bracket mr-1"></i> Login Penemu
            </button>
            <button onclick="openLoginModal('admin')" class="bg-indigo-800 hover:bg-indigo-900 text-indigo-100 text-xs font-bold px-3 py-2 rounded-xl transition border border-indigo-600">
                <i class="fa-solid fa-shield-halved"></i> BK
            </button>
        `;

        loggedOutForm.classList.remove('hidden');
        loggedInForm.classList.add('hidden');
        bkBanner.classList.add('hidden');
    }
}

// --- SUBMIT LAPORAN (HANYA UNTUK USER LOGIN) ---
function submitReport(event) {
    event.preventDefault();
    if (!currentUser) {
        alert("Silakan login terlebih dahulu untuk membuat laporan.");
        return;
    }

    const reportType = document.querySelector('input[name="reportType"]:checked').value;
    const itemName = document.getElementById('itemName').value;
    const category = document.getElementById('itemCategory').value;
    const location = document.getElementById('itemLocation').value;
    const description = document.getElementById('itemDesc').value;

    const stopWords = ["yang", "di", "ke", "dari", "pada", "dalam", "dengan", "dan", "atau", "ini"];
    const words = (itemName + " " + description).toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
    const tags = [...new Set(words.filter(w => w.length > 2 && !stopWords.includes(w)))];

    const defaultImg = reportType === 'Hilang' 
        ? "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&auto=format&fit=crop&q=60"
        : "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&auto=format&fit=crop&q=60";

    const newReport = {
        id: "RPT-" + Math.floor(1000 + Math.random() * 9000),
        type: reportType,
        reporterName: currentUser.name,
        reporterClass: currentUser.class,
        itemName,
        category,
        location,
        description,
        tags,
        image: defaultImg,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: "Aktif",
        claimedBy: null
    };

    reportsData.unshift(newReport);
    saveToLocalStorage();

    document.getElementById('reportForm').reset();
    generateAutoTags();
    renderData();
    calculateAIMatches();
    updateStatistics();

    alert("Laporan Anda berhasil dipublikasikan!");
}

// --- RENDER FEEDS (TANPA PERLU LOGIN) ---
function renderData() {
    const container = document.getElementById('itemsContainer');
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const filterType = document.getElementById('filterType')?.value || 'Semua';

    const filtered = reportsData.filter(item => {
        const matchesSearch = item.itemName.toLowerCase().includes(search) || 
                              item.description.toLowerCase().includes(search) || 
                              item.location.toLowerCase().includes(search);
        
        let matchesType = true;
        if (filterType === 'Selesai') matchesType = item.status === 'Selesai';
        else if (filterType !== 'Semua') matchesType = item.type === filterType && item.status === 'Aktif';

        return matchesSearch && matchesType;
    });

    document.getElementById('totalItemsBadge').innerText = `${filtered.length} Barang`;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <p class="text-xs text-slate-500 font-semibold">Tidak ditemukan laporan yang cocok.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(item => `
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
                <div class="relative h-36 bg-slate-100">
                    <img src="${item.image}" class="w-full h-full object-cover">
                    <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.type === 'Hilang' ? 'bg-rose-500' : 'bg-emerald-500'}">
                        ${item.type}
                    </span>
                    ${item.status === 'Selesai' ? '<span class="absolute top-2 right-2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">VERIFIKASI TERKLAIM</span>' : ''}
                </div>
                <div class="p-3 space-y-1">
                    <h4 class="font-bold text-xs text-slate-800">${item.itemName}</h4>
                    <p class="text-[11px] text-slate-500 line-clamp-2">${item.description}</p>
                    <p class="text-[10px] text-indigo-600 font-semibold"><i class="fa-solid fa-location-dot"></i> ${item.location}</p>
                </div>
            </div>
            <div class="p-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[10px] text-slate-400">Oleh: ${item.reporterName}</span>
                <button onclick="openDetailModal('${item.id}')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-lg">
                    ${item.type === 'Temuan' && item.status === 'Aktif' ? 'Saya Pengambil Barang' : 'Lihat Detail'}
                </button>
            </div>
        </div>
    `).join('');
}

// --- MODAL DETAIL & KLAIM/VERIFIKASI ---
function openDetailModal(id) {
    const item = reportsData.find(r => r.id === id);
    if (!item) return;

    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const isAdmin = currentUser && currentUser.role === 'admin';

    content.innerHTML = `
        <div class="space-y-3">
            <h3 class="font-bold text-sm text-slate-800">${item.itemName} (${item.type})</h3>
            <p class="text-xs text-slate-600">${item.description}</p>
            <div class="bg-slate-50 p-2.5 rounded-xl border text-xs space-y-1">
                <p><strong>Lokasi:</strong> ${item.location}</p>
                <p><strong>Pelapor/Penemu:</strong> ${item.reporterName} (${item.reporterClass})</p>
                <p><strong>Status:</strong> ${item.status}</p>
                ${item.claimedBy ? `<p class="text-emerald-600 font-bold"><strong>Pengambil Terverifikasi:</strong> ${item.claimedBy}</p>` : ''}
            </div>

            <!-- Bagian Akses Klaim/Verifikasi -->
            <div class="pt-2">
                ${item.status === 'Aktif' ? `
                    ${isAdmin ? `
                        <div class="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2">
                            <p class="text-xs font-bold text-amber-800">Verifikasi Fisik Pengambil (Khusus BK/Admin):</p>
                            <input type="text" id="claimerInputName" placeholder="Nama Siswa Pengambil Barang" class="w-full px-2 py-1 text-xs border rounded-lg">
                            <button onclick="verifyClaimByAdmin('${item.id}')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-xs">
                                Verifikasi & Selesaikan
                            </button>
                        </div>
                    ` : `
                        <div class="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-center space-y-2">
                            <p class="text-xs text-indigo-800 font-medium">Ingin mengambil barang ini?</p>
                            <button onclick="claimNotice('${item.id}')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs">
                                <i class="fa-solid fa-hand-holding mr-1"></i> Pengajuan Klaim Pengambilan
                            </button>
                        </div>
                    `}
                ` : `
                    <div class="text-center bg-slate-100 py-2 rounded-xl text-xs font-bold text-slate-500">
                        Barang ini telah resmi diserahkan & diverifikasi BK.
                    </div>
                `}
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function claimNotice(id) {
    alert(`[PETUNJUK PENGAMBILAN]\nSilakan temui Guru BK di Ruang BK dengan menunjukkan Kartu Pelajar untuk mengambil barang laporan ID: ${id}.`);
}

function verifyClaimByAdmin(id) {
    const claimerName = document.getElementById('claimerInputName')?.value.trim();
    if (!claimerName) {
        alert("Harap masukkan nama siswa yang mengambil barang untuk arsip verifikasi BK.");
        return;
    }

    const item = reportsData.find(r => r.id === id);
    if (item) {
        item.status = 'Selesai';
        item.claimedBy = claimerName;
        saveToLocalStorage();
        closeModal();
        renderData();
        calculateAIMatches();
        updateStatistics();
        alert(`Verifikasi Berhasil! Barang resmi diserahkan kepada: ${claimerName}`);
    }
}

function closeModal() { document.getElementById('detailModal').classList.add('hidden'); }

// --- AI MATCHING & STATS UTILS ---
function calculateAIMatches() {
    const activeLost = reportsData.filter(i => i.type === 'Hilang' && i.status === 'Aktif');
    const activeFound = reportsData.filter(i => i.type === 'Temuan' && i.status === 'Aktif');
    const matches = [];

    activeLost.forEach(lost => {
        activeFound.forEach(found => {
            let score = 0;
            if (lost.category === found.category) score += 40;
            if (lost.location === found.location) score += 30;
            const shared = (lost.tags||[]).filter(t => (found.tags||[]).includes(t));
            score += Math.min(shared.length * 15, 28);

            if (score >= 40) matches.push({ lost, found, score: Math.min(score, 98) });
        });
    });

    const container = document.getElementById('aiMatchContainer');
    if (!container) return;

    if (matches.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">Belum ada pencocokan AI yang terdeteksi.</p>`;
        return;
    }

    container.innerHTML = matches.map(m => `
        <div class="bg-white border rounded-xl p-3 text-xs space-y-2">
            <div class="flex justify-between items-center border-b pb-1">
                <span class="font-bold text-indigo-600"><i class="fa-solid fa-bolt"></i> Match: ${m.score}%</span>
                <span class="text-[10px] text-slate-400">AI Verified</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
                <div class="bg-rose-50 p-2 rounded-lg"><strong>Hilang:</strong> ${m.lost.itemName}</div>
                <div class="bg-emerald-50 p-2 rounded-lg"><strong>Temuan:</strong> ${m.found.itemName}</div>
            </div>
        </div>
    `).join('');
}

function updateStatistics() {
    document.getElementById('statTotal').innerText = reportsData.length;
    document.getElementById('statTemuan').innerText = reportsData.filter(r => r.type === 'Temuan' && r.status === 'Aktif').length;
    document.getElementById('statHilang').innerText = reportsData.filter(r => r.type === 'Hilang' && r.status === 'Aktif').length;
    document.getElementById('statSelesai').innerText = reportsData.filter(r => r.status === 'Selesai').length;
}

function generateAutoTags() {
    const text = document.getElementById('itemDesc')?.value || '';
    const container = document.getElementById('tagContainer');
    if (!container) return;
    const words = text.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 2);
    const unique = [...new Set(words)].slice(0, 5);
    container.innerHTML = unique.map(t => `<span class="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded">#${t}</span>`).join('') || '<span class="text-[10px] text-slate-400">Ketik deskripsi...</span>';
}

function previewImage(e) {}
function toggleChatbot() { document.getElementById('chatWindow')?.classList.toggle('hidden'); }
function sendChatMessage(e) { e.preventDefault(); }
function exportData() {}
function resetData() {}
