const CONFIG = {

  whatsappNumber: "556492360895",

  businessName: "Mão na Brasa",

  deliveryFee: 10,

  supabaseUrl:
    "https://wahqqziycgeqdnjwekze.supabase.co",

  supabaseKey:
    "sb_publishable_x4BRaiTbBterckrZ2t5HCQ_jw69YZUn"

};


let supabaseClient = null;


const DEFAULT_SETTINGS = {

  businessName: "Mão na Brasa",

  whatsappNumber: "556492360895",

  deliveryFee: 10,

  brandLabel: "Mão na Brasa",

  heroEyebrow:
    "Burger artesanal • brasa • sabor",

  heroTitle:
    "Churrasco.\nSabor.\nAtitude.",

  heroText:
    "Burgers artesanais feitos na brasa, porções caprichadas, bebidas geladas e combos para matar a fome de verdade.",

  heroLogo:
    "mao-na-brasa-icon-512.png",

  bannerImage:
    "maonabrasa-banner.png",

  highlight1Title:
    "Brasa de verdade",

  highlight1Text:
    "Visual forte, sabor marcante e uma experiência feita para quem gosta de lanche com presença.",

  highlight2Title:
    "Pedido rápido",

  highlight2Text:
    "Escolha os itens, confira o total e envie tudo pronto direto para o WhatsApp.",

  highlight3Title:
    "Cardápio editável",

  highlight3Text:
    "Produtos, categorias, fotos e disponibilidade continuam sendo atualizados pelo painel admin.",

  aboutEyebrow:
    "Sobre nós",

  aboutTitle:
    "Não é só lanche. É experiência.",

  aboutText:
    "O Mão na Brasa nasceu para entregar burgers com presença: pão macio, carne bem preparada, queijo derretendo e aquele aroma de brasa que abre o apetite antes da primeira mordida.",

  aboutLine1:
    "Atendimento de segunda a sábado",

  aboutLine2:
    "Combos, burgers, porções, sobremesas e bebidas",

  aboutLine3:
    "Pedido enviado direto para o WhatsApp",

  contactEyebrow:
    "Peça agora",

  contactTitle:
    "Bateu a fome?",

  contactText:
    "Monte seu pedido no site e envie direto no WhatsApp do Mão na Brasa."

};


const FALLBACK_PRODUCTS = [

  {
    id: "fallback-brasa",
    name: "Brasa Burger",
    category: "Burgers",
    tag: "Na brasa",
    description:
      "Burger artesanal com carne na brasa, queijo derretido e molho da casa.",
    price: 24.90,
    image: "brasa.jpg",
    imageFit: "cover",
    imagePosition: "center",
    hasAddons: true
  },

  {
    id: "fallback-duplo",
    name: "Cheese Burger Duplo",
    category: "Burgers",
    tag: "Chef",
    description:
      "Duas carnes, queijo em dobro e pão macio tostado.",
    price: 32.90,
    image: "Cheese Burger Duplo.jpg",
    imageFit: "cover",
    imagePosition: "center",
    hasAddons: true
  },

  {
    id: "fallback-batata",
    name: "Batata 500g",
    category: "Porções",
    tag: "Para dividir",
    description:
      "Batata crocante em porção generosa para acompanhar o pedido.",
    price: 22,
    image: "batata500.jpg",
    imageFit: "cover",
    imagePosition: "center",
    hasAddons: false
  },

  {
    id: "fallback-brownie",
    name: "Brownie com Sorvete",
    category: "Sobremesas",
    tag: "Doce",
    description:
      "Brownie quentinho servido com sorvete.",
    price: 18,
    image: "Brawnie com Sorvete.jpg",
    imageFit: "cover",
    imagePosition: "center",
    hasAddons: false
  },

  {
    id: "fallback-coca",
    name: "Coca-Cola 350ml",
    category: "Bebidas",
    tag: "Gelada",
    description:
      "Refrigerante lata gelado.",
    price: 6,
    image: "coca350.jpg",
    imageFit: "contain",
    imagePosition: "center",
    hasAddons: false
  }

];


const FALLBACK_ADDONS = [

  {
    id: "addon-bacon",
    name: "Bacon",
    price: 5
  },

  {
    id: "addon-cheddar",
    name: "Cheddar",
    price: 4
  },

  {
    id: "addon-carne",
    name: "Carne extra",
    price: 9
  }

];


