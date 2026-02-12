import { loadProducts, ADMIN_WHATSAPP, CATEGORY_LABELS, money } from "./data.js";

const el = (id) => document.getElementById(id);

const LS_CART = "newshop_cart_v1";

let PRODUCTS = loadProducts(); // ✅ from admin
let state = {
  category: "all",
  search: "",
  cart: loadCart()
};

function loadCart(){
  try { return JSON.parse(localStorage.getItem(LS_CART)) || []; }
  catch { return []; }
}
function saveCart(){
  localStorage.setItem(LS_CART, JSON.stringify(state.cart));
}

function cartCount(){
  return state.cart.reduce((a,i)=>a+i.qty, 0);
}
function cartTotal(){
  return state.cart.reduce((sum, it) => {
    const p = PRODUCTS.find(x => x.id === it.id);
    return sum + (p ? p.price * it.qty : 0);
  }, 0);
}
function updateCartBadge(){
  el("cartCount").textContent = cartCount();
}

function filteredProducts(){
  // refresh in case admin updated while shop is open
  PRODUCTS = loadProducts();

  return PRODUCTS.filter(p => {
    const catOk = state.category === "all" || p.category === state.category;
    const q = state.search.trim().toLowerCase();
    const qOk = !q || p.title.toLowerCase().includes(q);
    return catOk && qOk;
  });
}

function renderProducts(){
  const grid = el("productGrid");
  const list = filteredProducts();

  el("resultInfo").textContent =
    state.category === "all"
      ? `Showing ${list.length} item(s)`
      : `Showing ${list.length} item(s) in ${CATEGORY_LABELS[state.category] || state.category}`;

  grid.innerHTML = list.map(p => `
    <article class="card">
      <img src="${p.image}" alt="${p.title}">
      <div class="pad">
        <div class="row">
          <span class="pill">${CATEGORY_LABELS[p.category] || p.category}</span>
          <span class="price">${money(p.price)}</span>
        </div>
        <h4 class="title">${p.title}</h4>
        <button class="btn" data-add="${p.id}">Add to Cart</button>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => addToCart(btn.dataset.add));
  });
}

function addToCart(productId){
  const found = state.cart.find(i => i.id === productId);
  if(found) found.qty += 1;
  else state.cart.push({ id: productId, qty: 1 });

  saveCart();
  updateCartBadge();
  renderCart();
}

function removeFromCart(productId){
  state.cart = state.cart.filter(i => i.id !== productId);
  saveCart();
  updateCartBadge();
  renderCart();
}

function changeQty(productId, delta){
  const item = state.cart.find(i => i.id === productId);
  if(!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  updateCartBadge();
  renderCart();
}

function renderCart(){
  const wrap = el("cartItems");

  // refresh products so cart names/prices match latest
  PRODUCTS = loadProducts();

  if(!state.cart.length){
    wrap.innerHTML = `<p class="muted">Your cart is empty. Add items to order.</p>`;
  } else {
    wrap.innerHTML = state.cart.map(it => {
      const p = PRODUCTS.find(x => x.id === it.id);
      if(!p) return "";
      return `
        <div class="cart-item">
          <img src="${p.image}" alt="${p.title}">
          <div>
            <div class="top">
              <div>
                <div class="name">${p.title}</div>
                <div class="muted tiny">${money(p.price)} • ${CATEGORY_LABELS[p.category] || p.category}</div>
              </div>
              <button class="mini-btn remove" data-remove="${p.id}" title="Remove">✕</button>
            </div>

            <div class="controls">
              <button class="mini-btn" data-minus="${p.id}">−</button>
              <strong>${it.qty}</strong>
              <button class="mini-btn" data-plus="${p.id}">+</button>
              <span class="muted tiny" style="margin-left:auto">${money(p.price * it.qty)}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  el("cartItemsCount").textContent = String(cartCount());
  el("cartTotal").textContent = money(cartTotal());

  wrap.querySelectorAll("[data-remove]").forEach(b => b.addEventListener("click", () => removeFromCart(b.dataset.remove)));
  wrap.querySelectorAll("[data-minus]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.minus, -1)));
  wrap.querySelectorAll("[data-plus]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.plus, +1)));
}

function openCart(){
  el("cartDrawer").classList.add("show");
  el("cartDrawer").setAttribute("aria-hidden","false");
}
function closeCart(){
  el("cartDrawer").classList.remove("show");
  el("cartDrawer").setAttribute("aria-hidden","true");
}

function buildWhatsAppMessage(){
  const name = (el("custName").value || "").trim();
  const location = (el("custLocation").value || "").trim();

  let msg = `🛍️ *NEW ORDER*%0A`;
  if(name) msg += `👤 Name: ${encodeURIComponent(name)}%0A`;
  if(location) msg += `📍 Location: ${encodeURIComponent(location)}%0A`;
  msg += `%0A🧾 *Items:*%0A`;

  state.cart.forEach((it, idx) => {
    const p = PRODUCTS.find(x => x.id === it.id);
    if(!p) return;
    msg += `${idx+1}. ${encodeURIComponent(p.title)} x${it.qty} = ${encodeURIComponent(money(p.price * it.qty))}%0A`;
  });

  msg += `%0A💰 *Total:* ${encodeURIComponent(money(cartTotal()))}%0A`;
  msg += `%0APlease confirm availability and delivery. Thanks ✅`;

  return msg;
}

function orderOnWhatsApp(){
  if(!state.cart.length){
    alert("Your cart is empty.");
    return;
  }
  const text = buildWhatsAppMessage();
  const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${text}`;
  window.open(url, "_blank");
}

// Events
document.addEventListener("click", (e) => {
  if(e.target?.dataset?.close) closeCart();
});

el("openCartBtn").addEventListener("click", () => { renderCart(); openCart(); });
el("closeCartBtn").addEventListener("click", closeCart);

el("searchInput").addEventListener("input", (e) => {
  state.search = e.target.value;
  renderProducts();
});

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    state.category = chip.dataset.cat;
    renderProducts();
  });
});

el("orderWhatsAppBtn").addEventListener("click", orderOnWhatsApp);

// init category from url
(function initCategoryFromUrl(){
  const params = new URLSearchParams(location.search);
  const cat = params.get("cat");
  if(cat && document.querySelector(`.chip[data-cat="${cat}"]`)){
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    const btn = document.querySelector(`.chip[data-cat="${cat}"]`);
    btn.classList.add("active");
    state.category = cat;
  }
})();

// Init
updateCartBadge();
renderProducts();
renderCart();