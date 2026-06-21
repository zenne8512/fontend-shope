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
    // 1. Setup UI components first
    setupSideMenu();
    setupAuthOverlay();
    setupCartOverlay();
    setupSearchOverlay();
    setupHeroBtn();
    try {
        setupWishlistOverlay();
    } catch (e) {
        console.error("Lỗi setupWishlistOverlay:", e);
    }
    
    // 2. Fetch auth and badges
    try {
        UI.updateHeaderAuthUI();
        UI.updateCartBadge();
        updateWishlistBadge();
    } catch (e) {
        console.error("Lỗi update UI:", e);
    }
    
    // 3. Fetch backend data (wrapped in try-catch to prevent script crash)
    try {
        fetchProductsList();
    } catch (e) {
        console.error("Lỗi fetchProductsList:", e);
    }
    
    try {
        fetchProductData();
    } catch (e) {
        console.error("Lỗi fetchProductData:", e);
    }
};

function setupHeroBtn() {
    const btnHero = document.querySelector('.btn-hero');
    if (btnHero) {
        btnHero.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById('our-products');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
}

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
        <a href="${getRootPathPrefix()}src/views/Cart/cart.html" style="display:flex;align-items:center;gap:10px;padding:10px 16px;color:rgba(255,255,255,0.7);text-decoration:none;border-radius:8px;font-size:13px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='transparent'">
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
            const price = item.products && item.products.price ? parseFloat(item.products.price) : 0;
            const lineTotal = price * item.quantity;
            subtotal += lineTotal;

            const imgUrl = getImageUrl(item.products && item.products.image_url
                ? item.products.image_url
                : 'src/assets/images/main.png');

            const div = document.createElement('div');
            div.className = 'cart-ov-item';
            div.style.cssText = `display:flex;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);align-items:center;`;
            div.innerHTML = `
                <img src="${imgUrl}" alt="${item.products ? item.products.name : ''}"
                    style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.08);"
                    onerror="this.src='${getRootPathPrefix()}src/assets/images/main.png'">
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
        const hasHero = !!document.querySelector('.hero-video-section');
        if (!hasHero) {
            headerWrapper.classList.add('scrolled');
            headerWrapper.style.position = 'sticky';
        } else {
            window.addEventListener('scroll', () => {
                headerWrapper.classList.toggle('scrolled', window.scrollY > 50);
            });
            headerWrapper.classList.toggle('scrolled', window.scrollY > 50);
        }
    }

    const logoLink = document.querySelector('.ox-logo a');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = getRootPathPrefix() + 'index.html';
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
            const price = product.price ? parseFloat(product.price) : 0;
            const imageUrl = getImageUrl(product.image_url ? product.image_url : 'src/assets/images/main.png');
            const stars = Math.round(product.averageRating || 0);
            const starsHtml = Array.from({length: 5}, (_, i) =>
                `<i class="fa${i < stars ? 's' : 'r'} fa-star" style="color:#EBC351;font-size:12px;"></i>`
            ).join('');

            const inWishlist = isProductInWishlist(product.id);
            const heartClass = inWishlist ? 'fas fa-heart' : 'far fa-heart';
            const heartColor = inWishlist ? '#ff4d4d' : '#fff';
            const safeName = (product.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeImg = (product.image_url || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

            gridEl.insertAdjacentHTML('beforeend', `
                <a href="${getRootPathPrefix()}src/views/Product/product.html?id=${product.id}" class="product-card">
                    <div class="card-img" style="position: relative;">
                        <button class="wishlist-btn-card" data-product-id="${product.id}" data-product-name="${safeName}" data-product-price="${price}" data-product-img="${safeImg}" style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.5); border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; z-index: 10; color: ${heartColor}; font-size: 16px;">
                            <i class="${heartClass}"></i>
                        </button>
                        <img src="${imageUrl}" alt="${product.name}" loading="lazy" onerror="this.src='${getRootPathPrefix()}src/assets/images/main.png'">
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

    // Event delegation cho nút tim trên tất cả thẻ sản phẩm
    gridEl.addEventListener('click', function(e) {
        const btn = e.target.closest('.wishlist-btn-card');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();

        const product = {
            id: parseInt(btn.dataset.productId),
            name: btn.dataset.productName || 'Sản phẩm',
            price: parseFloat(btn.dataset.productPrice) || 0,
            image_url: btn.dataset.productImg || ''
        };
        toggleWishlistGlobal(null, product);
    });
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
        
        // Cập nhật Breadcrumb động
        const breadcrumbCat = document.getElementById('api-breadcrumb-cat');
        const breadcrumbName = document.getElementById('api-breadcrumb-name');
        if (breadcrumbCat && data.categories) {
            breadcrumbCat.textContent = data.categories.name;
        }
        if (breadcrumbName) {
            breadcrumbName.textContent = data.name;
        }

        if (document.getElementById('api-product-brand'))
            document.getElementById('api-product-brand').textContent = data.brands ? data.brands.name : '';
        if (document.getElementById('api-product-desc'))
            document.getElementById('api-product-desc').innerHTML = `<p>${data.description || 'Chưa có mô tả.'}</p>`;

        if (document.getElementById('api-product-image')) {
            const mainImg = getImageUrl(data.image_url ? data.image_url : 'src/assets/images/main.png');
            document.getElementById('api-product-image').src = mainImg;

            // Thumbnail List
            const thumbList = document.querySelector('.thumbnail-list');
            const images = [data.image_url, data.image_url_2].filter(Boolean);
            if (thumbList && images.length > 0) {
                thumbList.innerHTML = images.map((img, idx) => {
                    const thumbUrl = getImageUrl(img);
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
        if (variantContainer) {
            variantContainer.style.display = 'none';
        }
        if (priceEl) {
            priceEl.textContent = UI.formatCurrency(data.price || 0);
        }

        // Gắn nút Add to Cart
        const addCartBtn = document.querySelector('.btn-add-cart');
        if (addCartBtn) {
            addCartBtn.onclick = async () => {
                const qty = parseInt(document.getElementById('quantity')?.value || 1);
                await addToCartGlobal(data.id, qty);
            };
        }

        // Gắn nút Wishlist Premium
        const wishlistBtn = document.getElementById('btnWishlistPremium');
        if (wishlistBtn) {
            const inWishlist = isProductInWishlist(data.id);
            const icon = wishlistBtn.querySelector('i');
            if (inWishlist) {
                wishlistBtn.classList.add('active');
                if (icon) icon.className = 'fas fa-heart';
            } else {
                wishlistBtn.classList.remove('active');
                if (icon) icon.className = 'far fa-heart';
            }

            wishlistBtn.onclick = () => {
                const productToSave = {
                    id: data.id,
                    name: data.name,
                    price: parseFloat(data.price || 0),
                    image_url: data.image_url
                };
                toggleWishlistGlobal(null, productToSave);
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
                <div style="padding:16px 0;border-bottom:1px solid var(--border-color, #EAEAEA);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#EBC351,#D8AD30);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#000;">
                            <i class="fas fa-user" style="font-size:14px;"></i>
                        </div>
                        <div>
                            <div style="font-size:13px;font-weight:600;color:var(--text-color, #333);">Khách hàng OX</div>
                            <div style="font-size:11px;color:var(--text-light, #666);">${date}</div>
                        </div>
                        <div style="margin-left:auto;">${stars}</div>
                    </div>
                    <p style="font-size:13.5px;color:var(--text-color, #333);opacity:0.85;line-height:1.6;margin-top:6px;">${r.comment || ''}</p>
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
                            const price = p.price ? parseFloat(p.price) : 0;
                            const imgUrl = p.image_url ? getImageUrl(p.image_url) : 'src/assets/images/main.png';
                            html += `
                                <a href="${getRootPathPrefix()}src/views/Product/product.html?id=${p.id}" style="display:flex; gap:16px; padding:12px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05); color:#fff; text-decoration:none; transition: background 0.2s;">
                                    <img src="${imgUrl}" style="width:48px; height:48px; object-fit:cover; border-radius:6px;" onerror="this.src='${getRootPathPrefix()}src/assets/images/main.png'">
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
                window.location.href = `${getRootPathPrefix()}src/views/Product/product.html?search=${encodeURIComponent(keyword)}`;
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

// ── WISHLIST (SẢN PHẨM YÊU THÍCH) LOGIC ──────────────────────────────────
function getWishlist() {
    try {
        const list = localStorage.getItem('ox_wishlist');
        return list ? JSON.parse(list) : [];
    } catch (e) {
        console.error("Error reading wishlist:", e);
        return [];
    }
}

function saveWishlist(list) {
    try {
        localStorage.setItem('ox_wishlist', JSON.stringify(list));
        updateWishlistBadge();
    } catch (e) {
        console.error("Error saving wishlist:", e);
    }
}

function isProductInWishlist(id) {
    const list = getWishlist();
    return list.some(item => item.id === parseInt(id));
}

// Hàm toggle yêu thích sản phẩm toàn cục
function toggleWishlistGlobal(event, product) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const productId = typeof product === 'object' ? parseInt(product.id) : parseInt(product);
    let list = getWishlist();
    const index = list.findIndex(item => item.id === productId);

    let isAdded = false;
    
    if (index > -1) {
        list.splice(index, 1);
    } else {
        if (typeof product === 'object') {
            list.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url
            });
        } else {
            // Lấy thông tin từ thẻ sản phẩm
            const card = document.querySelector(`.product-card[href*="id=${productId}"]`) || document.querySelector(`.product-card[data-product-id="${productId}"]`);
            let name = "Sản phẩm";
            let price = 0;
            let image_url = "";
            if (card) {
                const titleEl = card.querySelector('.card-title');
                if (titleEl) name = titleEl.textContent;
                const priceEl = card.querySelector('.card-price .current');
                if (priceEl) {
                    const cleanPrice = priceEl.textContent.replace(/[^\d]/g, '');
                    price = parseFloat(cleanPrice) || 0;
                }
                const imgEl = card.querySelector('.card-img img');
                if (imgEl) image_url = imgEl.getAttribute('src');
            } else {
                const nameEl = document.querySelector('.product-title-premium') || document.querySelector('.product-info-premium h1');
                if (nameEl) name = nameEl.textContent;
                const priceEl = document.querySelector('.price-current-premium') || document.querySelector('.price-new');
                if (priceEl) {
                    const cleanPrice = priceEl.textContent.replace(/[^\d]/g, '');
                    price = parseFloat(cleanPrice) || 0;
                }
                const imgEl = document.getElementById('api-product-image');
                if (imgEl) image_url = imgEl.getAttribute('src');
            }

            list.push({
                id: productId,
                name: name,
                price: price,
                image_url: image_url
            });
        }
        isAdded = true;
    }

    saveWishlist(list);

    // Cập nhật hoạt ảnh và biểu tượng trên tất cả các thẻ sản phẩm tương ứng ngoài trang chủ
    const cardBtns = document.querySelectorAll(`.wishlist-btn-card[data-product-id="${productId}"]`);
    cardBtns.forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
            if (isAdded) {
                icon.className = 'fas fa-heart';
                btn.style.color = '#ff4d4d';
                btn.classList.add('heart-beat');
                setTimeout(() => btn.classList.remove('heart-beat'), 500);
            } else {
                icon.className = 'far fa-heart';
                btn.style.color = '#fff';
            }
        }
    });

    // Cập nhật nút trên trang chi tiết sản phẩm nếu có
    const detailBtn = document.getElementById('btnWishlistPremium');
    if (detailBtn) {
        const icon = detailBtn.querySelector('i');
        if (icon) {
            if (isAdded) {
                detailBtn.classList.add('active');
                icon.className = 'fas fa-heart';
                icon.classList.add('heart-beat');
                setTimeout(() => icon.classList.remove('heart-beat'), 500);
            } else {
                detailBtn.classList.remove('active');
                icon.className = 'far fa-heart';
            }
        }
    }

    // Render lại panel nếu nó đang mở
    const overlay = document.getElementById('wishlistOverlay');
    if (overlay && overlay.classList.contains('active')) {
        renderWishlistPanel();
    }
}

function updateWishlistBadge() {
    const list = getWishlist();
    const count = list.length;
    const badges = document.querySelectorAll('.wishlist-count');
    badges.forEach(b => {
        b.textContent = count;
        if (count > 0) {
            b.style.display = 'inline-block';
        } else {
            b.textContent = '0';
        }
    });
}

function renderWishlistPanel() {
    const body = document.getElementById('wishlistOverlayBody');
    if (!body) return;

    const list = getWishlist();
    if (list.length === 0) {
        body.innerHTML = `
            <div class="wishlist-ov-empty">
                <i class="far fa-heart"></i>
                <p>Danh sách yêu thích của bạn đang trống</p>
                <span>Hãy khám phá bộ sưu tập của chúng tôi</span>
            </div>
        `;
        return;
    }

    let html = '<div class="wishlist-ov-items" style="display:flex; flex-direction:column; gap:10px;">';
    list.forEach(item => {
        const price = item.price ? parseFloat(item.price) : 0;
        const imageUrl = getImageUrl(item.image_url ? item.image_url : 'src/assets/images/main.png');
        html += `
            <div class="wishlist-ov-item">
                <img class="wishlist-ov-img" src="${imageUrl}" onerror="this.src='${getRootPathPrefix()}src/assets/images/main.png'" alt="${item.name}">
                <div class="wishlist-ov-info">
                    <h4 class="wishlist-ov-title">${item.name}</h4>
                    <div class="wishlist-ov-price">${UI.formatCurrency(price)}</div>
                </div>
                <div class="wishlist-ov-actions">
                    <button class="wishlist-ov-add-cart-btn" onclick="addToCartFromWishlist(${item.id})">Thêm giỏ</button>
                    <button class="wishlist-ov-remove-btn" onclick="toggleWishlistGlobal(null, ${item.id})"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    body.innerHTML = html;
}

function addToCartFromWishlist(productId) {
    addToCartGlobal(productId);
    closeWishlistOverlay();
    setTimeout(() => {
        openCartOverlay();
    }, 450);
}

// Thiết lập Overlay Yêu Thích
function setupWishlistOverlay() {
    const trigger = document.getElementById('wishlist-icon-btn');
    const overlay = document.getElementById('wishlistOverlay');
    const backdrop = document.getElementById('wishlistBackdrop');
    const closeBtn = document.getElementById('wishlistCloseBtn');
    if (!overlay) return;

    function openWishlist() {
        try { closeCartOverlay(); } catch(e){}
        try { closeSearch(); } catch(e){}
        try { closeAuthOverlay(); } catch(e){}

        overlay.classList.add('active');
        renderWishlistPanel();
    }

    window.closeWishlistOverlay = function() {
        overlay.classList.remove('active');
    }

    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openWishlist();
        });
    }
    if (backdrop) backdrop.addEventListener('click', closeWishlistOverlay);
    if (closeBtn) closeBtn.addEventListener('click', closeWishlistOverlay);
}



