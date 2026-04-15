// ========== GOOGLE CLIENT ID ==========
const MY_CLIENT_ID = "556226911506-s859prkmlvqe54slrcfek6cdlga1csen.apps.googleusercontent.com";

// ========== SESSION MANAGEMENT ==========
const SESSION_DURATION = 30 * 60 * 1000;
const WARN_BEFORE = 5 * 60 * 1000;

let logoutTimer, warnTimer, warningToast;

function getSession() {
  return sessionStorage.getItem("isLoggedIn") === "true";
}

function startSessionTimer() {
  clearTimeout(logoutTimer);
  clearTimeout(warnTimer);
  if (!getSession()) return;

  warnTimer = setTimeout(() => {
    showSessionWarning();
  }, SESSION_DURATION - WARN_BEFORE);

  logoutTimer = setTimeout(() => {
    autoLogout();
  }, SESSION_DURATION);
}

function resetSessionTimer() {
  if (!getSession()) return;
  startSessionTimer();
}

function showSessionWarning() {
  if (warningToast) return;

  const icon = document.createElement("i");
  icon.className = "fas fa-clock";

  const text = document.createElement("span");
  text.textContent = "You'll be logged out in 5 minutes due to inactivity.";

  const stayBtn = document.createElement("button");
  stayBtn.textContent = "Stay logged in";
  stayBtn.addEventListener("click", () => {
    resetSessionTimer();
    warningToast.remove();
    warningToast = null;
  });

  warningToast = document.createElement("div");
  warningToast.id = "session-warning";
  warningToast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:#1c1c1c;border:1px solid #ffaa00;color:#ffaa00;
    padding:12px 20px;border-radius:10px;display:flex;align-items:center;
    gap:12px;z-index:9999;font-size:0.85rem;box-shadow:0 8px 32px rgba(0,0,0,0.6);
    animation:slideUp 0.3s ease;`;
  warningToast.appendChild(icon);
  warningToast.appendChild(text);
  warningToast.appendChild(stayBtn);
  document.body.appendChild(warningToast);
}

function autoLogout() {
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("loginTime");
  if (warningToast) {
    warningToast.remove();
    warningToast = null;
  }

  const bannerIcon = document.createElement("i");
  bannerIcon.className = "fas fa-lock";

  const bannerText = document.createElement("span");
  bannerText.textContent = " Session expired. Please log in again.";

  const bannerLink = document.createElement("a");
  bannerLink.href = "login.html";
  bannerLink.textContent = "Login";
  bannerLink.style.cssText = "color:#3dffa0;margin-left:10px;font-weight:700;";

  const banner = document.createElement("div");
  banner.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:#1c1c1c;border:1px solid #3dffa0;color:#e8e8e8;
    padding:14px 24px;border-radius:10px;display:flex;align-items:center;
    gap:10px;z-index:9999;font-size:0.85rem;box-shadow:0 8px 32px rgba(0,0,0,0.6);`;
  banner.appendChild(bannerIcon);
  banner.appendChild(bannerText);
  banner.appendChild(bannerLink);
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 6000);

  const btn = document.getElementById("authBtn");
  if (btn) {
    btn.textContent = "Login/Register";
    btn.href = "register.html";
    btn.onclick = null;
  }
}

["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(evt => {
  document.addEventListener(evt, resetSessionTimer, { passive: true });
});

function checkAuth() {
  const page = (window.location.pathname.split("/").pop() || "index.html");
  const loggedIn = getSession();
  const publicAuthPages = ["register.html", "login.html"];

  if (publicAuthPages.includes(page) && loggedIn) {
    window.location.href = "portfolio.html";
  }

  if (loggedIn) startSessionTimer();
}
checkAuth();

// ========== GOOGLE SIGN-IN ==========
window.onload = function () {
  if (typeof google !== "undefined" && google.accounts) {
    google.accounts.id.initialize({
      client_id: MY_CLIENT_ID,
      callback: handleCredentialResponse
    });
    const googleBtnDiv = document.getElementById("googleBtn");
    if (googleBtnDiv) {
      google.accounts.id.renderButton(googleBtnDiv, {
        theme: "outline",
        size: "large",
        width: "100%",
        shape: "pill"
      });
    }
  }
  
  // Run page-specific initializations
  initHomePage();
  initAboutPage();
  initContactPage();
  initPortfolioPage();
  initLoginPage();
  initRegisterPage();
  initMobileMenu();
};

function handleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  const googleUser = {
    fullname: payload.name,
    email: payload.email,
    password: "google-auth-user"
  };
  sessionStorage.setItem("userAccount", JSON.stringify(googleUser));
  sessionStorage.setItem("isLoggedIn", "true");
  sessionStorage.setItem("loginTime", Date.now().toString());
  startSessionTimer();

  const fullNameInput = document.getElementById("fullname");
  if (fullNameInput) {
    fullNameInput.value = payload.name;
    document.getElementById("email").value = payload.email;
  } else {
    window.location.href = "portfolio.html";
  }
}

// ========== LOGIN FORM ==========
document.getElementById("loginForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const emailInput = (document.getElementById("loginUser") || document.getElementById("username"))?.value?.trim();
  const passInput = (document.getElementById("loginPass") || document.getElementById("password"))?.value;

  const stored = JSON.parse(sessionStorage.getItem("userAccount") || localStorage.getItem("userAccount") || "null");

  if (!stored) {
    showAuthError("No account found. Please register first.");
    return;
  }
  if (emailInput !== stored.email) {
    showAuthError("Invalid email or password.");
    return;
  }
  if (passInput !== stored.password) {
    showAuthError("Invalid email or password.");
    return;
  }

  sessionStorage.setItem("isLoggedIn", "true");
  sessionStorage.setItem("loginTime", Date.now().toString());
  startSessionTimer();

  const redirect = sessionStorage.getItem("redirectAfterLogin") || "portfolio.html";
  sessionStorage.removeItem("redirectAfterLogin");
  window.location.href = redirect;
});

// ========== REGISTER FORM ==========
document.getElementById("registerForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const fullName = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("regPassword").value;

  if (pass.length < 8) {
    showAuthError("Password must be at least 8 characters.");
    return;
  }

  const newUser = { fullname: fullName, email: email, password: pass };
  sessionStorage.setItem("userAccount", JSON.stringify(newUser));
  localStorage.setItem("userAccount", JSON.stringify(newUser));
  window.location.href = "login.html";
});

function showAuthError(msg) {
  const el = document.getElementById("authError");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
  el.style.cssText += "color:#ff5555;background:rgba(255,85,85,0.08);border:1px solid rgba(255,85,85,0.3);padding:10px 14px;border-radius:8px;margin-bottom:14px;font-size:0.85rem;";
}

function logout() {
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("loginTime");
  clearTimeout(logoutTimer);
  clearTimeout(warnTimer);
  if (typeof google !== "undefined" && google.accounts) {
    google.accounts.id.disableAutoSelect();
  }
  window.location.href = "index.html";
}

function requireLogin(redirectUrl) {
  if (getSession()) return true;

  if (redirectUrl) {
    sessionStorage.setItem("redirectAfterLogin", redirectUrl);
  } else {
    sessionStorage.setItem("redirectAfterLogin", window.location.href);
  }

  showLoginPrompt();
  return false;
}

