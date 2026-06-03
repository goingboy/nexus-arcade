/* ============================================
   NEXUS ARCADE - Main Application Script
   ============================================ */
(function(){
  'use strict';

  /* --- Auth System (localStorage) --- */
  const Auth = {
    KEY: 'nexus_users',
    SESSION_KEY: 'nexus_session',

    getUsers() {
      try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
      catch { return []; }
    },
    saveUsers(users) {
      localStorage.setItem(this.KEY, JSON.stringify(users));
    },
    register(username, email, password) {
      const users = this.getUsers();
      if (users.find(u => u.email === email)) {
        return { ok: false, msg: '该邮箱已被注册' };
      }
      if (users.find(u => u.username === username)) {
        return { ok: false, msg: '该用户名已被使用' };
      }
      const user = { id: Date.now(), username, email, password, createdAt: new Date().toISOString() };
      users.push(user);
      this.saveUsers(users);
      this.setSession(user);
      return { ok: true, user };
    },
    login(email, password) {
      const users = this.getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) return { ok: false, msg: '邮箱或密码错误' };
      this.setSession(user);
      return { ok: true, user };
    },
    setSession(user) {
      const safe = { id: user.id, username: user.username, email: user.email };
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(safe));
    },
    getSession() {
      try { return JSON.parse(localStorage.getItem(this.SESSION_KEY)); }
      catch { return null; }
    },
    logout() {
      localStorage.removeItem(this.SESSION_KEY);
    }
  };

  /* --- Toast Notifications --- */
  function ensureToastContainer() {
    let c = document.querySelector('.toast-container');
    if (!c) {
      c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }
  function showToast(msg, type) {
    const c = ensureToastContainer();
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.innerHTML = '<span class="toast-icon">' + (type === 'success' ? '&#10003;' : type === 'error' ? '&#10007;' : '&#9432;') + '</span>' + msg;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, 3000);
  }

  /* --- Modal Management --- */
  function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
  }
  function closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
    });
    document.body.style.overflow = '';
  }

  /* --- UI State Update --- */
  function updateAuthUI() {
    const session = Auth.getSession();
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (session) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (registerBtn) registerBtn.style.display = 'none';
      if (userMenu) {
        userMenu.style.display = 'flex';
        if (userName) userName.textContent = session.username;
        if (userAvatar) userAvatar.textContent = session.username.charAt(0).toUpperCase();
      }
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (registerBtn) registerBtn.style.display = '';
      if (userMenu) userMenu.style.display = 'none';
    }
  }

  /* --- Scroll Effects --- */
  function initScrollEffects() {
    const header = document.querySelector('.header');
    const fadeEls = document.querySelectorAll('.fade-in');

    window.addEventListener('scroll', () => {
      if (header) {
        header.classList.toggle('scrolled', window.scrollY > 20);
      }
    });

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.1 });
      fadeEls.forEach(el => obs.observe(el));
    } else {
      fadeEls.forEach(el => el.classList.add('visible'));
    }
  }

  /* --- Mobile Nav --- */
  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
      toggle.textContent = nav.classList.contains('mobile-open') ? '\u2715' : '\u2630';
    });
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('mobile-open');
        toggle.textContent = '\u2630';
      });
    });
  }

  /* --- Initialize --- */
  document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    initScrollEffects();
    initMobileNav();

    /* Login modal */
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const closeLogin = document.getElementById('closeLogin');
    const closeRegister = document.getElementById('closeRegister');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginBtn) loginBtn.addEventListener('click', () => openModal('loginModal'));
    if (registerBtn) registerBtn.addEventListener('click', () => openModal('registerModal'));
    if (closeLogin) closeLogin.addEventListener('click', () => closeModal('loginModal'));
    if (closeRegister) closeRegister.addEventListener('click', () => closeModal('registerModal'));

    if (switchToRegister) switchToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal('loginModal');
      setTimeout(() => openModal('registerModal'), 200);
    });
    if (switchToLogin) switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal('registerModal');
      setTimeout(() => openModal('loginModal'), 200);
    });

    /* Close modal on overlay click */
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllModals();
      });
    });

    /* Close modal on Escape */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllModals();
    });

    /* Login form */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value.trim();
        const password = loginForm.querySelector('input[type="password"]').value;
        const errEl = loginForm.querySelector('.form-error');

        if (!email || !password) {
          if (errEl) { errEl.textContent = '请填写所有字段'; errEl.classList.add('visible'); }
          return;
        }
        const result = Auth.login(email, password);
        if (!result.ok) {
          if (errEl) { errEl.textContent = result.msg; errEl.classList.add('visible'); }
          return;
        }
        if (errEl) errEl.classList.remove('visible');
        closeModal('loginModal');
        updateAuthUI();
        showToast('登录成功，欢迎回来 ' + result.user.username + '！', 'success');
        loginForm.reset();
      });
    }

    /* Register form */
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputs = registerForm.querySelectorAll('input');
        const username = inputs[0].value.trim();
        const email = inputs[1].value.trim();
        const password = inputs[2].value;
        const confirm = inputs[3].value;
        const errEl = registerForm.querySelector('.form-error');

        if (!username || !email || !password || !confirm) {
          if (errEl) { errEl.textContent = '请填写所有字段'; errEl.classList.add('visible'); }
          return;
        }
        if (password.length < 6) {
          if (errEl) { errEl.textContent = '密码至少需要 6 位字符'; errEl.classList.add('visible'); }
          return;
        }
        if (password !== confirm) {
          if (errEl) { errEl.textContent = '两次输入的密码不一致'; errEl.classList.add('visible'); }
          return;
        }
        const result = Auth.register(username, email, password);
        if (!result.ok) {
          if (errEl) { errEl.textContent = result.msg; errEl.classList.add('visible'); }
          return;
        }
        if (errEl) errEl.classList.remove('visible');
        closeModal('registerModal');
        updateAuthUI();
        showToast('注册成功，欢迎加入 NEXUS ARCADE！', 'success');
        registerForm.reset();
      });
    }

    /* Logout */
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.logout();
        updateAuthUI();
        showToast('已退出登录', 'success');
      });
    }

    /* Smooth scroll for anchor links */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  });
})();
