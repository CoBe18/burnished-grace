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
          ${p.page ? `<p class="more"><a href="${esc(p.page)}">See details and screenshots</a></p>` : ""}
          <div class="buy">${
            typeof p.price === "number"
              ? `<span class="price">${money(p.price)}</span>
                 <label><input type="checkbox" data-id="${p.id}" aria-describedby="t-${p.id}"> Add to order</label>
                 <span class="included hidden" id="inc-${p.id}"></span>`
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
  const box = id => catalog.querySelector(`input[data-id="${id}"]`);

  // A product that "includes" others (such as the PLR Edition) takes their place,
  // so a buyer can't pay for the same thing twice.
  function applyIncludes() {
    const covered = new Map();
    PRODUCTS.filter(p => selected.has(p.id)).forEach(p => (p.includes || []).forEach(id => covered.set(id, p)));
    PRODUCTS.forEach(p => {
      const b = box(p.id), note = document.getElementById("inc-" + p.id);
      if (!b || !note) return;
      const by = covered.get(p.id);
      if (by) { selected.delete(p.id); b.checked = false; }
      b.disabled = !!by;
      note.textContent = by ? "Included in " + by.name : "";
      note.classList.toggle("hidden", !by);
    });
  }
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
    applyIncludes();
    render();
  });

  // Links such as index.html?add=real-estate-app#shop start the order with that item.
  const wanted = new URLSearchParams(location.search).get("add");
  const start = PRODUCTS.find(p => p.id === wanted && typeof p.price === "number");
  if (start) { selected.add(start.id); box(start.id).checked = true; applyIncludes(); }
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
              name: p.name.slice(0, 127), sku: p.id, quantity: "1", category: "DIGITAL_GOODS",
              unit_amount: { currency_code: "USD", value: p.price.toFixed(2) }
            }))
          }]
        });
      },
      onClick: (data, actions) => items().length ? actions.resolve() : actions.reject(),
      onApprove: (data, actions) => actions.order.capture().then(order => {
        // A declined card can be retried with another payment method.
        const declined = (order.details || []).some(d => d.issue === "INSTRUMENT_DECLINED");
        if (declined) return actions.restart();
        const done = order.status === "COMPLETED" ||
          ((order.purchase_units || [])[0]?.payments?.captures?.[0]?.status === "COMPLETED");
        if (!done) {
          msg.textContent = "Your payment didn't go through, and you haven't been charged. Please try again or email inquiry@BurnishedGraceStudio.com.";
          return;
        }
        selected.clear();
        catalog.querySelectorAll("input[type=checkbox]").forEach(b => (b.checked = false));
        applyIncludes();
        render();
        msg.textContent = "Thank you! Your payment went through. Preparing your downloads…";
        return fetch("api/verify.php", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderID: data.orderID })
        }).then(r => r.json()).then(res => {
          if (!res.ok) throw new Error(res.error);
          msg.innerHTML = `<strong>Thank you! Your payment went through.</strong> Your downloads are ready:` +
            `<span class="downloads">${res.links.map(l =>
              `<a class="btn" href="${esc(l.url)}" download>Download ${esc(l.name)}</a>`).join("")}</span>` +
            `These links work for ${res.hours} hours, and we've emailed a copy to the address on your PayPal account.`;
        }).catch(() => {
          msg.textContent = "Your payment went through. If your download links don't appear, email inquiry@BurnishedGraceStudio.com with your PayPal receipt and we'll send your files right away.";
        });
      }, () => {
        // PayPal couldn't take the payment, so the buyer was not charged.
        msg.textContent = "Your payment didn't go through, and you haven't been charged. Please try again or email inquiry@BurnishedGraceStudio.com.";
      }),
      onError: () => {
        msg.textContent = "Your payment didn't go through, and you haven't been charged. Please try again or email inquiry@BurnishedGraceStudio.com.";
      }
    }).render("#paypal-buttons");
  }
  window.addEventListener("load", startPayPal);
})();