let siteSettings = {
  ...DEFAULT_SETTINGS
};

let products = [];

let addons = [];

let activeCategory = "Todos";

let cart = readCart();

let currentAddonProduct = null;

let deferredInstallPrompt = null;

let toastTimer = null;


/* ============================================================
   HELPERS
============================================================ */

const money = value =>
  Number(value || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );


const $ = selector =>
  document.querySelector(selector);


const normalize = value =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();


const withTimeout = (
  promise,
  fallback,
  delay = 4500
) =>
  Promise.race([
    promise,
    new Promise(resolve =>
      setTimeout(
        () => resolve(fallback),
        delay
      )
    )
  ]);


/* ============================================================
   SUPABASE
============================================================ */

function initSupabase() {

  try {

    if (!window.supabase) {

      console.error(
        "Supabase JS não foi carregado."
      );

      return false;
    }

    supabaseClient =
      window.supabase.createClient(
        CONFIG.supabaseUrl,
        CONFIG.supabaseKey
      );

    console.log(
      "🔥 Supabase conectado."
    );

    return true;

  } catch (error) {

    console.error(
      "Erro ao iniciar Supabase:",
      error
    );

    return false;
  }

}


/* ============================================================
   INIT
============================================================ */

async function init() {

  setupEvents();

  setupReveal();

  setupPWAInstall();

  showTutorialOnce();

  toggleAddress();

  if ($("#year")) {

    $("#year").textContent =
      new Date().getFullYear();

  }

  initSupabase();

  await Promise.allSettled([

    loadSettings(),

    loadAddons(),

    loadProducts()

  ]);

  if ("serviceWorker" in navigator) {

    navigator.serviceWorker
      .register("sw.js")
      .catch(() => {});

  }

}


/* ============================================================
   SETTINGS
============================================================ */

async function loadSettings() {

  if (!supabaseClient) {

    applySettings();

    setupLinks();

    renderCart();

    return;
  }

  const {
    data,
    error,
    timedOut
  } = await withTimeout(

    supabaseClient
      .from("mnb_site_settings")
      .select("settings")
      .eq("id", "main")
      .maybeSingle(),

    {
      data: null,
      error: null,
      timedOut: true
    }

  );

  if (!error && data?.settings) {

    siteSettings = {
      ...DEFAULT_SETTINGS,
      ...data.settings
    };

  }

  CONFIG.businessName =
    siteSettings.businessName ||
    DEFAULT_SETTINGS.businessName;

  CONFIG.whatsappNumber =
    siteSettings.whatsappNumber ||
    DEFAULT_SETTINGS.whatsappNumber;

  CONFIG.deliveryFee =
    Number(
      siteSettings.deliveryFee ??
      DEFAULT_SETTINGS.deliveryFee
    );

  applySettings();

  setupLinks();

  renderCart();

  if (timedOut) {

    showToast(
      "Configurações online demoraram."
    );

  }

}


function applySettings() {

  setText(
    "heroEyebrow",
    siteSettings.heroEyebrow
  );

  setHeroTitle(
    siteSettings.heroTitle
  );

  setText(
    "heroText",
    siteSettings.heroText
  );

  setText(
    "highlight1Title",
    siteSettings.highlight1Title
  );

  setText(
    "highlight1Text",
    siteSettings.highlight1Text
  );

  setText(
    "highlight2Title",
    siteSettings.highlight2Title
  );

  setText(
    "highlight2Text",
    siteSettings.highlight2Text
  );

  setText(
    "highlight3Title",
    siteSettings.highlight3Title
  );

  setText(
    "highlight3Text",
    siteSettings.highlight3Text
  );

  setText(
    "aboutEyebrow",
    siteSettings.aboutEyebrow
  );

  setText(
    "aboutTitle",
    siteSettings.aboutTitle
  );

  setText(
    "aboutText",
    siteSettings.aboutText
  );

  setText(
    "aboutLine1",
    siteSettings.aboutLine1
  );

  setText(
    "aboutLine2",
    siteSettings.aboutLine2
  );

  setText(
    "aboutLine3",
    siteSettings.aboutLine3
  );

  setText(
    "contactEyebrow",
    siteSettings.contactEyebrow
  );

  setText(
    "contactTitle",
    siteSettings.contactTitle
  );

  setText(
    "contactText",
    siteSettings.contactText
  );

  setText(
    "footerBrand",
    siteSettings.brandLabel ||
    siteSettings.businessName
  );


  const brandLabel =
    $("#brandLabel");

  if (brandLabel) {

    brandLabel.innerHTML =
      escapeHtml(
        siteSettings.brandLabel ||
        siteSettings.businessName
      )
      .replace(
        /\bBrasa\b/i,
        "<strong>Brasa</strong>"
      );

  }


  setImage(
    "brandLogo",
    siteSettings.heroLogo
  );

  setImage(
    "heroLogo",
    siteSettings.heroLogo
  );

  setImage(
    "aboutLogo",
    siteSettings.heroLogo
  );

  setImage(
    "bannerImage",
    siteSettings.bannerImage
  );

}


