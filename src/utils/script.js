// Image Gallery
function changeImage(src, element) {
    // Change main image
    document.getElementById('mainImage').src = src;
    
    // Update active class on thumbnails
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    element.classList.add('active');
}

// Quantity Selector
function changeQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    let currentValue = parseInt(quantityInput.value);
    
    let newValue = currentValue + change;
    if (newValue < 1) newValue = 1; // Minimum quantity is 1
    
    quantityInput.value = newValue;
}

// Add to Cart
function addToCart() {
    const cartCount = document.querySelector('.cart-count');
    const quantity = parseInt(document.getElementById('quantity').value);
    let currentCount = parseInt(cartCount.innerText);
    
    cartCount.innerText = currentCount + quantity;
    
    // Optional: Show a subtle feedback animation or toast
    const btn = document.querySelector('.btn-add-cart');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> ĐÃ THÊM';
    btn.style.backgroundColor = '#d4edda';
    btn.style.color = '#155724';
    btn.style.borderColor = '#c3e6cb';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style = ''; // Reset inline styles
    }, 2000);
}

// Tabs
function openTab(evt, tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });

    // Show the current tab and add active class to the button
    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
}

window.onload = function () {
    fetchProductData();
    fetchProductsList();
    setupSideMenu();
    setupAuthOverlay();
    setupCartOverlay();
    setupSearchOverlay();
};

// ── Auth Overlay ──────────────────────────────────
function setupAuthOverlay() {
    const userBtn = document.getElementById('user-icon-btn');
    const overlay = document.getElementById('authOverlay');
    const closeBtn = document.getElementById('authCloseBtn');
    const backdrop = document.getElementById('authBackdrop');
    if (!userBtn || !overlay) return;

    userBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthOverlay();
    });
    closeBtn && closeBtn.addEventListener('click', closeAuthOverlay);
    backdrop && backdrop.addEventListener('click', closeAuthOverlay);

    // ESC key closes overlay
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeAuthOverlay(); closeCartOverlay(); }
    });
}

function openAuthOverlay() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) { overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeAuthOverlay() {
    const overlay = document.getElementById('authOverlay');
    if (overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }
}

function switchAuthTab(tab) {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    if (!tabLogin) return;

    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.style.display = 'flex';
        formRegister.style.display = 'none';
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formRegister.style.display = 'flex';
        formLogin.style.display = 'none';
    }
}

// ── Cart Overlay ──────────────────────────────────
function setupCartOverlay() {
    const cartBtn = document.getElementById('cart-icon-btn');
    const overlay = document.getElementById('cartOverlay');
    const closeBtn = document.getElementById('cartCloseBtn');
    const backdrop = document.getElementById('cartBackdrop');
    if (!cartBtn || !overlay) return;

    cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartOverlay();
    });
    closeBtn && closeBtn.addEventListener('click', closeCartOverlay);
    backdrop && backdrop.addEventListener('click', closeCartOverlay);
}

function openCartOverlay() {
    const overlay = document.getElementById('cartOverlay');
    if (overlay) { overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeCartOverlay() {
    const overlay = document.getElementById('cartOverlay');
    if (overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }
}

// Side Menu and Header Logic
function setupSideMenu() {
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const closeMenuBtn = document.querySelector('.close-menu-btn');
    const sideMenuPanel = document.querySelector('.side-menu-panel');
    const sideMenuOverlay = document.querySelector('.side-menu-overlay');

    if (hamburgerBtn && closeMenuBtn && sideMenuPanel && sideMenuOverlay) {
        hamburgerBtn.addEventListener('click', () => {
            sideMenuPanel.classList.add('active');
            sideMenuOverlay.classList.add('active');
        });

        const closeMenu = () => {
            sideMenuPanel.classList.remove('active');
            sideMenuOverlay.classList.remove('active');
        };

        closeMenuBtn.addEventListener('click', closeMenu);
        sideMenuOverlay.addEventListener('click', closeMenu);
    }

    // Header scroll effect
    const headerWrapper = document.querySelector('.ox-header-wrapper');
    if (headerWrapper) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                headerWrapper.classList.add('scrolled');
            } else {
                headerWrapper.classList.remove('scrolled');
            }
        });
    }
}

