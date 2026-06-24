// ============================================================
//  OX EN PROVENCE – API Service Layer
//  Đổi BASE_URL sang URL Backend thực khi deploy production
// ============================================================
const API_BASE_URL = 'http://localhost:5000/api';
const BACKEND_URL = 'http://localhost:5000';

function getRootPathPrefix() {
    const path = window.location.pathname;
    if (path.includes('/src/views/')) {
        return '../../../';
    }
    return '';
}

function getImageUrl(url) {
    if (!url) return getRootPathPrefix() + 'src/assets/images/main.png';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
        const formattedUrl = url.startsWith('/') ? url : '/' + url;
        return `${BACKEND_URL}${formattedUrl}`;
    }
    if (url.startsWith('src/')) {
        return getRootPathPrefix() + url;
    }
    if (url.startsWith('/src/')) {
        return getRootPathPrefix() + url.slice(1);
    }
    return url;
}

// ── Helper: Lấy token từ localStorage ──
function getToken() {
    return localStorage.getItem('ox_token');
}

// ── Helper: Tạo headers có kèm token ──
function authHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

// ── Helper: Xử lý response chung ──
async function handleResponse(res) {
    if (res.status === 401) {
        Auth.logout();
        if (typeof UI !== 'undefined') {
            UI.showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
        } else {
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        window.location.href = getRootPathPrefix() + 'src/views/Auth/login.html';
        throw new Error('Phiên đăng nhập đã hết hạn');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Đã có lỗi xảy ra');
    return data;
}

// ============================================================
//  AUTH
// ============================================================
const Auth = {
    async login(email, password) {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await handleResponse(res);
        // Lưu token & thông tin user
        localStorage.setItem('ox_token', data.token);
        localStorage.setItem('ox_user', JSON.stringify({ id: data.id, email: data.email, name: data.name, role: data.role }));
        return data;
    },

    async register(email, password, name) {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });
        const data = await handleResponse(res);
        localStorage.setItem('ox_token', data.token);
        localStorage.setItem('ox_user', JSON.stringify({ id: data.id, email: data.email, name: data.name, role: data.role }));
        return data;
    },

    logout() {
        localStorage.removeItem('ox_token');
        localStorage.removeItem('ox_user');
    },

    isLoggedIn() {
        return !!getToken();
    },

    getUser() {
        const u = localStorage.getItem('ox_user');
        return u ? JSON.parse(u) : null;
    },

    isAdmin() {
        const user = Auth.getUser();
        return user && user.role === 'ADMIN';
    },

    async getProfile() {
        const res = await fetch(`${API_BASE_URL}/auth/profile`, { headers: authHeaders() });
        return handleResponse(res);
    },

    async updateProfile(data) {
        const res = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    }
};

// ============================================================
//  PRODUCTS
// ============================================================
const Products = {
    async getAll(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE_URL}/products?${query}`);
        return handleResponse(res);
    },

    async getById(id) {
        const res = await fetch(`${API_BASE_URL}/products/${id}`);
        return handleResponse(res);
    },

    async create(data) {
        const res = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    async update(id, data) {
        const res = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    async delete(id) {
        const res = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        return handleResponse(res);
    }
};

// ============================================================
//  CART
// ============================================================
const Cart = {
    async getCart() {
        if (!Auth.isLoggedIn()) {
            const guestCart = JSON.parse(localStorage.getItem('ox_guest_cart') || '[]');
            const results = [];
            for (const item of guestCart) {
                try {
                    const product = await Products.getById(item.product_id);
                    results.push({
                        id: item.product_id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        products: product
                    });
                } catch (err) {
                    console.error('Error fetching guest product details:', err);
                }
            }
            return results;
        }
        const res = await fetch(`${API_BASE_URL}/cart`, { headers: authHeaders() });
        return handleResponse(res);
    },

    async addItem(product_id, quantity = 1) {
        if (!Auth.isLoggedIn()) {
            const guestCart = JSON.parse(localStorage.getItem('ox_guest_cart') || '[]');
            const idx = guestCart.findIndex(item => item.product_id === product_id);
            if (idx > -1) {
                guestCart[idx].quantity += quantity;
            } else {
                guestCart.push({ product_id, quantity });
            }
            localStorage.setItem('ox_guest_cart', JSON.stringify(guestCart));
            return { message: 'Đã thêm vào giỏ hàng khách' };
        }
        const res = await fetch(`${API_BASE_URL}/cart`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ product_id, quantity })
        });
        return handleResponse(res);
    },

    async updateItem(cartItemId, quantity) {
        if (!Auth.isLoggedIn()) {
            const guestCart = JSON.parse(localStorage.getItem('ox_guest_cart') || '[]');
            const idx = guestCart.findIndex(item => item.product_id === cartItemId);
            if (idx > -1) {
                guestCart[idx].quantity = quantity;
                localStorage.setItem('ox_guest_cart', JSON.stringify(guestCart));
            }
            return { message: 'Đã cập nhật số lượng' };
        }
        const res = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ quantity })
        });
        return handleResponse(res);
    },

    async removeItem(cartItemId) {
        if (!Auth.isLoggedIn()) {
            let guestCart = JSON.parse(localStorage.getItem('ox_guest_cart') || '[]');
            guestCart = guestCart.filter(item => item.product_id !== cartItemId);
            localStorage.setItem('ox_guest_cart', JSON.stringify(guestCart));
            return { message: 'Đã xóa sản phẩm khỏi giỏ hàng' };
        }
        const res = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        return handleResponse(res);
    }
};

// ============================================================
//  ORDERS
// ============================================================
const Orders = {
    async checkout() {
        const res = await fetch(`${API_BASE_URL}/orders/checkout`, {
            method: 'POST',
            headers: authHeaders()
        });
        return handleResponse(res);
    },

    async guestCheckout(data) {
        const res = await fetch(`${API_BASE_URL}/orders/guest-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    async getMyOrders() {
        const res = await fetch(`${API_BASE_URL}/orders/my-orders`, { headers: authHeaders() });
        return handleResponse(res);
    },

    async getById(id) {
        const res = await fetch(`${API_BASE_URL}/orders/${id}`, { headers: authHeaders() });
        return handleResponse(res);
    },

    async cancel(id) {
        const res = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
            method: 'PUT',
            headers: authHeaders()
        });
        return handleResponse(res);
    },

    async getAll() {
        const res = await fetch(`${API_BASE_URL}/orders`, { headers: authHeaders() });
        return handleResponse(res);
    },

    async updateStatus(id, status) {
        const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status })
        });
        return handleResponse(res);
    }
};