function setText(id, value) {

  const el =
    document.getElementById(id);

  if (el) {

    el.textContent =
      value || "";

  }

}


function setImage(id, value) {

  const el =
    document.getElementById(id);

  if (el && value) {

    el.src = value;

  }

}


function setHeroTitle(value) {

  const el =
    $("#heroTitle");

  if (!el) return;

  const lines =
    String(value || "")
      .split(/\n+/)
      .filter(Boolean);

  el.innerHTML =
    lines
      .map(
        (line, index) =>
          index === 1
            ? `<span>${escapeHtml(line)}</span>`
            : escapeHtml(line)
      )
      .join("<br>");

}


/* ============================================================
   LINKS
============================================================ */

function setupLinks() {

  const text =
    encodeURIComponent(
      `Olá! Vim pelo site do ${CONFIG.businessName} e quero fazer um pedido.`
    );

  const link =
    `https://wa.me/${CONFIG.whatsappNumber}?text=${text}`;

  if ($("#heroWhatsapp")) {

    $("#heroWhatsapp").href =
      link;

  }

  if ($("#contactWhatsapp")) {

    $("#contactWhatsapp").href =
      link;

  }

}


/* ============================================================
   EVENTS
============================================================ */

function setupEvents() {

  const menuToggle =
    $("#menuToggle");

  if (menuToggle) {

    menuToggle.addEventListener(
      "click",
      () => {

        const nav =
          $("#navMenu");

        const isOpen =
          nav.classList.toggle("open");

        menuToggle.setAttribute(
          "aria-expanded",
          isOpen
        );

      }
    );

  }


  document
    .querySelectorAll(".nav a")
    .forEach(link => {

      link.addEventListener(
        "click",
        () => {

          $("#navMenu")
            ?.classList
            .remove("open");

        }
      );

    });


  $("#openCart")
    ?.addEventListener(
      "click",
      openCart
    );


  $("#closeCart")
    ?.addEventListener(
      "click",
      closeCart
    );


  $("#checkoutBtn")
    ?.addEventListener(
      "click",
      checkout
    );


  $("#searchInput")
    ?.addEventListener(
      "input",
      renderProducts
    );


  $("#orderType")
    ?.addEventListener(
      "change",
      () => {

        toggleAddress();

        renderCart();

      }
    );


  $("#tutorialOpen")
    ?.addEventListener(
      "click",
      () =>
        $("#tutorialModal")
          ?.showModal()
    );


  $("#closeTutorial")
    ?.addEventListener(
      "click",
      () =>
        $("#tutorialModal")
          ?.close()
    );


  $("#finishTutorial")
    ?.addEventListener(
      "click",
      finishTutorial
    );


  $("#closeAddonModal")
    ?.addEventListener(
      "click",
      () =>
        $("#addonModal")
          ?.close()
    );


  $("#confirmAddonBtn")
    ?.addEventListener(
      "click",
      confirmAddonProduct
    );


  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        if (typeof currentPreviewProduct !== "undefined" && currentPreviewProduct) {
          closeProductPreview();
          return;
        }

        closeCart();

      }

    }
  );

}


/* ============================================================
   PRODUCTS
============================================================ */

