// data.js
export const ADMIN_WHATSAPP = "233533932008"; // change

export const CATEGORY_LABELS = {
  all: "All",
  ladies: "Ladies Dress",
  shoes: "Shoes / Heels",
  mens: "Men’s Shirt",
  trousers: "Trousers",
  perfume: "Perfume"
};

export const money = (n) => `GHS ${Number(n).toFixed(2)}`;



// Default products (used only if admin hasn't uploaded any yet)
export const DEFAULT_PRODUCTS = [
  {
    id: "l1",
    title: "Elegant Ladies Dress",
    category: "ladies",
    price: 220,
    image: "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=60",
    sizes: ["S","M","L","XL","XXL"]
  },
  {
    id: "s1",
    title: "Ladies Heels",
    category: "shoes",
    price: 190,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=60",
    sizes: ["34","35","36","37","38","39","40","41","42","43"]
  },
  {
    id: "m1",
    title: "Men’s Classic Shirt",
    category: "mens",
    price: 150,
    image: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?auto=format&fit=crop&w=1200&q=60",
    sizes: ["S","M","L","XL","XXL"]
  },

  {
    id: "p1",
    title: "Luxury Perfume",
    category: "perfume",
    price: 180,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=60",
    sizes: ["30ml","50ml","100ml"]
  },

  // Your local images (IMPORTANT: rename files to remove spaces)
  {
    id: "l2",
    title: "Luxury Speed Up Joggers",
    category: "ladies",
    price: 220,
    image: "images/LUXURY SPEED UP JOGGERS.jpg",
    sizes: ["S","M","L","XL","XXL"]
  },
  {
    id: "s2",
    title: "Classic High Heels",
    category: "shoes",
    price: 190,
    image: "images/2021 Summer Plus Size 34-43 Woman 9_5cm High Heels Sandals Classic Block.jpg",
    sizes: ["34","35","36","37","38","39","40","41","42","43"]
  }

];

export function loadProducts(){
  try {
    const saved = JSON.parse(localStorage.getItem(LS_PRODUCTS)) || [];
    return saved.length ? saved : DEFAULT_PRODUCTS;
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

export function saveProducts(list){
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(list));
}