function showLoginPrompt() {
  if (document.getElementById("login-prompt-overlay")) return;

  const lockIcon = document.createElement("i");
  lockIcon.className = "fas fa-lock";

  const iconBubble = document.createElement("div");
  iconBubble.style.cssText = `width:56px;height:56px;border-radius:50%;
    background:rgba(61,255,160,0.1);border:1.5px solid rgba(61,255,160,0.3);
    display:flex;align-items:center;justify-content:center;
    margin:0 auto 18px;font-size:1.4rem;color:#3dffa0;`;
  iconBubble.appendChild(lockIcon);

  const heading = document.createElement("h3");
  heading.textContent = "Login Required";
  heading.style.cssText = "color:#e8e8e8;margin:0 0 8px;font-size:1.1rem;";

  const body = document.createElement("p");
  body.textContent = "You need to be logged in to access this. It's quick — sign in or create a free account.";
  body.style.cssText = "color:#888;font-size:0.85rem;margin:0 0 24px;line-height:1.5;";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText = `padding:10px 20px;border-radius:8px;
    border:1px solid rgba(255,255,255,0.12);background:transparent;
    color:#aaa;cursor:pointer;font-size:0.85rem;font-family:inherit;`;
  cancelBtn.addEventListener("click", () => overlay.remove());

  const loginIcon = document.createElement("i");
  loginIcon.className = "fas fa-sign-in-alt";

  const loginLink = document.createElement("a");
  loginLink.href = "login.html";
  loginLink.style.cssText = `padding:10px 24px;border-radius:8px;background:#3dffa0;
    color:#0a0a0a;font-weight:700;font-size:0.85rem;text-decoration:none;
    display:inline-flex;align-items:center;gap:6px;`;
  loginLink.appendChild(loginIcon);
  loginLink.appendChild(document.createTextNode(" Login"));

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;gap:10px;justify-content:center;";
  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(loginLink);

  const registerLink = document.createElement("a");
  registerLink.href = "register.html";
  registerLink.textContent = "Register free";
  registerLink.style.color = "#3dffa0";

  const registerNote = document.createElement("p");
  registerNote.style.cssText = "color:#555;font-size:0.75rem;margin:16px 0 0;";
  registerNote.appendChild(document.createTextNode("No account? "));
  registerNote.appendChild(registerLink);

  const card = document.createElement("div");
  card.style.cssText = `background:#141414;border:1px solid rgba(61,255,160,0.25);
    border-radius:16px;padding:36px 32px;max-width:360px;width:90%;text-align:center;
    box-shadow:0 24px 64px rgba(0,0,0,0.7);animation:slideUp 0.3s ease;`;
  card.appendChild(iconBubble);
  card.appendChild(heading);
  card.appendChild(body);
  card.appendChild(btnRow);
  card.appendChild(registerNote);

  const overlay = document.createElement("div");
  overlay.id = "login-prompt-overlay";
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9998;
    display:flex;align-items:center;justify-content:center;
    backdrop-filter:blur(4px);animation:fadeIn 0.2s ease;`;
  overlay.appendChild(card);

  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
}

document.addEventListener("DOMContentLoaded", () => {
  const authBtn = document.getElementById("authBtn");
  if (!authBtn) return;

  if (getSession()) {
    authBtn.textContent = "Logout";
    authBtn.href = "#";
    authBtn.onclick = function (e) {
      e.preventDefault();
      logout();
    };
  } else {
    authBtn.textContent = "Login/Register";
    authBtn.href = "register.html";
    authBtn.onclick = null;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".card-link, .visit-toggle").forEach(el => {
    el.addEventListener("click", function (e) {
      if (!getSession()) {
        e.preventDefault();
        e.stopPropagation();
        showLoginPrompt();
      }
    });
  });
});

function parseJwt(token) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(decodeURIComponent(
    window.atob(base64).split("").map(c =>
      "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
    ).join("")
  ));
}

// ========== PROJECTS DATA ==========
const PROJECTS = [
  { badge: "PETA 2", code: "WS-L1.1S-OPB", title: "my_plainstatic_page", images: ["images/project2/p2.png"] },
  { badge: "PETA 3", code: "WS-L1.2S-OPB", title: "my_enhanstatic_page", images: ["images/project3/p3.png", "images/project3/p3b.png"] },
  { badge: "PETA 4", code: "WS-L1.1S-OPB", title: "My Home & Story Page", images: ["images/project4/p4.png", "images/project4/p4b.png", "images/project4/p4c.png", "images/project4/p4d.png", "images/project4/p4e.png", "images/project4/p4f.png", "images/project4/p4g.png"] },
  { badge: "PETA 5", code: "WS101 L3S-OB", title: "Educational Portfolio Website", images: ["images/project5/p5.png", "images/project5/p5b.png", "images/project5/p5c.png", "images/project5/p5d.png", "images/project5/p5e.png"] },
  { badge: "PETA 6", code: "EXP_OB&WO-UCEPW", title: "User-Centered Educational Portfolio", images: ["images/project6/p6.png", "images/project6/p6b.png", "images/project6/p6c.png", "images/project6/p6d.png", "images/project6/p6e.png"] },
  { badge: "PETA 7", code: "WS101 PTL4_01", title: "Educational / Assistance Tool", images: ["images/project7/p7.png", "images/project7/p7b.png", "images/project7/p7c.png", "images/project7/p7d.png", "images/project7/p7e.png", "images/project7/p7f.png", "images/project7/p7g.png", "images/project7/p7h.png", "images/project7/p7i.png", "images/project7/p7j.png", "images/project7/p7k.png", "images/project7/p7l.png"] },
  { badge: "PETA 8", code: "WS101-PTL5-M", title: "Basic Login Page", images: ["images/project8/p8.png"] },
  { badge: "PETA 9", code: "WS101-PTL5.2-M", title: "Advanced Login + Registration Form", images: ["images/project9/p9.png", "images/project9/p9b.png"] },
  { badge: "Final PETA", code: "EXM_OB-EEPW", title: "Enhanced Educational Portfolio Website", images: ["images/project10/p10.png", "images/project10/p10b.png", "images/project10/p10c.png", "images/project10/p10d.png", "images/project10/p10e.png", "images/project10/p10f.png", "images/project10/p10g.png", "images/project10/p10h.png"] }
];

const cIdx = {};

function slideOf(carousel) {
  return cIdx[carousel.dataset.idx] || 0;
}

function setSlide(carousel, n) {
  const idx = carousel.dataset.idx;
  const total = carousel.querySelectorAll(".p-carousel-slide").length;
  if (total <= 1) return;
  n = ((n % total) + total) % total;
  cIdx[idx] = n;
  carousel.querySelector(".p-carousel-track").style.transform = `translateX(-${n * 100}%)`;
  carousel.querySelectorAll(".p-dot").forEach((d, i) => d.classList.toggle("active", i === n));
  const cnt = carousel.querySelector(".p-count");
  if (cnt) cnt.textContent = `${n + 1} / ${total}`;
}

function goSlide(e, btn, dir) {
  e.stopPropagation();
  const c = btn.closest(".p-carousel");
  setSlide(c, (cIdx[c.dataset.idx] || 0) + dir);
}

let lbP = 0, lbI = 0;

function openLb(projIdx, imgIdx) {
  lbP = projIdx;
  lbI = imgIdx || 0;
  refreshLb();
  document.getElementById("lightbox").classList.add("open");
  document.body.style.overflow = "hidden";
}

function refreshLb() {
  const p = PROJECTS[lbP];
  const total = p.images.length;
  document.getElementById("lb-img").src = p.images[lbI];
  document.getElementById("lb-img").alt = p.title;
  document.getElementById("lb-badge").textContent = p.badge;
  document.getElementById("lb-code").textContent = p.code;
  document.getElementById("lb-title").textContent = p.title;
  document.getElementById("lb-counter").textContent = total > 1 ? `${lbI + 1} / ${total}` : "";
  document.getElementById("lb-prev").style.display = total > 1 ? "" : "none";
  document.getElementById("lb-next").style.display = total > 1 ? "" : "none";
}

function lbNav(dir) {
  const imgs = PROJECTS[lbP].images;
  lbI = ((lbI + dir) + imgs.length) % imgs.length;
  refreshLb();
}

function closeLb() {
  document.getElementById("lightbox")?.classList.remove("open");
  document.body.style.overflow = "";
}

function closeLbOutside(e) {
  if (e.target === document.getElementById("lightbox")) closeLb();
}

document.addEventListener("keydown", e => {
  if (!document.getElementById("lightbox")?.classList.contains("open")) return;
  if (e.key === "Escape") closeLb();
  if (e.key === "ArrowLeft") lbNav(-1);
  if (e.key === "ArrowRight") lbNav(+1);
});

// ========== PORTFOLIO PAGE INIT ==========
function initPortfolioPage() {
  document.querySelectorAll(".show-more").forEach(btn => {
    btn.addEventListener("click", () => {
      const desc = btn.closest(".p-info").querySelector(".description");
      const open = desc.classList.toggle("active");
      btn.textContent = open ? "Hide" : "Details";
    });
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => {
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
        }, i * 55);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.07 });

  document.querySelectorAll(".project-card, .media-box").forEach(c => {
    c.style.opacity = "0";
    c.style.transform = "translateY(16px)";
    c.style.transition = "opacity 0.45s ease, transform 0.45s ease, border-color 0.3s, box-shadow 0.3s";
    obs.observe(c);
  });

  document.querySelectorAll(".visit-toggle").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!getSession()) {
        showLoginPrompt();
        return;
      }
      const menu = btn.nextElementSibling;
      const isOpen = menu.style.display === "block";
      document.querySelectorAll(".visit-menu").forEach(m => m.style.display = "none");
      menu.style.display = isOpen ? "none" : "block";
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".visit-menu").forEach(m => m.style.display = "none");
  });

  // Video selector
  const vidSelect = document.getElementById('vid-select');
  if (vidSelect) {
    vidSelect.addEventListener('change', function () {
      const opt = this.options[this.selectedIndex];
      const video = document.getElementById('main-video');
      const src = document.getElementById('main-video-src');
      src.src = opt.value;
      video.load();
      document.getElementById('vid-title').textContent = opt.dataset.title;
      document.getElementById('vid-subtitle').textContent = opt.dataset.sub;
    });
  }
}

// ========== HOME PAGE INIT ==========
function initHomePage() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => {
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
        }, i * 80);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".stat-item").forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(16px)";
    el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    observer.observe(el);
  });
}

// ========== ABOUT PAGE INIT ==========
function initAboutPage() {
  const bars = document.querySelectorAll(".skill-bar");
  const bObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("animate"); bObs.unobserve(e.target); }
    });
  }, { threshold: 0.3 });
  bars.forEach(b => bObs.observe(b));

  const cObs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => {
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
        }, i * 60);
        cObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".skill-card").forEach(c => {
    c.style.opacity = "0";
    c.style.transform = "translateY(14px)";
    c.style.transition = "opacity 0.4s ease, transform 0.4s ease, border-color 0.28s, box-shadow 0.28s";
    cObs.observe(c);
  });
}

// ========== CONTACT PAGE INIT ==========
function initContactPage() {
  const fullname = document.getElementById('fullname');
  const email = document.getElementById('email');
  const subject = document.getElementById('subject');
  const message = document.getElementById('message');
  
  if (fullname) fullname.addEventListener('blur', () => validateContact('fullname','fullname-err', v => v.length > 0));
  if (email) email.addEventListener('blur', () => validateContact('email','email-err', v => isEmailContact(v)));
  if (subject) subject.addEventListener('blur', () => validateContact('subject','subject-err', v => v.length > 0));
  if (message) message.addEventListener('blur', () => validateContact('message','message-err', v => v.length >= 10));
  
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.onclick = handleSubmit;
  }
}

function validateContact(id, errId, fn) {
  const el = document.getElementById(id);
  const err = document.getElementById(errId);
  const ok = fn(el.value.trim());
  if (el) el.classList.toggle('error', !ok);
  if (err) err.classList.toggle('show', !ok);
  return ok;
}

function isEmailContact(v) { 
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); 
}

async function handleSubmit() {
  const ok = [
    validateContact('fullname', 'fullname-err', v => v.length > 0),
    validateContact('email',    'email-err',    v => isEmailContact(v)),
    validateContact('subject',  'subject-err',  v => v.length > 0),
    validateContact('message',  'message-err',  v => v.length >= 10),
  ].every(Boolean);
  
  if (!ok) return;

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  
  const payload = {
    fullname: document.getElementById('fullname').value.trim(),
    email: document.getElementById('email').value.trim(),
    subject: document.getElementById('subject').value.trim(),
    message: document.getElementById('message').value.trim()
  };

  try {
    const response = await fetch('php/api_contact.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';

    if (response.ok) {
      ['fullname', 'email', 'subject', 'message'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.value = '';
          el.classList.remove('error');
        }
      });
      
      ['fullname-err', 'email-err', 'subject-err', 'message-err'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('show');
      });
      
      const toast = document.getElementById('toast');
      if (toast) {
        toast.innerHTML = '<i class="fas fa-check-circle"></i> ' + result.message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
      }
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    alert('Network error: Could not reach the server.');
  }
}

// ========== LOGIN PAGE INIT ==========
function initLoginPage() {
  const loginUser = document.getElementById('loginUser');
  const loginPass = document.getElementById('loginPass');
  
  if (loginUser) loginUser.addEventListener('blur', () => validateLogin('loginUser','loginUser-err', v => isEmailLogin(v)));
  if (loginPass) loginPass.addEventListener('blur', () => validateLogin('loginPass','loginPass-err', v => v.length > 0));
  
  window.togglePw = function(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    icon.classList.toggle('fa-eye', !isHidden);
    icon.classList.toggle('fa-eye-slash', isHidden);
  };
}

function validateLogin(id, errId, fn) {
  const el = document.getElementById(id);
  const err = document.getElementById(errId);
  const ok = fn(el.value.trim());
  if (el) el.classList.toggle('error', !ok);
  if (err) err.classList.toggle('show', !ok);
  return ok;
}
function isEmailLogin(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

// ========== REGISTER PAGE INIT ==========
function initRegisterPage() {
  const fullname = document.getElementById('fullname');
  const email = document.getElementById('email');
  const regPassword = document.getElementById('regPassword');
  const confirmPass = document.getElementById('confirmPass');
  
  if (fullname) fullname.addEventListener('blur', () => validateReg('fullname', 'fullname-err', v => v.length > 0));
  if (email) email.addEventListener('blur', () => validateReg('email', 'email-err', v => isEmailReg(v)));
  if (regPassword) regPassword.addEventListener('blur', () => validateReg('regPassword', 'pass-err', v => v.length >= 8));
  if (confirmPass) confirmPass.addEventListener('blur', () => {
    const pass = document.getElementById('regPassword').value;
    const el = document.getElementById('confirmPass');
    const err = document.getElementById('confirm-err');
    const ok = pass === el.value && el.value.length > 0;
    if (el) el.classList.toggle('error', !ok);
    if (err) err.classList.toggle('show', !ok);
  });
  
  window.checkStrength = function(val) {
    const bar = document.getElementById("strengthBar");
    const lbl = document.getElementById("strengthLabel");
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
      { w:"0%", bg:"transparent", text:"Enter a password" },
      { w:"25%", bg:"#ff5555", text:"Weak" },
      { w:"50%", bg:"#ff9900", text:"Fair" },
      { w:"75%", bg:"#ffdd00", text:"Good" },
      { w:"100%", bg:"#3dffa0", text:"Strong" },
    ];
    const lvl = val.length === 0 ? levels[0] : levels[Math.min(score, 4)];
    if (bar) bar.style.width = lvl.w;
    if (bar) bar.style.background = lvl.bg;
    if (lbl) lbl.textContent = lvl.text;
    if (lbl) lbl.style.color = lvl.bg === "transparent" ? "var(--muted)" : lvl.bg;
  };
  
  window.togglePw = function(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector("i");
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    icon.classList.toggle("fa-eye", !isHidden);
    icon.classList.toggle("fa-eye-slash", isHidden);
  };
}

function validateReg(id, errId, fn) {
  const el = document.getElementById(id);
  const err = document.getElementById(errId);
  const ok = fn(el.value.trim());
  if (el) el.classList.toggle('error', !ok);
  if (err) err.classList.toggle('show', !ok);
  return ok;
}
function isEmailReg(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

// ========== MOBILE MENU ==========
function initMobileMenu() {
  const menuBtn = document.querySelector("#mobile-menu");
  const navListEl = document.querySelector("#nav-list");
  if (menuBtn && navListEl) {
    menuBtn.addEventListener("click", () => {
      navListEl.classList.toggle("active");
      const icon = menuBtn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars");
        icon.classList.toggle("fa-times");
      }
    });
  }
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideUp  { from { transform:translateX(-50%) translateY(16px); opacity:0; } to { transform:translateX(-50%) translateY(0); opacity:1; } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  .skill-bar.animate { width: var(--w) !important; }
`;
document.head.appendChild(style);