async function loadProducts() {

  if (!supabaseClient) {

    useFallbackProducts();

    return;

  }

  const {
    data,
    error,
    timedOut
  } = await withTimeout(

    supabaseClient
      .from("mnb_products")
      .select("*")
      .eq("available", true)
      .order(
        "sort_order",
        {
          ascending: true
        }
      ),

    {
      data: null,
      error: null,
      timedOut: true
    }

  );

  if (
    error ||
    !data?.length
  ) {

    useFallbackProducts();

    if (error || timedOut) {

      showToast(
        "Cardápio online indisponível."
      );

    }

    return;

  }


  products =
    data.map(product => ({

      id:
        product.id,

      name:
        product.name,

      category:
        product.category ||
        "Outros",

      tag:
        product.tag ||
        "Na brasa",

      description:
        product.description ||
        "",

      price:
        Number(product.price || 0),

      image:
        product.image ||
        "",

      imageFit:
        product.image_fit ||
        "contain",

      imagePosition:
        product.image_position ||
        "center",

      hasAddons:
        Boolean(product.has_addons)

    }));


  normalizeCart();

  renderCategories();

  renderProducts();

  renderCart();

}


async function loadAddons() {

  if (!supabaseClient) {

    addons =
      [...FALLBACK_ADDONS];

    return;

  }

  const {
    data,
    error
  } = await withTimeout(

    supabaseClient
      .from("mnb_addons")
      .select("*")
      .eq("available", true)
      .order(
        "sort_order",
        {
          ascending: true
        }
      ),

    {
      data: null,
      error: null
    }

  );

  addons =
    !error && data?.length

      ? data.map(addon => ({

          id:
            addon.id,

          name:
            addon.name,

          price:
            Number(addon.price || 0)

        }))

      : [...FALLBACK_ADDONS];

}


function useFallbackProducts() {

  products =
    [...FALLBACK_PRODUCTS];

  normalizeCart();

  renderCategories();

  renderProducts();

  renderCart();

}


/* ============================================================
   CATEGORIES
============================================================ */

function renderCategories() {

  const categories = [

    "Todos",

    ...new Set(
      products
        .map(product =>
          product.category
        )
        .filter(Boolean)
    )

  ];


  $("#categoryTabs").innerHTML =

    categories
      .map(
        category => `

          <button
            class="tab-btn ${
              category === activeCategory
                ? "active"
                : ""
            }"
            type="button"
            data-category="${escapeAttr(category)}">

            ${escapeHtml(category)}

          </button>

        `
      )
      .join("");


  document
    .querySelectorAll(".tab-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          activeCategory =
            button.dataset.category;

          renderCategories();

          renderProducts();

        }
      );

    });

}


/* ============================================================
   RENDER PRODUCTS
============================================================ */

function renderProducts() {

  const search =
    normalize(
      $("#searchInput")
        ?.value
        ?.trim() || ""
    );


  const list =
    products.filter(product => {

      const matchesCategory =
        activeCategory === "Todos" ||
        product.category ===
          activeCategory;


      const searchable =
        normalize(
          `${product.name}
           ${product.category}
           ${product.tag}
           ${product.description}`
        );


      return (
        matchesCategory &&
        searchable.includes(search)
      );

    });


  $("#menuGrid").innerHTML =

    list.length

      ? list.map(product => `

          <article class="product-card reveal show" data-product-id="${escapeAttr(product.id)}" tabindex="0" role="button" aria-label="Ver detalhes de ${escapeAttr(product.name)}">

            ${
              product.image
                ? `
                  <img
                    class="product-image"
                    src="${escapeAttr(product.image)}"
                    alt="${escapeAttr(product.name)}"
                    loading="lazy"
                    style="
                      object-fit:${escapeAttr(product.imageFit)};
                      object-position:${escapeAttr(product.imagePosition)};
                    "
                  >
                `
                : ""
            }

            <span class="product-tag">
              ${escapeHtml(
                labelTag(product.tag)
              )}
            </span>

            <h3>
              ${escapeHtml(product.name)}
            </h3>

            <p>
              ${escapeHtml(product.description)}
            </p>

            <div class="product-bottom">

              <strong class="price">
                ${money(product.price)}
              </strong>

              <button
                class="add-btn"
                type="button"
                data-id="${escapeAttr(product.id)}">

                Adicionar

              </button>

            </div>

          </article>

        `).join("")

      : `
        <p class="empty menu-empty">
          Nenhum item encontrado.
        </p>
      `;


  document
    .querySelectorAll(".product-card")
    .forEach(card => {
      const open = () => openProductPreview(card.dataset.productId);

      card.addEventListener("click", event => {
        if (event.target.closest(".add-btn")) return;
        open();
      });

      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });

  document
    .querySelectorAll(".add-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          addToCart(
            button.dataset.id
          )
      );

    });

}


/* ============================================================
   PRODUCT PREVIEW
============================================================ */

let currentPreviewProduct = null;