// --- Homepage API Integration ---
async function fetchProductsList() {
    const gridEl = document.getElementById('api-products-grid');
    if (!gridEl) return; // Not on the homepage

    try {
        const response = await fetch('https://produce-slang-obsessive.ngrok-free.dev/api/products', {
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();

        // Format currency helper
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
        };

        gridEl.innerHTML = ''; // Clear loading spinner

        products.forEach(product => {
            // Find base price (assume first variant)
            let basePrice = "0";
            if (product.product_variants && product.product_variants.length > 0) {
                basePrice = product.product_variants[0].price;
            }

            // Image fallback
            const imageUrl = (product.product_images && product.product_images.length > 0) 
                            ? 'src/assets/images/main.png' // Fallback to local image since API just returns 'image1.jpg' without host
                            : 'src/assets/images/dummy1.png';

            const cardHtml = `
                <a href="src/views/Product/product.html?id=${product.id}" class="product-card normal-card">
                    <div class="card-img">
                        <img src="${imageUrl}" alt="${product.name}">
                        <div class="discount">-15%</div>
                    </div>
                    <div class="card-info">
                        <h3 class="card-title">${product.name}</h3>
                        <div class="card-price">
                            <span class="current">${formatCurrency(basePrice)}</span>
                        </div>
                        <div class="rating-mini">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            <span>(mới)</span>
                        </div>
                    </div>
                    <div class="card-hover-action" onclick="event.preventDefault(); addToCart()">
                        <i class="fas fa-cart-plus"></i> &nbsp; Thêm vào giỏ
                    </div>
                </a>
            `;
            
            gridEl.insertAdjacentHTML('beforeend', cardHtml);
        });

    } catch (error) {
        console.error('Error fetching products list:', error);
        gridEl.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: red;">Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.</div>';
    }
}

// --- API Integration ---
async function fetchProductData() {
    const titleEl = document.getElementById('api-product-title');
    if (!titleEl) return; // Not on the product page

    try {
        const response = await fetch('https://produce-slang-obsessive.ngrok-free.dev/api/products/1', {
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Update basic info
        titleEl.textContent = data.name;
        document.getElementById('api-product-brand').textContent = data.brands.name;
        document.getElementById('api-product-desc').innerHTML = `<p>${data.description}</p>`;

        // Format currency helper
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
        };

        // Render variants
        const variantContainer = document.getElementById('api-product-variants');
        const variantList = variantContainer.querySelector('.variant-list');
        const priceEl = document.getElementById('api-product-price');
        
        if (data.product_variants && data.product_variants.length > 0) {
            variantContainer.style.display = 'block';
            variantList.innerHTML = ''; // clear existing
            
            data.product_variants.forEach((variant, index) => {
                const btn = document.createElement('button');
                btn.className = 'variant-btn';
                if (index === 0) btn.classList.add('active'); // default select first
                btn.textContent = variant.name;
                
                // Click event
                btn.onclick = () => {
                    // Update active class
                    document.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    // Update price
                    priceEl.textContent = formatCurrency(variant.price);
                };
                
                variantList.appendChild(btn);
            });
            
            // Set initial price to first variant
            priceEl.textContent = formatCurrency(data.product_variants[0].price);
        }

    } catch (error) {
        console.error('Error fetching product data:', error);
    }
}
// ── Search Overlay ──────────────────────────────────
function setupSearchOverlay() {
    const trigger = document.getElementById('searchTrigger');
    const inputTrigger = document.getElementById('searchInputTrigger');
    const btnTrigger = document.getElementById('searchBtnTrigger');
    const overlay = document.getElementById('searchOverlay');
    const backdrop = document.getElementById('searchBackdrop');
    const closeBtn = document.getElementById('searchCloseBtn');
    const searchInput = document.getElementById('searchOverlayInput');
    const clearBtn = document.getElementById('searchClearBtn');
    if (!overlay) return;

    function openSearch() {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(() => searchInput && searchInput.focus(), 400);
    }
    function closeSearch() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    trigger && trigger.addEventListener('click', openSearch);
    inputTrigger && inputTrigger.addEventListener('focus', openSearch);
    backdrop && backdrop.addEventListener('click', closeSearch);
    closeBtn && closeBtn.addEventListener('click', closeSearch);

    // Clear button
    if (searchInput && clearBtn) {
        searchInput.addEventListener('input', () => {
            clearBtn.classList.toggle('visible', searchInput.value.length > 0);
        });
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.classList.remove('visible');
            searchInput.focus();
        });
    }

    // Filter chip single-select per group
    document.querySelectorAll('.search-filter-group').forEach(group => {
        group.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            });
        });
    });

    // ESC closes search
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
    });
}
