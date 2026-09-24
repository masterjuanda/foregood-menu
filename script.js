// ====== ISI SESUAI PROJECT SUPABASE KAMU ======
const SUPABASE_URL = "https://deyxmpihsiqrrzelsfsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LpBuLa03qMWKqDqATTQXqg_eM3VQGwp";
// ===============================================

const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allProducts = [];
let categories = [];
let activeCategory = "Semua";
let searchQuery = "";

const gridEl = document.getElementById("grid");
const pillRowEl = document.getElementById("pillRow");
const searchInput = document.getElementById("searchInput");
const overlay = document.getElementById("overlay");
const sheet = document.getElementById("sheet");

function formatRupiah(num) {
  return "Rp " + Number(num).toLocaleString("id-ID");
}

function formatBadgeCategory(cat) {
  if (!cat) return "Menu";
  const map = {
    coffee: "Coffee",
    noncoffee: "Non Coffee",
    "ice cream": "Ice Cream",
    cemilan: "Camilan",
  };
  return map[cat.toLowerCase().trim()] || cat;
}

function renderSkeleton() {
  gridEl.innerHTML = Array.from({ length: 6 })
    .map(
      () => `
    <div class="card skel-card">
      <div class="imgwrap skel"></div>
      <div class="info">
        <div class="skel" style="height:14px;width:70%;border-radius:6px;"></div>
        <div class="skel" style="height:12px;width:40%;border-radius:6px;margin-top:8px;"></div>
      </div>
    </div>`,
    )
    .join("");
}

function renderPills() {
  const priorityOrder = ["coffee", "noncoffee", "ice cream", "cemilan"];

  const sortedCategories = categories
    .map((c) => c.nama)
    .sort((a, b) => {
      let indexA = priorityOrder.indexOf(a.toLowerCase().trim());
      let indexB = priorityOrder.indexOf(b.toLowerCase().trim());
      if (indexA === -1) indexA = 99;
      if (indexB === -1) indexB = 99;
      return indexA - indexB;
    });

  const options = ["Semua", ...sortedCategories];

  pillRowEl.innerHTML = options
    .map(
      (cat) => `
    <div class="pill ${cat === activeCategory ? "active" : ""}" data-cat="${cat}">
      ${cat === "Semua" ? cat : formatBadgeCategory(cat)}
    </div>
  `,
    )
    .join("");

  pillRowEl.querySelectorAll(".pill").forEach((el) => {
    el.addEventListener("click", () => {
      activeCategory = el.dataset.cat;
      renderPills();
      renderGrid();
    });
  });
}

function getFiltered() {
  const q = searchQuery.toLowerCase().trim();
  return allProducts.filter((p) => {
    const matchCat =
      activeCategory === "Semua" || p.kategori?.nama === activeCategory;
    const matchQuery = !q || p.nama.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });
}

function renderGrid() {
  const items = getFiltered();

  if (items.length === 0) {
    gridEl.innerHTML = `
      <div class="state-msg">
        <h3>Menu Tidak Ditemukan</h3>
        <p>Coba kata kunci atau kategori lain</p>
      </div>`;
    return;
  }

  gridEl.innerHTML = items
    .map(
      (p) => `
    <div class="card" tabindex="0" data-id="${p.id}">
      <div class="imgwrap">
        <img src="${p.gambar_url || ""}" alt="${p.nama}" loading="lazy" onerror="this.style.opacity=0">
        <span class="badge">${formatBadgeCategory(p.kategori?.nama)}</span>
      </div>
      <div class="info">
        <h3>${p.nama}</h3>
        <div class="meta-row">
          <span class="price">${formatRupiah(p.harga)}</span>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  gridEl.querySelectorAll(".card").forEach((card) => {
    const open = () => openDetail(Number(card.dataset.id));
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") open();
    });
  });
}

function openDetail(id) {
  const p = allProducts.find((x) => x.id === id);
  if (!p) return;

  sheet.innerHTML = `
    <div class="sheet-drag-area" id="sheetDragArea">
      <div class="grabber"></div>
    </div>
    <div class="sheet-imgbox">
      <button class="closebtn" id="closeBtn" aria-label="Tutup">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6 6 18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
        </svg>
      </button>
      <div class="hero">
        <img src="${p.gambar_url || ""}" alt="${p.nama}" onerror="this.style.opacity=0">
      </div>
    </div>
    <div class="body">
      <span class="tag">${formatBadgeCategory(p.kategori?.nama)}</span>
      <div class="sheet-header-row">
        <h2>${p.nama}</h2>
        <div class="price">${formatRupiah(p.harga)}</div>
      </div>
      <div class="sheet-desc-box">
        <div class="sheet-desc-title">Tentang Produk Ini</div>
        <p class="desc ${p.deskripsi ? "" : "empty"}">
          ${p.deskripsi || "Belum ada catatan racikan atau deskripsi sajian untuk menu ini."}
        </p>
      </div>
    </div>
  `;

  overlay.classList.add("show");
  document.body.style.overflow = "hidden";

  sheet.style.transition = "transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)";
  sheet.style.transform = "translateY(0)";

  document.getElementById("closeBtn").addEventListener("click", closeDetail);
}

function closeDetail() {
  sheet.style.transition = "transform 0.24s ease";
  sheet.style.transform = "translateY(100%)";
  overlay.classList.remove("show");
  document.body.style.overflow = "";
}

// Pasang gesture swipe down satu kali saja secara global agar tidak menumpuk saat gonta-ganti menu
let startY = 0;
let currentY = 0;
let isDragging = false;

sheet.addEventListener(
  "touchstart",
  (e) => {
    if (sheet.scrollTop <= 0) {
      startY = e.touches[0].clientY;
      isDragging = true;
      sheet.style.transition = "none";
    }
  },
  { passive: true },
);

window.addEventListener(
  "touchmove",
  (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    if (deltaY > 0) {
      sheet.style.transform = `translateY(${deltaY}px)`;
    }
  },
  { passive: true },
);

window.addEventListener("touchend", () => {
  if (!isDragging) return;
  isDragging = false;
  const deltaY = currentY - startY;
  if (deltaY > 90) {
    closeDetail();
  } else {
    sheet.style.transition = "transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)";
    sheet.style.transform = "translateY(0)";
  }
  startY = 0;
  currentY = 0;
});

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeDetail();
});

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderGrid();
});

async function loadData() {
  renderSkeleton();
  try {
    const [
      { data: kategoriData, error: kErr },
      { data: produkData, error: pErr },
    ] = await Promise.all([
      supa.from("kategori").select("nama").order("nama"),
      supa
        .from("produk")
        .select(
          "id, nama, harga, deskripsi, gambar_url, kategori:kategori_id(nama)",
        )
        .order("id", { ascending: false }),
    ]);

    if (kErr) throw kErr;
    if (pErr) throw pErr;

    categories = kategoriData || [];
    allProducts = produkData || [];

    renderPills();
    renderGrid();
  } catch (err) {
    console.error(err);
    gridEl.innerHTML = `
      <div class="state-msg">
        <h3>Gagal memuat menu</h3>
        <p>Periksa koneksi internet atau coba lagi nanti.</p>
      </div>`;
  }
}

loadData();