function openProductPreview(id) {
  const product = products.find(item => String(item.id) === String(id));
  if (!product) return;

  currentPreviewProduct = product;

  const preview = $("#productPreview");
  const image = $("#productPreviewImage");

  image.src = product.image || "mao-na-brasa-icon-512.png";
  image.alt = product.name || "Produto";
  image.style.objectFit = product.imageFit || "cover";
  image.style.objectPosition = product.imagePosition || "center";

  $("#productPreviewTag").textContent = labelTag(product.tag);
  $("#productPreviewName").textContent = product.name || "Produto";
  $("#productPreviewDescription").textContent = product.description || "Delicioso e preparado na brasa.";
  $("#productPreviewPrice").textContent = money(product.price);

  preview.classList.add("open");
  preview.setAttribute("aria-hidden", "false");
  document.body.classList.add("preview-open");

  setTimeout(() => $("#closeProductPreview")?.focus(), 0);
}

function closeProductPreview() {
  const preview = $("#productPreview");
  if (!preview) return;

  preview.classList.remove("open");
  preview.setAttribute("aria-hidden", "true");
  document.body.classList.remove("preview-open");
  currentPreviewProduct = null;
}

$("#closeProductPreview")?.addEventListener("click", closeProductPreview);

$("#productPreview")?.addEventListener("click", event => {
  if (event.target === event.currentTarget) closeProductPreview();
});

$("#productPreviewAdd")?.addEventListener("click", () => {
  const product = currentPreviewProduct;
  if (!product) return;

  closeProductPreview();

  if (product.hasAddons && addons.length) {
    openAddonModal(product);
  } else {
    addCartLine(product, [], "");
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && currentPreviewProduct) {
    closeProductPreview();
  }
});


/* ============================================================
   CART
============================================================ */

function addToCart(id) {

  const product =
    products.find(
      item =>
        String(item.id) ===
        String(id)
    );

  if (!product) return;


  if (
    product.hasAddons &&
    addons.length
  ) {

    openAddonModal(product);

    return;

  }


  addCartLine(
    product,
    [],
    ""
  );

}


function openAddonModal(product) {

  currentAddonProduct =
    product;

  $("#addonProductName")
    .textContent =
    product.name;

  $("#itemNote")
    .value = "";


  $("#addonList").innerHTML =

    addons.map(
      addon => `

        <label class="addon-row">

          <span>
            ${escapeHtml(addon.name)}
          </span>

          <small>
            ${money(addon.price)}
          </small>

          <input
            type="checkbox"
            value="${escapeAttr(addon.id)}">

        </label>

      `
    ).join("");


  $("#addonModal")
    .showModal();

}


function confirmAddonProduct() {

  if (!currentAddonProduct)
    return;


  const selected =
    [
      ...document
        .querySelectorAll(
          "#addonList input:checked"
        )
    ]
      .map(input =>
        addons.find(
          addon =>
            String(addon.id) ===
            String(input.value)
        )
      )
      .filter(Boolean);


  addCartLine(
    currentAddonProduct,
    selected,
    $("#itemNote")
      .value
      .trim()
  );


  $("#addonModal")
    .close();

}


function addCartLine(
  product,
  selectedAddons,
  note
) {

  const addonsTotal =
    selectedAddons.reduce(
      (sum, addon) =>
        sum +
        Number(addon.price || 0),
      0
    );


  const lineKey =
    JSON.stringify({

      id:
        product.id,

      addons:
        selectedAddons
          .map(addon =>
            addon.id
          )
          .sort(),

      note

    });


  const existing =
    cart.find(
      item =>
        item.lineKey ===
        lineKey
    );


  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({

      ...product,

      lineId:
        `${product.id}-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`,

      lineKey,

      addons:
        selectedAddons,

      note,

      unitTotal:
        product.price +
        addonsTotal,

      quantity: 1

    });

  }


  saveCart();

  renderCart();

  openCart();

  showToast(
    `${product.name} foi adicionado.`
  );

}


function changeQty(
  lineId,
  amount
) {

  cart =
    cart
      .map(item =>

        String(
          item.lineId ||
          item.id
        ) ===
        String(lineId)

          ? {
              ...item,
              quantity:
                item.quantity +
                amount
            }

          : item

      )
      .filter(
        item =>
          item.quantity > 0
      );


  saveCart();

  renderCart();

}