// ============================================================
//  REVIEWS
// ============================================================
const Reviews = {
    async getByProduct(productId) {
        const res = await fetch(`${API_BASE_URL}/reviews/product/${productId}`);
        return handleResponse(res);
    },

    async create(product_id, rating, comment) {
        const res = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ product_id, rating, comment })
        });
        return handleResponse(res);
    }
};

// ============================================================
//  CATEGORIES & BRANDS
// ============================================================
const Categories = {
    async getAll() {
        const res = await fetch(`${API_BASE_URL}/categories`);
        return handleResponse(res);
    }
};

const Brands = {
    async getAll() {
        const res = await fetch(`${API_BASE_URL}/brands`);
        return handleResponse(res);
    },

    async create(data) {
        const res = await fetch(`${API_BASE_URL}/brands`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    }
};

// ============================================================
//  Shared UI Helpers
// ============================================================
const UI = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    },

    showToast(message, type = 'success') {
        const existing = document.getElementById('ox-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'ox-toast';
        toast.style.cssText = `
            position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
            background:${type === 'success' ? '#1a1a1a' : '#c0392b'};
            color:#fff; padding:14px 28px; border-radius:50px;
            font-family:'Montserrat',sans-serif; font-size:13.5px; font-weight:600;
            border-left:4px solid ${type === 'success' ? '#EBC351' : '#e74c3c'};
            box-shadow:0 8px 30px rgba(0,0,0,0.5); z-index:99999;
            animation:slideUpToast 0.3s ease;
        `;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}" style="margin-right:10px;color:${type === 'success' ? '#EBC351' : '#e74c3c'}"></i>${message}`;
        
        if (!document.getElementById('ox-toast-style')) {
            const style = document.createElement('style');
            style.id = 'ox-toast-style';
            style.textContent = `@keyframes slideUpToast{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`;
            document.head.appendChild(style);
        }
        document.body.appendChild(toast);
        setTimeout(() => toast && toast.remove(), 3500);
    },

    // Cập nhật badge giỏ hàng trên header
    async updateCartBadge() {
        try {
            const items = await Cart.getCart();
            const total = items.reduce((sum, item) => sum + item.quantity, 0);
            document.querySelectorAll('.cart-count').forEach(el => el.textContent = total);
        } catch (_) {}
    },

    // Cập nhật UI header dựa theo trạng thái đăng nhập
    updateHeaderAuthUI() {
        const userBtn = document.getElementById('user-icon-btn');
        if (!userBtn) return;
        const user = Auth.getUser();
        if (user) {
            userBtn.title = `Xin chào, ${user.email}`;
            userBtn.innerHTML = `<i class="fas fa-user-check"></i>`;
            userBtn.style.color = '#EBC351';
        }
    }
};
