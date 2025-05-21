fetch('http://localhost:5000/api/products')
  .then(res => res.json())
  .then(products => {
    const list = document.getElementById('product-list');
    products.forEach(p => {
      list.innerHTML += `
        <div>
          <img src="${p.image}" width="100" />
          <h3>${p.name}</h3>
          <p>$${p.price}</p>
          <button onclick='addToCart("${p._id}")'>Add to Cart</button>
        </div>
      `;
    });
  });

function addToCart(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push(productId);
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart!");
}