function removeCartItem(lineId) {

  cart =
    cart.filter(
      item =>
        String(
          item.lineId ||
          item.id
        ) !==
        String(lineId)
    );


  saveCart();

  renderCart();

  showToast(
    "Item removido."
  );

}


function readCart() {

  try {

    return (
      JSON.parse(
        localStorage.getItem(
          "maoNaBrasaCart"
        )
      ) || []
    );

  } catch {

    return [];

  }

}


function saveCart() {

  localStorage.setItem(
    "maoNaBrasaCart",
    JSON.stringify(cart)
  );

}


function normalizeCart() {

  cart =
    cart

      .filter(item =>
        products.some(
          product =>
            String(product.id) ===
            String(item.id)
        )
      )

      .map(item => ({

        ...item,

        lineId:
          item.lineId ||
          `${item.id}-${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`,

        lineKey:
          item.lineKey ||
          JSON.stringify({
            id: item.id,
            addons:
              item.addons || [],
            note:
              item.note || ""
          }),

        addons:
          item.addons || [],

        note:
          item.note || "",

        unitTotal:
          Number(
            item.unitTotal ||
            item.price ||
            0
          ),

        quantity:
          Number(
            item.quantity || 1
          )

      }));


  saveCart();

}


function renderCart() {

  const cartItems =
    $("#cartItems");


  if (!cart.length) {

    cartItems.innerHTML =
      `<p class="empty">
        Seu pedido ainda está vazio.
      </p>`;

  } else {

    cartItems.innerHTML =

      cart.map(
        (item, index) => {

          const unitTotal =
            Number(
              item.unitTotal ||
              item.price
            );

          const lineTotal =
            unitTotal *
            item.quantity;

          const lineId =
            item.lineId ||
            item.id;


          return `

            <div class="cart-item">

              <div class="cart-item-main">

                <div class="cart-item-title">

                  <h4>
                    ${index + 1}.
                    ${escapeHtml(item.name)}
                  </h4>

                  <em>
                    ${item.quantity}x
                  </em>

                </div>

                <small>
                  ${money(unitTotal)}
                  cada
                </small>

                ${
                  item.addons?.length

                    ? `
                      <div class="cart-addons">

                        <strong>
                          Adicionais:
                        </strong>

                        ${
                          item.addons
                            .map(
                              addon => `
                                <span>
                                  +
                                  ${escapeHtml(addon.name)}
                                  (${money(addon.price)})
                                </span>
                              `
                            )
                            .join("")
                        }

                      </div>
                    `

                    : ""
                }

                ${
                  item.note

                    ? `
                      <small class="cart-note">
                        Obs:
                        ${escapeHtml(item.note)}
                      </small>
                    `

                    : ""
                }

                <strong class="cart-line-total">
                  Total:
                  ${money(lineTotal)}
                </strong>

              </div>


              <div class="qty">

                <button
                  type="button"
                  onclick="changeQty('${escapeAttr(lineId)}', -1)">
                  -
                </button>

                <strong>
                  ${item.quantity}
                </strong>

                <button
                  type="button"
                  onclick="changeQty('${escapeAttr(lineId)}', 1)">
                  +
                </button>

                <button
                  type="button"
                  onclick="removeCartItem('${escapeAttr(lineId)}')">
                  ×
                </button>

              </div>

            </div>

          `;

        }
      ).join("");

  }


  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.unitTotal ||
          item.price
        ) *
        item.quantity,
      0
    );


  const isDelivery =
    $("#orderType")
      ?.value !== "retirada";


  const deliveryFee =
    isDelivery &&
    cart.length
      ? CONFIG.deliveryFee
      : 0;


  const total =
    subtotal +
    deliveryFee;


  const count =
    cart.reduce(
      (sum, item) =>
        sum +
        item.quantity,
      0
    );


  $("#cartSubtotal")
    .textContent =
    money(subtotal);

  $("#cartDeliveryFee")
    .textContent =
    isDelivery
      ? money(deliveryFee)
      : "Retirada";

  $("#cartTotal")
    .textContent =
    money(total);

  $("#cartCount")
    .textContent =
    count;

  $("#checkoutBtn")
    .classList.toggle(
      "is-disabled",
      !cart.length
    );

}


/* ============================================================
   CHECKOUT
============================================================ */

