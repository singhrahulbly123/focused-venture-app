(() => {
  const formatMoney = (amount, currency, format) => {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount));
    } catch {
      return `${amount} ${currency}`;
    }
  };

  document.querySelectorAll(".draft-preview[data-endpoint]").forEach(async (root) => {
    const status = root.querySelector(".draft-preview__status");
    const grid = root.querySelector(".draft-preview__grid");
    try {
      const response = await fetch(root.dataset.endpoint, {
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load products");

      if (!payload.products.length) {
        status.textContent = "No draft products found.";
        return;
      }

      payload.products.forEach((product) => {
        const card = document.createElement("article");
        card.className = "draft-preview__card";
        if (product.featuredImage?.url) {
          const image = document.createElement("img");
          image.src = product.featuredImage.url;
          image.alt = product.featuredImage.altText || product.title;
          image.loading = "lazy";
          card.append(image);
        }
        const title = document.createElement("h3");
        title.textContent = product.title;
        card.append(title);
        const price = document.createElement("p");
        const amount = product.priceRangeV2?.minVariantPrice;
        price.textContent = amount ? formatMoney(amount.amount, amount.currencyCode, root.dataset.moneyFormat) : "Price unavailable";
        card.append(price);
        const description = document.createElement("p");
        description.textContent = product.description || "";
        card.append(description);
        grid.append(card);
      });
      status.remove();
      grid.hidden = false;
    } catch (error) {
      status.textContent = `${error.message}. Check the app proxy and app installation.`;
    }
  });
})();
