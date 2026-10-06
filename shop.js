(function () {
  const money = n => "$" + n.toFixed(2);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const selected = new Set();
  const catalog = document.getElementById("catalog");

  // Build the catalog by category, in the order categories first appear
  const cats = [...new Set(PRODUCTS.map(p => p.category))];
  catalog.innerHTML = cats.map(cat => `
    <div class="cat"><h3>${esc(cat)}</h3>
      ${PRODUCTS.filter(p => p.category === cat).map(p => `
        <div class="item">
          <h4 id="t-${p.id}">${esc(p.name)}</h4>
          <p>${esc(p.desc)}</p>
          <div class="buy">${
            typeof p.price === "number"
              ? `<span class="price">${money(p.price)}</span>
                 <label><input type="checkbox" data-id="${p.id}" aria-describedby="t-${p.id}"> Add to order</label>`
              : `<span class="soon">Coming soon</span>`
          }</div>
        </div>`).join("")}
    </div>`).join("");

  const list = document.getElementById("order-list");
  const totalEl = document.getElementById("order-total");
  const emptyEl = document.getElementById("order-empty");
  const payWrap = document.getElementById("pay-wrap");
  const msg = document.getElementById("order-msg");

  const items = () => PRODUCTS.filter(p => selected.has(p.id));
  const total = () => items().reduce((s, p) => s + p.price, 0);

  function render() {
    const chosen = items();
    list.innerHTML = chosen.map(p => `<li><span>${esc(p.name)}</span><span>${money(p.price)}</span></li>`).join("");
    totalEl.textContent = money(total());
    emptyEl.classList.toggle("hidden", chosen.length > 0);
    payWrap.classList.toggle("hidden", chosen.length === 0);
  }

  catalog.addEventListener("change", e => {
    const id = e.target.dataset && e.target.dataset.id;
    if (!id) return;
    e.target.checked ? selected.add(id) : selected.delete(id);
    msg.textContent = "";
    render();
  });
  render();

  // PayPal checkout: the total and item names are sent to PayPal automatically
  function startPayPal() {
    if (!window.paypal) {
      msg.textContent = "Checkout couldn't load. Check your connection and refresh the page.";
      return;
    }
    paypal.Buttons({
      style: { color: "gold", shape: "rect", label: "pay" },
      createOrder: (data, actions) => {
        const chosen = items();
        const value = total().toFixed(2);
        return actions.order.create({
          purchase_units: [{
            description: "Burnished Grace Creative Studio order",
            amount: { currency_code: "USD", value,
              breakdown: { item_total: { currency_code: "USD", value } } },
            items: chosen.map(p => ({
              name: p.name.slice(0, 127), quantity: "1", category: "DIGITAL_GOODS",
              unit_amount: { currency_code: "USD", value: p.price.toFixed(2) }
            }))
          }]
        });
      },
      onClick: (data, actions) => items().length ? actions.resolve() : actions.reject(),
      onApprove: (data, actions) => actions.order.capture().then(() => {
        selected.clear();
        catalog.querySelectorAll("input[type=checkbox]").forEach(b => (b.checked = false));
        render();
        msg.textContent = "Thank you! Your payment went through. Your files will be sent to the email address on your PayPal account.";
      }),
      onError: () => {
        msg.textContent = "Your payment didn't go through, and you haven't been charged. Please try again or email inquiry@TheEchoesProject.net.";
      }
    }).render("#paypal-buttons");
  }
  window.addEventListener("load", startPayPal);
})();