async function checkout(event) {

  event.preventDefault();


  if (!cart.length) {

    alert(
      "Adicione pelo menos um item ao pedido."
    );

    return;

  }


  const name =
    $("#customerName")
      .value
      .trim();


  if (!name) {

    alert(
      "Informe seu nome."
    );

    $("#customerName")
      .focus();

    return;

  }


  const type =
    $("#orderType").value;


  const address =
    $("#customerAddress")
      .value
      .trim();


  if (
    type === "entrega" &&
    !address
  ) {

    alert(
      "Informe o endereço."
    );

    $("#customerAddress")
      .focus();

    return;

  }


  const payment =
    $("#paymentMethod")
      .value;


  const note =
    $("#customerNote")
      .value
      .trim();


  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.unitTotal ||
          item.price
        ) *
        item.quantity,
      0
    );


  const deliveryFee =
    type === "entrega"
      ? CONFIG.deliveryFee
      : 0;


  const total =
    subtotal +
    deliveryFee;


  const protocol =
    `MNB-${Date.now()
      .toString()
      .slice(-6)}`;


  const lines =
    cart
      .map(item => {

        const addonsText =
          item.addons?.length

            ? `\n   Adicionais: ${
                item.addons
                  .map(
                    addon =>
                      addon.name
                  )
                  .join(", ")
              }`

            : "";


        const itemNoteText =
          item.note

            ? `\n   Obs: ${item.note}`

            : "";


        const lineTotal =
          money(
            Number(
              item.unitTotal ||
              item.price
            ) *
            item.quantity
          );


        return `
- ${item.quantity}x ${item.name}
${addonsText}
${itemNoteText}
   Total: ${lineTotal}
`;

      })
      .join("\n");


  let message =
    `*${CONFIG.businessName}*\n`;

  message +=
    `Pedido na brasa chegando!\n`;

  message +=
    `--------------------------------\n`;

  message +=
    `*Protocolo:* ${protocol}\n`;

  message +=
    `*Cliente:* ${name}\n`;

  message +=
    `*Tipo:* ${
      type === "entrega"
        ? "Entrega"
        : "Retirada"
    }\n`;

  if (type === "entrega") {

    message +=
      `*Endereço:* ${address}\n`;

  }

  message +=
    `*Pagamento:* ${payment}\n\n`;

  message +=
    `*Itens:*\n${lines}\n`;

  message +=
    `*Subtotal:* ${money(subtotal)}\n`;

  if (type === "entrega") {

    message +=
      `*Entrega:* ${money(deliveryFee)}\n`;

  }

  if (note) {

    message +=
      `*Observação:* ${note}\n`;

  }

  message +=
    `*TOTAL:* ${money(total)}\n`;

  message +=
    `--------------------------------\n`;

  message +=
    `Pode preparar que a fome chegou.`;



  const whatsappUrl =
    `https://wa.me/${CONFIG.whatsappNumber}?text=${
      encodeURIComponent(message)
    }`;


  const checkoutBtn =
    event.currentTarget;


  checkoutBtn.textContent =
    "Abrindo WhatsApp...";


  await saveOrder({

    protocol,

    name,

    type,

    address,

    payment,

    note,

    subtotal,

    deliveryFee,

    total

  });


  const opened =
    window.open(
      whatsappUrl,
      "_blank",
      "noopener"
    );


  if (!opened) {

    window.location.href =
      whatsappUrl;

  }


  setTimeout(
    () => {

      checkoutBtn.textContent =
        "Enviar pedido";

    },
    1200
  );

}


/* ============================================================
   SAVE ORDER
============================================================ */

