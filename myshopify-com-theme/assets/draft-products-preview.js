(() => {
  const grids = document.querySelectorAll(
    "[data-draft-preview-grid][data-draft-preview-url]",
  );
  if (!grids.length) return;

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const money = (amount, currency) => {
    const value = Number(amount);
    if (!Number.isFinite(value)) return "";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
      }).format(value);
    } catch {
      return `${currency || ""} ${value.toFixed(2)}`.trim();
    }
  };

  const productImage = (product) => product.featuredImage || product.image || null;
  const previewLink = (product) => {
    if (
      typeof product.onlineStorePreviewUrl !== "string" ||
      !/^https:\/\//i.test(product.onlineStorePreviewUrl)
    ) {
      return "";
    }

    try {
      const url = new URL(product.onlineStorePreviewUrl);
      const currentHost = window.location.hostname;
      if (
        currentHost.endsWith(".shopifypreview.com") &&
        url.hostname.endsWith(".shopifypreview.com")
      ) {
        // Keep Shopify's product preview key, but retain the current draft theme preview host.
        url.host = window.location.host;
      }
      return url.href;
    } catch {
      return "";
    }
  };

  const linked = (node, product, className) => {
    const href = previewLink(product);
    if (!href) return node;
    const link = element("a", className, undefined);
    link.href = href;
    link.setAttribute("aria-label", `Preview ${product.title}`);
    link.append(node);
    return link;
  };

  const buildPerformanceCard = (product, prefix) => {
    const card = element("article", `${prefix}__card`);
    const imageWrap = element("div", `${prefix}__image-wrap`);
    const imageData = productImage(product);
    if (imageData?.url) {
      const image = element("img", `${prefix}__image`);
      image.src = imageData.url;
      image.alt = imageData.altText || product.title;
      image.loading = "lazy";
      imageWrap.append(linked(image, product, `${prefix}__image-link`));
    } else {
      imageWrap.append(element("div", `${prefix}__placeholder`, ""));
    }
    imageWrap.append(
      element("span", `${prefix}__badge ${prefix}__badge--new`, "Draft"),
    );

    const details = element("div", `${prefix}__details`);
    const text = element("div", `${prefix}__text`);
    text.append(
      linked(
        element("span", `${prefix}__title`, product.title),
        product,
        `${prefix}__title-link`,
      ),
    );
    text.append(
      element(
        "div",
        `${prefix}__price`,
        money(
          product.priceRangeV2?.minVariantPrice?.amount,
          product.priceRangeV2?.minVariantPrice?.currencyCode,
        ),
      ),
    );
    const button = element("button", `${prefix}__cart-button`);
    button.type = "button";
    button.disabled = true;
    button.setAttribute("aria-label", `${product.title}: draft preview only`);
    button.setAttribute("aria-disabled", "true");
    button.innerHTML =
      '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 7H6"></path><circle cx="10" cy="20" r="1"></circle><circle cx="19" cy="20" r="1"></circle></svg>';
    details.append(text, button);
    card.append(imageWrap, details);
    return card;
  };

  const buildDawnCard = (product, grid, index) => {
    const style = grid.dataset.draftPreviewCardStyle || "standard";
    const color = grid.dataset.draftPreviewCardColor || "";
    const shape = grid.dataset.draftPreviewImageShape || "default";
    const ratioSetting = grid.dataset.draftPreviewImageRatio || "square";
    const imageData = productImage(product);
    const width = Number(imageData?.width);
    const height = Number(imageData?.height);
    const ratio =
      ratioSetting === "portrait"
        ? 0.8
        : ratioSetting === "adapt" && width > 0 && height > 0
          ? width / height
          : 1;
    const ratioStyle = `--ratio-percent: ${100 / ratio}%;`;
    const hasImage = Boolean(imageData?.url);
    const item = element("li", "grid__item");
    item.className = `grid__item${grid.dataset.draftPreviewSlider === "true" ? " slider__slide" : ""}`;
    if (grid.dataset.draftPreviewSlider === "true") {
      item.id = `Slide-${grid.dataset.draftPreviewSectionId}-${index + 1}`;
    }
    item.setAttribute("role", "listitem");
    item.dataset.draftProductId = product.id || String(index);

    const wrapper = element(
      "div",
      "card-wrapper product-card-wrapper underline-links-hover",
    );
    const cardClasses = [
      "card",
      `card--${style}`,
      hasImage ? "card--media" : "card--text",
      style === "card" ? `${color} gradient` : "",
      shape !== "default" ? "card--shape" : "",
      "card--extend-height",
    ]
      .filter(Boolean)
      .join(" ");
    const card = element("div", cardClasses);
    card.style.cssText = ratioStyle;

    const innerClasses = [
      "card__inner",
      style === "standard" ? `${color} gradient` : "",
      hasImage || style === "standard" ? "ratio" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const inner = element("div", innerClasses);
    inner.style.cssText = ratioStyle;

    if (hasImage) {
      const media = element(
        "div",
        `card__media${shape !== "default" ? ` shape--${shape} ${color} gradient` : ""}`,
      );
      const imageFrame = element("div", "media media--transparent media--hover-effect");
      const image = element("img", "motion-reduce");
      image.src = imageData.url;
      image.alt = imageData.altText || product.title;
      image.loading = "lazy";
      image.width = width || 533;
      image.height = height || 533;
      const href = previewLink(product);
      if (href) {
        const imageLink = linked(image, product, "draft-preview-product-link");
        imageLink.style.cssText = "position:absolute;inset:0;display:block;";
        image.style.cssText = "width:100%;height:100%;object-fit:cover;";
        imageFrame.append(imageLink);
      } else {
        imageFrame.append(image);
      }
      media.append(imageFrame);
      inner.append(media);
    }

    const innerContent = element("div", "card__content");
    const innerInfo = element("div", "card__information");
    const innerHeading = element("h3", "card__heading");
    innerHeading.append(
      linked(
        element("span", "full-unstyled-link", product.title),
        product,
        "draft-preview-title-link",
      ),
    );
    innerInfo.append(innerHeading);
    innerContent.append(innerInfo);
    const innerBadge = element("div", `card__badge ${grid.dataset.draftPreviewBadgePosition || "bottom-left"}`);
    innerBadge.append(
      element(
        "span",
        `badge badge--bottom-left ${grid.dataset.draftPreviewBadgeColor || "color-accent-1"}`,
        "Draft",
      ),
    );
    innerContent.append(innerBadge);
    inner.append(innerContent);

    const content = element("div", "card__content");
    const information = element("div", "card__information");
    const heading = element(
      "h3",
      `card__heading${hasImage || style === "standard" ? " h5" : ""}`,
    );
    heading.append(
      linked(
        element("span", "full-unstyled-link", product.title),
        product,
        "draft-preview-title-link",
      ),
    );
    information.append(heading);
    const cardInformation = element("div", "card-information");
    const price = element("div", "price");
    const priceContainer = element("div", "price__container");
    const regular = element("div", "price__regular");
    regular.append(element("span", "visually-hidden visually-hidden--inline", "Regular price"));
    regular.append(
      element(
        "span",
        "price-item price-item--regular",
        money(
          product.priceRangeV2?.minVariantPrice?.amount,
          product.priceRangeV2?.minVariantPrice?.currencyCode,
        ),
      ),
    );
    priceContainer.append(regular, element("div", "price__sale"));
    price.append(priceContainer);
    cardInformation.append(price);
    information.append(cardInformation);
    content.append(information);

    card.append(inner, content);
    wrapper.append(card);
    item.append(wrapper);
    return item;
  };

  const statusFor = (grid) => {
    let status = grid.parentElement?.querySelector("[data-draft-preview-status]");
    if (status && grid.contains(status)) grid.after(status);
    if (!status) {
      status = element(
        grid.dataset.draftPreviewKind === "performance" ? "div" : "p",
        grid.dataset.draftPreviewKind === "performance"
          ? `${grid.dataset.draftPreviewPrefix}__empty`
          : "collection__description rte",
      );
      status.dataset.draftPreviewStatus = "";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.textContent = "Loading draft products...";
      grid.after(status);
    }
    return status;
  };

  grids.forEach(async (grid) => {
    const status = statusFor(grid);
    try {
      const response = await fetch(grid.dataset.draftPreviewUrl, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Draft products could not be loaded.");
      const payload = await response.json();
      if (!Array.isArray(payload.products)) {
        throw new Error("Draft products could not be loaded.");
      }

      grid.style.visibility = "visible";
      grid.replaceChildren();
      const emptyMessage = grid.parentElement?.querySelector(
        "[data-draft-preview-empty-message]",
      );
      if (emptyMessage) emptyMessage.hidden = true;
      grid.closest(".collection--empty")?.classList.remove("collection--empty");
      grid.closest("slider-component")?.resetPages?.();

      if (!payload.products.length) {
        status.classList.remove("visually-hidden");
        status.textContent = "No draft products are assigned to this collection.";
        status.hidden = false;
        return;
      }

      status.hidden = true;
      payload.products.forEach((product, index) => {
        grid.append(
          grid.dataset.draftPreviewKind === "performance"
            ? buildPerformanceCard(product, grid.dataset.draftPreviewPrefix)
            : buildDawnCard(product, grid, index),
        );
      });
    } catch (error) {
      grid.style.visibility = "visible";
      status.classList.remove("visually-hidden");
      status.textContent =
        error instanceof Error
          ? `${error.message} Check that the app is installed and its proxy is active.`
          : "Draft products could not be loaded. Check that the app proxy is active.";
      status.hidden = false;
    }
  });
})();
