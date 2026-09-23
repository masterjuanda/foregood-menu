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
  const options = ["Semua", ...categories.map((c) => c.nama)];
  pillRowEl.innerHTML = options
    .map(
      (cat) => `
    <div class="pill ${cat === activeCategory ? "active" : ""}" data-cat="${cat}">${cat}</div>
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
  return allProducts.filter((p) => {
    const matchCat =
      activeCategory === "Semua" || p.kategori?.nama === activeCategory;
    const matchQuery = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
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
      </div>
      <div class="info">
        <h3>${p.nama}</h3>
        <div class="meta-row">
          <span class="badge">${p.kategori?.nama || "Menu"}</span>
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
    <div class="sheet-imgbox">
      <div class="grabber"></div>
      <button class="closebtn" id="closeBtn" aria-label="Tutup">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
      <div class="hero"><img src="${p.gambar_url || ""}" alt="${p.nama}" onerror="this.style.opacity=0"></div>
    </div>
    <div class="body">
      <span class="tag">${p.kategori?.nama || "Menu"}</span>
      <h2>${p.nama}</h2>
      <div class="price">${formatRupiah(p.harga)}</div>
      <div class="desc ${p.deskripsi ? "" : "empty"}">${p.deskripsi || "Belum ada deskripsi untuk menu ini."}</div>
    </div>
  `;
  overlay.classList.add("show");
  document.body.style.overflow = "hidden";
  document.getElementById("closeBtn").addEventListener("click", closeDetail);
}

function closeDetail() {
  overlay.classList.remove("show");
  document.body.style.overflow = "";
}
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
      supa.from("kategori").select("*").order("nama"),
      supa
        .from("produk")
        .select(
          "id, kategori_id, nama, harga, deskripsi, gambar_url, kategori:kategori_id(nama)",
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