async function saveOrder({

  protocol,

  name,

  type,

  address,

  payment,

  note,

  subtotal,

  deliveryFee,

  total

}) {

  if (!supabaseClient)
    return;


  try {

    const {

      data: order,

      error: orderError

    } = await supabaseClient

      .from("mnb_orders")

      .insert({

        protocol,

        customer_name:
          name,

        order_type:
          type,

        address:
          type === "entrega"
            ? address
            : null,

        payment_method:
          payment,

        customer_note:
          note,

        subtotal,

        delivery_fee:
          deliveryFee,

        total,

        status:
          "novo",

        whatsapp_sent:
          true

      })

      .select()

      .single();


    if (orderError) {

      console.error(
        "Erro ao salvar pedido:",
        orderError
      );

      return;

    }


    const orderItems =
      cart.map(item => {

        const addonsTotal =
          (item.addons || [])
            .reduce(
              (sum, addon) =>
                sum +
                Number(
                  addon.price || 0
                ),
              0
            );


        const unitPrice =
          Number(
            item.price || 0
          );


        const unitTotal =
          Number(
            item.unitTotal ||
            unitPrice +
            addonsTotal
          );


        return {

          order_id:
            order.id,

          product_id:
            isValidUUID(item.id)
              ? item.id
              : null,

          product_name:
            item.name,

          quantity:
            Number(
              item.quantity || 1
            ),

          unit_price:
            unitPrice,

          addons:
            item.addons || [],

          note:
            item.note || "",

          total:
            unitTotal *
            Number(
              item.quantity || 1
            )

        };

      });


    if (orderItems.length) {

      const {
        error: itemsError
      } =
        await supabaseClient
          .from("mnb_order_items")
          .insert(orderItems);


      if (itemsError) {

        console.error(
          "Itens não foram salvos:",
          itemsError
        );

      }

    }


    console.log(
      "Pedido salvo:",
      protocol
    );


  } catch (error) {

    console.error(
      "Erro inesperado:",
      error
    );

  }

}


function isValidUUID(value) {

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(
      String(value)
    );

}


/* ============================================================
   CART UI
============================================================ */

function openCart() {

  const cartPanel =
    $("#cartPanel");

  if (!cartPanel) return;

  // Fecha a visualização do produto antes de abrir o carrinho.
  if (typeof closeProductPreview === "function") {
    closeProductPreview();
  }

  cartPanel.classList.add("open");
  cartPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");

}


function closeCart() {

  const cartPanel =
    $("#cartPanel");

  if (!cartPanel) return;

  cartPanel.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");

}


function toggleAddress() {

  if (!$("#addressField"))
    return;

  $("#addressField")
    .style
    .display =
    $("#orderType").value ===
    "entrega"
      ? "grid"
      : "none";

}


/* ============================================================
   ANIMATIONS
============================================================ */

function setupReveal() {

  if (
    !("IntersectionObserver" in window)
  )
    return;


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              entry.target
                .classList
                .add("show");

            }

          }
        );

      },
      {
        threshold: 0.14
      }
    );


  document
    .querySelectorAll(".reveal")
    .forEach(item =>
      observer.observe(item)
    );

}


/* ============================================================
   PWA
============================================================ */

function setupPWAInstall() {

  const installBtn =
    $("#installBtn");

  if (!installBtn)
    return;


  window.addEventListener(
    "beforeinstallprompt",
    event => {

      event.preventDefault();

      deferredInstallPrompt =
        event;

      installBtn.hidden =
        false;

    }
  );


  installBtn.addEventListener(
    "click",
    async () => {

      if (!deferredInstallPrompt)
        return;

      deferredInstallPrompt
        .prompt();

      await deferredInstallPrompt
        .userChoice;

      deferredInstallPrompt =
        null;

      installBtn.hidden =
        true;

    }
  );

}


/* ============================================================
   TUTORIAL
============================================================ */

function showTutorialOnce() {

  if (
    localStorage.getItem(
      "mnb_tutorial_seen"
    ) === "yes"
  )
    return;


  $("#tutorialOpen")
    ?.classList
    .add("has-hint");

}


function finishTutorial() {

  localStorage.setItem(
    "mnb_tutorial_seen",
    "yes"
  );


  $("#tutorialOpen")
    ?.classList
    .remove("has-hint");


  $("#tutorialModal")
    ?.close();

}


/* ============================================================
   TOAST
============================================================ */

function showToast(message) {

  const toast =
    $("#toast");

  if (!toast)
    return;


  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () =>
        toast.classList.remove(
          "show"
        ),
      2400
    );

}


/* ============================================================
   LABELS
============================================================ */

function labelTag(tag) {

  if (
    String(tag).toLowerCase() ===
    "vendido"
  )
    return "Famoso";


  if (
    String(tag).toLowerCase() ===
    "chef"
  )
    return "Chef";


  return (
    tag ||
    "Na brasa"
  );

}


/* ============================================================
   ESCAPE
============================================================ */

function escapeHtml(value) {

  return String(
    value ?? ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


function escapeAttr(value) {

  return escapeHtml(value)
    .replace(
      /`/g,
      "&#096;"
    );

}


/* ============================================================
   GLOBAL
============================================================ */

window.changeQty =
  changeQty;

window.removeCartItem =
  removeCartItem;


init();