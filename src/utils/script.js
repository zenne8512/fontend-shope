// Image Gallery
function changeImage(src, element) {
    const mainImg = document.getElementById('api-product-image') || document.getElementById('mainImage');
    if (mainImg) mainImg.src = src;
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    element.classList.add('active');
}

// Quantity Selector
function changeQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    let newValue = parseInt(quantityInput.value) + change;
    if (newValue < 1) newValue = 1;
    quantityInput.value = newValue;
}

// Tabs
function openTab(evt, tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// ── On Page Load ──────────────────────────────────
window.onload = function () {
    setupSideMenu();
    setupAuthOverlay();
    setupCartOverlay();
    setupSearchOverlay();
    UI.updateHeaderAuthUI();
    UI.updateCartBadge();
    fetchProductsList();
    fetchProductData();
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
        // Nếu đã đăng nhập → hiện menu profile
        if (Auth.isLoggedIn()) {
            showProfileMenu(userBtn);
        } else {
            openAuthOverlay();
        }
    });
    closeBtn && closeBtn.addEventListener('click', closeAuthOverlay);
    backdrop && backdrop.addEventListener('click', closeAuthOverlay);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeAuthOverlay(); closeCartOverlay(); }
    });

    // Gắn submit cho form đăng nhập overlay
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('ov-login-email').value;
            const password = document.getElementById('ov-login-pw').value;
            try {
                await Auth.login(email, password);
                closeAuthOverlay();
                UI.updateHeaderAuthUI();
                UI.updateCartBadge();
                UI.showToast('Đăng nhập thành công! Chào mừng bạn trở lại.');
            } catch (err) {
                UI.showToast(err.message, 'error');
            }
        };
    }

    // Gắn submit cho form đăng ký overlay
    const formRegister = document.getElementById('form-register');
    if (formRegister) {
        formRegister.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('ov-reg-email').value;
            const password = document.getElementById('ov-reg-pw').value;
            const name = document.getElementById('ov-reg-name') ? document.getElementById('ov-reg-name').value : '';
            try {
                await Auth.register(email, password, name);
                closeAuthOverlay();
                UI.updateHeaderAuthUI();
                UI.updateCartBadge();
                UI.showToast('Tạo tài khoản thành công! Chào mừng bạn đến với OX.');
            } catch (err) {
                UI.showToast(err.message, 'error');
            }
        };
    }
}

