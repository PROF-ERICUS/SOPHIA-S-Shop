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

  grid.innerHTML = list.map(p => {
    const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;

    return `
      <article class="card">
        <img src="${p.image}" alt="${p.title}">
        <div class="pad">
          <div class="row">
            <span class="pill">${CATEGORY_LABELS[p.category] || p.category}</span>
            <span class="price">${money(p.price)}</span>
          </div>

          <h4 class="title">${p.title}</h4>

          ${hasSizes ? `
            <label class="field" style="margin-top:8px;">
              <span>Select size</span>
              <select class="size-select"
                      data-size-for="${p.id}"
                      style="width:100%; padding:11px 12px; border-radius:14px; border:1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); color:#eaf0ff; outline:none;">
                ${p.sizes.map(s => `<option value="${String(s)}">${String(s)}</option>`).join("")}
              </select>
            </label>
          ` : `
            <div class="tiny muted" style="margin-top:8px;">No size selection</div>
          `}

          <button class="btn" data-add="${p.id}" style="margin-top:10px;">Add to Cart</button>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      const productId = btn.dataset.add;
      const sizeSelect = grid.querySelector(`[data-size-for="${productId}"]`);
      const size = sizeSelect ? sizeSelect.value : "";
      addToCart(productId, size);
    });
  });
}

/**
 * Add to cart
 * If product has sizes: item is unique by (id + size)
 * If no sizes: item is unique by id only
 */
function addToCart(productId, size){
  PRODUCTS = loadProducts();
  const p = PRODUCTS.find(x => x.id === productId);
  if(!p) return;

  const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;

  // if the product needs size but user didn't select (shouldn't happen because default option exists)
  if(hasSizes && !size){
    alert("Please select a size.");
    return;
  }

  const found = state.cart.find(i =>
    i.id === productId && (hasSizes ? (i.size === size) : true)
  );

  if(found) found.qty += 1;
  else state.cart.push({ id: productId, qty: 1, size: hasSizes ? size : "" });

  saveCart();
  updateCartBadge();
  renderCart();
}

function removeFromCart(productId, size){
  state.cart = state.cart.filter(i => !(i.id === productId && (i.size || "") === (size || "")));
  saveCart();
  updateCartBadge();
  renderCart();
}

function changeQty(productId, size, delta){
  const item = state.cart.find(i => i.id === productId && (i.size || "") === (size || ""));
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

      const sizeText = it.size ? ` • Size: <strong>${it.size}</strong>` : "";

      return `
        <div class="cart-item">
          <img src="${p.image}" alt="${p.title}">
          <div>
            <div class="top">
              <div>
                <div class="name">${p.title}</div>
                <div class="muted tiny">
                  ${money(p.price)} • ${CATEGORY_LABELS[p.category] || p.category}
                  ${sizeText}
                </div>
              </div>
              <button class="mini-btn remove"
                      data-remove="${p.id}"
                      data-size="${it.size || ""}"
                      title="Remove">✕</button>
            </div>

            <div class="controls">
              <button class="mini-btn" data-minus="${p.id}" data-size="${it.size || ""}">−</button>
              <strong>${it.qty}</strong>
              <button class="mini-btn" data-plus="${p.id}" data-size="${it.size || ""}">+</button>
              <span class="muted tiny" style="margin-left:auto">${money(p.price * it.qty)}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  el("cartItemsCount").textContent = String(cartCount());
  el("cartTotal").textContent = money(cartTotal());

  wrap.querySelectorAll("[data-remove]").forEach(b =>
    b.addEventListener("click", () => removeFromCart(b.dataset.remove, b.dataset.size))
  );
  wrap.querySelectorAll("[data-minus]").forEach(b =>
    b.addEventListener("click", () => changeQty(b.dataset.minus, b.dataset.size, -1))
  );
  wrap.querySelectorAll("[data-plus]").forEach(b =>
    b.addEventListener("click", () => changeQty(b.dataset.plus, b.dataset.size, +1))
  );
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
  PRODUCTS = loadProducts();

  const name = (el("custName").value || "").trim();
  const location = (el("custLocation").value || "").trim();

  let msg = `🛍️ *NEW ORDER*%0A`;
  if(name) msg += `👤 Name: ${encodeURIComponent(name)}%0A`;
  if(location) msg += `📍 Location: ${encodeURIComponent(location)}%0A`;
  msg += `%0A🧾 *Items:*%0A`;

  state.cart.forEach((it, idx) => {
    const p = PRODUCTS.find(x => x.id === it.id);
    if(!p) return;

    const sizePart = it.size ? ` (Size: ${it.size})` : "";
    msg += `${idx+1}. ${encodeURIComponent(p.title + sizePart)} x${it.qty} = ${encodeURIComponent(money(p.price * it.qty))}%0A`;
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
