import { loadProducts, saveProducts, CATEGORY_LABELS } from "./data.js";

const el = (id) => document.getElementById(id);

let products = loadProducts();
let editId = null;

function uid(){
  return "P-" + Math.random().toString(16).slice(2).toUpperCase() + "-" + Date.now();
}

function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function renderList(){
  const wrap = el("productList");
  products = loadProducts();

  wrap.innerHTML = products.map(p => `
    <article class="card">
      <img src="${p.image}" alt="${p.title}">
      <div class="pad">
        <div class="row">
          <span class="pill">${CATEGORY_LABELS[p.category] || p.category}</span>
          <span class="small">GHS ${Number(p.price).toFixed(2)}</span>
        </div>
        <h4 class="title">${p.title}</h4>

        <div class="row" style="justify-content:flex-start; gap:8px;">
          <button class="btn ghost" data-edit="${p.id}">Edit</button>
          <button class="btn ghost" data-del="${p.id}" style="border-color: rgba(255,107,107,.45);">Delete</button>
        </div>
      </div>
    </article>
  `).join("");

  wrap.querySelectorAll("[data-del]").forEach(b => {
    b.addEventListener("click", () => {
      const id = b.dataset.del;
      if(!confirm("Delete this product?")) return;
      products = products.filter(x => x.id !== id);
      saveProducts(products);
      renderList();
    });
  });

  wrap.querySelectorAll("[data-edit]").forEach(b => {
    b.addEventListener("click", () => {
      const id = b.dataset.edit;
      const p = products.find(x => x.id === id);
      if(!p) return;
      editId = id;

      el("pTitle").value = p.title;
      el("pCategory").value = p.category;
      el("pPrice").value = p.price;
      el("pImageUrl").value = p.image?.startsWith("data:") ? "" : (p.image || "");
      el("pImageFile").value = "";

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

el("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = el("pTitle").value.trim();
  const category = el("pCategory").value;
  const price = Number(el("pPrice").value || 0);
  const imageUrl = el("pImageUrl").value.trim();
  const file = el("pImageFile").files?.[0];

  let image = imageUrl || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=60";

  if(file){
    try{
      image = await fileToBase64(file);
    }catch{
      alert("Unable to read uploaded image. Try another image.");
      return;
    }
  }

  products = loadProducts();

  if(editId){
    const idx = products.findIndex(x => x.id === editId);
    if(idx >= 0){
      products[idx] = { ...products[idx], title, category, price, image };
    }
    editId = null;
  } else {
    products.unshift({ id: uid(), title, category, price, image });
  }

  saveProducts(products);
  e.target.reset();
  renderList();
  alert("Saved ✅ Now open shop to see the product.");
});

renderList();