function showProfileMenu(anchor) {
    const existing = document.getElementById('ox-profile-dropdown');
    if (existing) { existing.remove(); return; }

    const user = Auth.getUser();
    const dropdown = document.createElement('div');
    dropdown.id = 'ox-profile-dropdown';
    dropdown.style.cssText = `
        position:fixed; top:64px; right:16px;
        background:#1a1a1a; border:1px solid rgba(235,195,81,0.2);
        border-radius:12px; padding:8px; z-index:9999;
        box-shadow:0 16px 40px rgba(0,0,0,0.6);
        min-width:200px; font-family:'Montserrat',sans-serif;
    `;
    dropdown.innerHTML = `
        <div style="padding:12px 16px 10px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:6px;">
            <div style="font-size:12px;color:rgba(255,255,255,0.4);">Đăng nhập với</div>
            <div style="font-size:13px;color:#EBC351;font-weight:600;margin-top:2px;">${user ? user.email : ''}</div>
        </div>
        <a href="src/views/Cart/cart.html" style="display:flex;align-items:center;gap:10px;padding:10px 16px;color:rgba(255,255,255,0.7);text-decoration:none;border-radius:8px;font-size:13px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='transparent'">
            <i class="fas fa-shopping-bag" style="width:16px;color:#EBC351;"></i> Giỏ hàng & Đơn hàng
        </a>
        <div onclick="Auth.logout(); location.reload();" style="display:flex;align-items:center;gap:10px;padding:10px 16px;color:rgba(255,100,100,0.8);cursor:pointer;border-radius:8px;font-size:13px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,100,100,0.08)'" onmouseout="this.style.background='transparent'">
            <i class="fas fa-sign-out-alt" style="width:16px;"></i> Đăng xuất
        </div>
    `;
    document.body.appendChild(dropdown);
    setTimeout(() => {
        document.addEventListener('click', function removeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== anchor) {
                dropdown.remove();
                document.removeEventListener('click', removeDropdown);
            }
        });
    }, 100);
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
        tabLogin.classList.add('active'); tabRegister.classList.remove('active');
        formLogin.style.display = 'flex'; formRegister.style.display = 'none';
    } else {
        tabRegister.classList.add('active'); tabLogin.classList.remove('active');
        formRegister.style.display = 'flex'; formLogin.style.display = 'none';
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
        renderCartOverlay();
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

async function renderCartOverlay() {
    const body = document.getElementById('cartOverlayBody');
    if (!body) return;

    if (!Auth.isLoggedIn()) {
        body.innerHTML = `
            <div class="cart-ov-empty">
                <i class="fas fa-user-lock" style="color:#EBC351;font-size:36px;margin-bottom:12px;"></i>
                <p>Vui lòng đăng nhập để xem giỏ hàng</p>
                <span onclick="closeCartOverlay(); openAuthOverlay();" style="cursor:pointer;color:#EBC351;margin-top:8px;display:inline-block;font-weight:600;">Đăng nhập ngay</span>
            </div>`;
        return;
    }

    body.innerHTML = `<div style="text-align:center;padding:32px;color:rgba(255,255,255,0.4);"><i class="fas fa-spinner fa-spin"></i> Đang tải giỏ hàng...</div>`;

    try {
        const items = await Cart.getCart();
        if (items.length === 0) {
            body.innerHTML = `
                <div class="cart-ov-empty">
                    <i class="fas fa-shopping-bag"></i>
                    <p>Giỏ hàng của bạn đang trống</p>
                    <span>Hãy khám phá bộ sưu tập của chúng tôi</span>
                </div>`;
            document.getElementById('cartOverlaySubtotal').textContent = '0đ';
            document.getElementById('cartOverlayTotal').textContent = '0đ';
            return;
        }

        let subtotal = 0;
        body.innerHTML = '';
        items.forEach(item => {
            const price = item.products && item.products.product_variants && item.products.product_variants.length > 0
                ? parseFloat(item.products.product_variants[0].price) : 0;
            const lineTotal = price * item.quantity;
            subtotal += lineTotal;

            const imgUrl = getImageUrl(item.products && item.products.product_images && item.products.product_images.length > 0
                ? item.products.product_images[0].image_url
                : 'src/assets/images/main.png');

            const div = document.createElement('div');
            div.className = 'cart-ov-item';
            div.style.cssText = `display:flex;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);align-items:center;`;
            div.innerHTML = `
                <img src="${imgUrl}" alt="${item.products ? item.products.name : ''}"
                    style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.08);"
                    onerror="this.src='src/assets/images/main.png'">
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.products ? item.products.name : 'Sản phẩm'}</div>
                    <div style="font-size:12px;color:#EBC351;margin-top:4px;">${UI.formatCurrency(price)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                        <button onclick="changeCartQty(${item.id}, ${item.quantity - 1})" style="width:24px;height:24px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:#fff;border-radius:4px;cursor:pointer;font-size:14px;">−</button>
                        <span style="font-size:13px;color:#fff;min-width:20px;text-align:center;">${item.quantity}</span>
                        <button onclick="changeCartQty(${item.id}, ${item.quantity + 1})" style="width:24px;height:24px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:#fff;border-radius:4px;cursor:pointer;font-size:14px;">+</button>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
                    <div style="font-size:13px;font-weight:700;color:#fff;">${UI.formatCurrency(lineTotal)}</div>
                    <button onclick="removeCartItem(${item.id})" style="background:none;border:none;color:rgba(255,100,100,0.6);cursor:pointer;font-size:13px;padding:4px;"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            body.appendChild(div);
        });

        document.getElementById('cartOverlaySubtotal').textContent = UI.formatCurrency(subtotal);
        document.getElementById('cartOverlayTotal').textContent = UI.formatCurrency(subtotal);
    } catch (err) {
        body.innerHTML = `<div style="color:#e74c3c;text-align:center;padding:24px;">${err.message}</div>`;
    }
}

async function changeCartQty(cartItemId, newQty) {
    if (newQty < 1) { await removeCartItem(cartItemId); return; }
    try {
        await Cart.updateItem(cartItemId, newQty);
        await renderCartOverlay();
        UI.updateCartBadge();
    } catch (err) { UI.showToast(err.message, 'error'); }
}

async function removeCartItem(cartItemId) {
    try {
        await Cart.removeItem(cartItemId);
        await renderCartOverlay();
        UI.updateCartBadge();
        UI.showToast('Đã xóa sản phẩm khỏi giỏ hàng.');
    } catch (err) { UI.showToast(err.message, 'error'); }
}

// Hàm toàn cục gọi từ product page
async function addToCartGlobal(productId, quantity = 1) {
    if (!Auth.isLoggedIn()) {
        UI.showToast('Vui lòng đăng nhập để thêm vào giỏ hàng.', 'error');
        openAuthOverlay();
        return;
    }
    try {
        await Cart.addItem(productId, quantity);
        UI.showToast('Đã thêm sản phẩm vào giỏ hàng!');
        UI.updateCartBadge();
    } catch (err) {
        UI.showToast(err.message, 'error');
    }
}

// ── Side Menu ──────────────────────────────────
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

    const headerWrapper = document.querySelector('.ox-header-wrapper');
    if (headerWrapper) {
        window.addEventListener('scroll', () => {
            headerWrapper.classList.toggle('scrolled', window.scrollY > 50);
        });
    }
}

// ── Trang Chủ: Tải danh sách sản phẩm ──────────────────────────────────
async function fetchProductsList(categorySlug = '') {
    const gridEl = document.getElementById('api-products-grid');
    if (!gridEl) return;

    gridEl.innerHTML = Array.from({length: 8}, () => `
        <div class="product-card" style="pointer-events:none;">
            <div class="card-img" style="background:rgba(255,255,255,0.05); min-height: 250px; animation: pulse 1.5s infinite;"></div>
            <div class="card-info">
                <div style="height:20px; background:rgba(255,255,255,0.05); margin-bottom:10px; width:80%; animation: pulse 1.5s infinite;"></div>
                <div style="height:15px; background:rgba(255,255,255,0.05); margin-bottom:10px; width:50%; animation: pulse 1.5s infinite;"></div>
                <div style="height:15px; background:rgba(255,255,255,0.05); width:30%; animation: pulse 1.5s infinite;"></div>
            </div>
        </div>
    `).join('') + `<style>@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.2; } 100% { opacity: 0.6; } }</style>`;

    try {
        let params = { page: 1, limit: 50 }; // Đặt limit là 50 sản phẩm để tải được nhiều
        
        if (categorySlug) {
            try {
                const cats = await Categories.getAll();
                const matched = cats.find(c => c.slug === categorySlug);
                if (matched) {
                    params.category_id = matched.id;
                }
            } catch (err) {
                console.error('Error finding category ID:', err);
            }
        }

        const data = await Products.getAll(params);
        const products = data.products || data;

        gridEl.innerHTML = '';

        if (!products || products.length === 0) {
            gridEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:rgba(255,255,255,0.4);padding:48px;">Chưa có sản phẩm nào thuộc danh mục này.</div>`;
            return;
        }

        products.forEach(product => {
            const price = product.product_variants && product.product_variants.length > 0
                ? parseFloat(product.product_variants[0].price) : 0;
            const imageUrl = getImageUrl(product.product_images && product.product_images.length > 0
                ? product.product_images[0].image_url
                : 'src/assets/images/main.png');
            const stars = Math.round(product.averageRating || 0);
            const starsHtml = Array.from({length: 5}, (_, i) =>
                `<i class="fa${i < stars ? 's' : 'r'} fa-star" style="color:#EBC351;font-size:12px;"></i>`
            ).join('');

            gridEl.insertAdjacentHTML('beforeend', `
                <a href="src/views/Product/product.html?id=${product.id}" class="product-card">
                    <div class="card-img">
                        <img src="${imageUrl}" alt="${product.name}" loading="lazy" onerror="this.src='src/assets/images/main.png'">
                        ${product.status !== 'active' ? '<div class="discount">Hết hàng</div>' : ''}
                    </div>
                    <div class="card-info">
                        <h3 class="card-title">${product.name}</h3>
                        ${product.brands ? `<div style="font-size:11px;color:#888;margin-bottom:6px;">${product.brands.name}</div>` : ''}
                        <div class="card-price">
                            <span class="current">${UI.formatCurrency(price)}</span>
                        </div>
                        <div class="rating-mini">
                            ${starsHtml}
                            <span style="font-size:11px;color:#888;">(${product.totalReviews || 0})</span>
                        </div>
                    </div>
                    <div class="card-hover-action" onclick="event.preventDefault(); addToCartGlobal(${product.id})">
                        <i class="fas fa-cart-plus"></i> &nbsp; Thêm vào giỏ
                    </div>
                </a>
            `);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        gridEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:rgba(255,100,100,0.8);padding:32px;">
            <i class="fas fa-exclamation-circle" style="margin-right:8px;"></i>
            Không thể kết nối tới máy chủ. Vui lòng kiểm tra Backend đang chạy trên cổng 5000.
        </div>`;
    }
}

// Hàm toàn cục lọc sản phẩm trên trang chủ và cuộn mượt xuống section sản phẩm
function filterCategoryOnHome(categorySlug) {
    // 1. Cập nhật trạng thái active cho các nút tab lọc
    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
        if (btn.getAttribute('data-category') === categorySlug) {
            btn.classList.add('active');
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.color = '#fff';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = 'rgba(255,255,255,0.6)';
        }
    });

    // 2. Gọi hàm tải sản phẩm theo danh mục
    fetchProductsList(categorySlug);

    // 3. Cuộn mượt đến phần danh sách sản phẩm
    const target = document.getElementById('our-products');
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Gắn sự kiện click cho các nút lọc danh mục
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.cat-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-category');
            filterCategoryOnHome(cat);
        });
    });
});

// ── Trang Sản phẩm: Tải chi tiết sản phẩm ──────────────────────────────────
async function fetchProductData() {
    const titleEl = document.getElementById('api-product-title');
    if (!titleEl) return;

    // Lấy ID từ URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id') || 1;

    try {
        const data = await Products.getById(productId);

        titleEl.textContent = data.name;
        if (document.getElementById('api-product-brand'))
            document.getElementById('api-product-brand').textContent = data.brands ? data.brands.name : '';
        if (document.getElementById('api-product-desc'))
            document.getElementById('api-product-desc').innerHTML = `<p>${data.description || 'Chưa có mô tả.'}</p>`;

        if (document.getElementById('api-product-image')) {
            const mainImg = getImageUrl(data.product_images && data.product_images.length > 0
                ? data.product_images[0].image_url
                : 'src/assets/images/main.png');
            document.getElementById('api-product-image').src = mainImg;

            // Thumbnail List
            const thumbList = document.querySelector('.thumbnail-list');
            if (thumbList && data.product_images && data.product_images.length > 0) {
                thumbList.innerHTML = data.product_images.map((img, idx) => {
                    const thumbUrl = getImageUrl(img.image_url);
                    return `<img src="${thumbUrl}" alt="Thumbnail ${idx + 1}" class="thumbnail${idx === 0 ? ' active' : ''}" onclick="changeImage('${thumbUrl}', this)">`;
                }).join('');
            }
        }

        // Rating
        if (document.getElementById('api-product-rating')) {
            const stars = Math.round(data.averageRating || 0);
            document.getElementById('api-product-rating').innerHTML = Array.from({length: 5}, (_, i) =>
                `<i class="fa${i < stars ? 's' : 'r'} fa-star"></i>`
            ).join('') + ` <span>(${data.totalReviews || 0} đánh giá)</span>`;
        }

        // Variants & Price
        const variantContainer = document.getElementById('api-product-variants');
        const priceEl = document.getElementById('api-product-price');
        if (data.product_variants && data.product_variants.length > 0 && variantContainer) {
            variantContainer.style.display = 'block';
            const variantList = variantContainer.querySelector('.variant-list');
            if (variantList) {
                variantList.innerHTML = '';
                data.product_variants.forEach((variant, index) => {
                    const btn = document.createElement('button');
                    btn.className = `variant-btn${index === 0 ? ' active' : ''}`;
                    btn.textContent = variant.name || `Loại ${index + 1}`;
                    btn.onclick = () => {
                        document.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        if (priceEl) priceEl.textContent = UI.formatCurrency(variant.price);
                    };
                    variantList.appendChild(btn);
                });
            }
            if (priceEl) priceEl.textContent = UI.formatCurrency(data.product_variants[0].price);
        }

        // Gắn nút Add to Cart
        const addCartBtn = document.querySelector('.btn-add-cart');
        if (addCartBtn) {
            addCartBtn.onclick = async () => {
                const qty = parseInt(document.getElementById('quantity')?.value || 1);
                await addToCartGlobal(data.id, qty);
            };
        }

        // Tải và hiển thị đánh giá
        renderProductReviews(data.id);

    } catch (error) {
        console.error('Error fetching product:', error);
    }
}

async function renderProductReviews(productId) {
    const container = document.getElementById('api-reviews-container');
    if (!container) return;
    try {
        const reviews = await Reviews.getByProduct(productId);
        if (!reviews.length) {
            container.innerHTML = `<p style="color:rgba(255,255,255,0.4);font-size:14px;">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>`;
            return;
        }
        container.innerHTML = reviews.map(r => {
            const stars = Array.from({length: 5}, (_, i) =>
                `<i class="fa${i < (r.rating || 0) ? 's' : 'r'} fa-star" style="color:#EBC351;font-size:12px;"></i>`
            ).join('');
            const date = r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '';
            return `
                <div style="padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#EBC351,#D8AD30);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#000;">
                            <i class="fas fa-user" style="font-size:14px;"></i>
                        </div>
                        <div>
                            <div style="font-size:13px;font-weight:600;color:#fff;">Khách hàng OX</div>
                            <div style="font-size:11px;color:rgba(255,255,255,0.3);">${date}</div>
                        </div>
                        <div style="margin-left:auto;">${stars}</div>
                    </div>
                    <p style="font-size:13.5px;color:rgba(255,255,255,0.65);line-height:1.6;">${r.comment || ''}</p>
                </div>
            `;
        }).join('');
    } catch (_) {}
}

// ── Search Overlay ──────────────────────────────────
function setupSearchOverlay() {
    const trigger = document.getElementById('searchTrigger');
    const inputTrigger = document.getElementById('searchInputTrigger');
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
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });

    let searchTimeout;
    const originalBodyHTML = document.querySelector('.search-overlay-body') ? document.querySelector('.search-overlay-body').innerHTML : '';

    if (searchInput && clearBtn) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim();
            clearBtn.classList.toggle('visible', query.length > 0);
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const body = document.querySelector('.search-overlay-body');
                if (!body) return;
                
                if (query.length === 0) {
                    body.innerHTML = originalBodyHTML; // Khôi phục giao diện mặc định
                    return;
                }

                body.innerHTML = '<div style="text-align:center;padding:48px;color:#fff;"><i class="fas fa-spinner fa-spin" style="font-size:24px; color:#EBC351;"></i><div style="margin-top:12px;font-size:13px;">Đang tìm kiếm...</div></div>';
                try {
                    const res = await Products.getAll({ search: query, limit: 10 });
                    const products = res.products || res;
                    if (products.length === 0) {
                        body.innerHTML = '<div style="text-align:center;padding:48px;color:rgba(255,255,255,0.6);font-size:14px;">Không tìm thấy sản phẩm nào phù hợp.</div>';
                    } else {
                        let html = '<div class="search-results-list" style="padding: 16px; display:flex; flex-direction:column; gap:12px;">';
                        html += `<h4 style="color:#EBC351; font-size:13px; text-transform:uppercase; margin-bottom:8px;">Kết quả tìm kiếm cho "${query}"</h4>`;
                        products.forEach(p => {
                            const price = p.product_variants && p.product_variants.length > 0 ? parseFloat(p.product_variants[0].price) : 0;
                            const imgUrl = p.product_images && p.product_images.length > 0 ? getImageUrl(p.product_images[0].image_url) : 'src/assets/images/main.png';
                            html += `
                                <a href="src/views/Product/product.html?id=${p.id}" style="display:flex; gap:16px; padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#fff; text-decoration:none; transition: background 0.2s;">
                                    <img src="${imgUrl}" style="width:48px; height:48px; object-fit:cover; border-radius:6px;" onerror="this.src='src/assets/images/main.png'">
                                    <div style="flex:1;">
                                        <div style="font-size:14px; font-weight:600; margin-bottom:4px;">${p.name}</div>
                                        <div style="font-size:13px; color:#EBC351;">${UI.formatCurrency(price)}</div>
                                    </div>
                                </a>`;
                        });
                        html += '</div>';
                        body.innerHTML = html;
                    }
                } catch (e) {
                    body.innerHTML = '<div style="text-align:center;padding:48px;color:#e74c3c;font-size:14px;">Đã có lỗi xảy ra khi tìm kiếm.</div>';
                }
            }, 400); // 400ms debounce
        });
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.classList.remove('visible');
            searchInput.focus();
            const body = document.querySelector('.search-overlay-body');
            if(body) body.innerHTML = originalBodyHTML;
        });

        // Enter để tìm kiếm
        searchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                const keyword = searchInput.value.trim();
                closeSearch();
                // Chuyển sang trang sản phẩm với query tìm kiếm
                window.location.href = `src/views/Product/product.html?search=${encodeURIComponent(keyword)}`;
            }
        });
    }

    // Lắng nghe click event uỷ quyền (event delegation) vì nội dung body có thể bị thay thế
    document.querySelector('.search-overlay-panel').addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (chip) {
            const group = chip.closest('.search-filter-group');
            if (group) {
                group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            }
        }
    });
}



