// Minimal product list (you can fetch from /api/products later)
const PRODUCTS = [
  {id:1,title:"Robe Dorée",price:2500,image:"images/femme1.jpg"},
  {id:2,title:"Robe Verte",price:2200,image:"images/femme2.jpg"},
  {id:3,title:"Robe Lilas",price:2000,image:"images/homme1.jpg"},
];

// render catalog
const catalog = document.getElementById('catalog');
function renderCatalog(){
  catalog.innerHTML = '';
  PRODUCTS.forEach(p=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<img src="${p.image}" alt="${p.title}"><h4>${p.title}</h4><div class="price">${p.price} HTG</div><div style="margin-top:10px"><button class="btn" data-id="${p.id}">Ajouter</button></div>`;
    catalog.appendChild(card);
  });
}
renderCatalog();

// cart state
let cart = JSON.parse(localStorage.getItem('cart')||'[]');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
function updateCartUI(){
  cartCount.textContent = cart.reduce((s,i)=>s+i.qty,0);
  cartItemsEl.innerHTML='';
  const total = cart.reduce((s,i)=>s + i.qty * i.price, 0);
  cartTotalEl.textContent = total.toFixed(2);
  cart.forEach(it=>{
    const div=document.createElement('div'); div.className='cart-item';
    div.innerHTML = `<div style="flex:1"><strong>${it.title}</strong><div>${it.qty} x ${it.price} HTG</div></div><div><button class="btn" data-remove="${it.id}">-</button></div>`;
    cartItemsEl.appendChild(div);
  });
  localStorage.setItem('cart', JSON.stringify(cart));
}
document.addEventListener('click', e=>{
  if(e.target.matches('.card .btn') || e.target.matches('.card .btn *')){
    const id = parseInt(e.target.closest('.card').querySelector('.btn').dataset.id || e.target.dataset.id);
    const product = PRODUCTS.find(p=>p.id===id);
    const found = cart.find(c=>c.id===product.id);
    if(found) found.qty++;
    else cart.push({...product,qty:1});
    updateCartUI();
  }
  if(e.target.matches('[data-remove]')){ const id=+e.target.dataset.remove; const idx=cart.findIndex(c=>c.id===id); if(idx>-1){ cart[idx].qty--; if(cart[idx].qty<=0) cart.splice(idx,1); updateCartUI(); } }
});
document.getElementById('view-cart').addEventListener('click', ()=> cartModal.classList.remove('hidden'));
document.getElementById('closeCart').addEventListener('click', ()=> cartModal.classList.add('hidden'));

// checkout button - sends order to backend
document.getElementById('checkoutBtn').addEventListener('click', async ()=>{
  if(cart.length===0){ alert('Votre panier est vide'); return; }
  const order = { items: cart, total: cart.reduce((s,i)=>s + i.qty * i.price,0) };
  try{
    const res = await fetch('/api/create-order', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(order)
    });
    const data = await res.json();
    if(data && data.paymentUrl){
      // redirect user to the MonCash payment url (or show QR)
      window.location.href = data.paymentUrl;
    } else {
      alert('Erreur paiement (voir console)');
      console.error(data);
    }
  }catch(err){
    console.error(err); alert('Erreur réseau');
  }
});
updateCartUI();

