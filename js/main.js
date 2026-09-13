/* =================================================================
   PVC ID DESIGN STUDIO - INTERACTIVE APPLICATION LOGIC
   ================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Dynamic Config Binding
    initDynamicBindings();

    // 2. Render Services Cards
    renderServices();

    // 3. Render Portfolio / Sample Cards
    renderPortfolio('all');

    // 4. Render Pricing Packages
    renderPricing();

    // 5. Render Payment Methods
    renderPaymentMethods();

    // 6. Render FAQ Accordion
    renderFAQs();

    // 7. Setup Event Handlers (Nav, Portfolio Filter, Accordion, Forms)
    setupNavigation();
    setupPortfolioFilters();
    setupFileUpload();
    setupFormHandlers();
    setupModalHandlers();
});

/* -------------------------------------------------------------
   1. DYNAMIC CONFIG BINDINGS
   ------------------------------------------------------------- */
function initDynamicBindings() {
    if (typeof CONFIG === 'undefined') return;

    // Bind data-config elements
    document.querySelectorAll('[data-config]').forEach(el => {
        const keyPath = el.getAttribute('data-config');
        const value = getNestedValue(CONFIG, keyPath);
        if (value) {
            el.textContent = value;
        }
    });

    // Update current year
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Bind contact email mailto link
    const emailLink = document.getElementById('contactEmailLink');
    if (emailLink && CONFIG.business && CONFIG.business.email) {
        emailLink.href = `mailto:${CONFIG.business.email}`;
    }
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/* -------------------------------------------------------------
   2. RENDER SERVICES
   ------------------------------------------------------------- */
function renderServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid || !CONFIG.services) return;

    grid.innerHTML = CONFIG.services.map(svc => `
        <div class="service-card">
            <div>
                <div class="service-icon">
                    ${getServiceIconSvg(svc.icon)}
                </div>
                <h3 class="service-title">${svc.title}</h3>
                <p class="service-desc">${svc.description}</p>
            </div>
            <div class="service-footer">
                <span class="service-price">${svc.startingPrice}</span>
                <a href="#order" class="btn btn-secondary btn-sm" onclick="selectServiceInForm('${svc.title}')">Select</a>
            </div>
        </div>
    `).join('');
}

function getServiceIconSvg(iconType) {
    switch(iconType) {
        case 'palette':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.72 1.7-1.61 0-.43-.17-.83-.44-1.12-.27-.29-.44-.69-.44-1.12 0-.89.72-1.61 1.61-1.61h1.9c3.09 0 5.67-2.58 5.67-5.67 0-4.93-4.07-8.87-9-8.87z"/></svg>`;
        case 'edit-3':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
        case 'briefcase':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
        case 'award':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>`;
        case 'credit-card':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`;
        case 'calendar':
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
        default:
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
    }
}

/* -------------------------------------------------------------
   3. RENDER PORTFOLIO
   ------------------------------------------------------------- */
function renderPortfolio(categoryFilter = 'all') {
    const grid = document.getElementById('portfolioGrid');
    if (!grid || !CONFIG.portfolio) return;

    const filtered = categoryFilter === 'all'
        ? CONFIG.portfolio
        : CONFIG.portfolio.filter(item => item.category === categoryFilter);

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No samples found in this category.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <div class="portfolio-card" data-category="${item.category}">
            <div class="portfolio-preview-box">
                <div class="card-sample-mockup" style="border-left-color: ${item.accentColor};">
                    <div style="display:flex; justify-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:0.25rem;">
                        <span style="font-size:0.65rem; font-weight:800; text-transform:uppercase; color:var(--text-primary);">${item.orgName}</span>
                        <div style="width:16px; height:12px; background:#f59e0b; border-radius:2px;"></div>
                    </div>
                    <div style="display:flex; gap:0.5rem; align-items:center; margin:0.35rem 0;">
                        <div style="width:40px; height:45px; background:#e2e8f0; border-radius:4px; display:flex; align-items:center; justify-content:center;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div>
                            <div style="font-size:0.8rem; font-weight:700; color:var(--text-primary);">${item.holderName}</div>
                            <div style="font-size:0.68rem; color:${item.accentColor}; font-weight:600;">${item.role}</div>
                            <div style="font-size:0.6rem; color:var(--text-muted);">${item.idNumber}</div>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #e2e8f0; padding-top:0.25rem;">
                        <span class="badge" style="background:#eff6ff; color:var(--accent-color); font-size:0.6rem;">${item.type}</span>
                        <div style="height:10px; width:60px; background:repeating-linear-gradient(90deg, #1e293b, #1e293b 2px, #fff 2px, #fff 4px);"></div>
                    </div>
                </div>
            </div>
            <div class="portfolio-body">
                <div>
                    <span class="portfolio-category-tag">${item.category}</span>
                    <h3 class="portfolio-title">${item.title}</h3>
                    <p class="portfolio-info">${item.frontImageText} • Theme: ${item.theme}</p>
                </div>
                <div class="portfolio-card-actions">
                    <a href="#order" class="btn btn-primary btn-sm btn-block" onclick="selectServiceInForm('${item.title} Sample Layout')">Order Similar Design</a>
                </div>
            </div>
        </div>
    `).join('');
}

/* -------------------------------------------------------------
   4. RENDER PRICING
   ------------------------------------------------------------- */
function renderPricing() {
    const grid = document.getElementById('pricingGrid');
    if (!grid || !CONFIG.pricing) return;

    grid.innerHTML = CONFIG.pricing.map(pkg => `
        <div class="pricing-card ${pkg.popular ? 'featured' : ''}">
            ${pkg.badge ? `<div class="pricing-badge">${pkg.badge}</div>` : ''}
            <h3 class="pricing-title">${pkg.title}</h3>
            <div class="pricing-price">${pkg.price}</div>
            <div class="pricing-period">${pkg.period}</div>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">${pkg.description}</p>
            <ul class="pricing-features">
                ${pkg.features.map(feat => `
                    <li>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        ${feat}
                    </li>
                `).join('')}
            </ul>
            <a href="#order" class="btn ${pkg.popular ? 'btn-primary' : 'btn-secondary'} btn-block" onclick="selectServiceInForm('${pkg.title}')">${pkg.ctaText}</a>
        </div>
    `).join('');
}

/* -------------------------------------------------------------
   5. RENDER PAYMENT METHODS
   ------------------------------------------------------------- */
function renderPaymentMethods() {
    const grid = document.getElementById('paymentGrid');
    if (!grid || !CONFIG.payment) return;

    const p = CONFIG.payment;

    grid.innerHTML = `
        <!-- GCash Card -->
        <div class="payment-card">
            <div class="payment-card-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="10" y2="8"/><line x1="6" y1="12" x2="14" y2="12"/></svg>
                GCash Payment
            </div>
            <div class="payment-details-list">
                <div class="payment-field">
                    <strong>Account Name:</strong>
                    <code>${p.gcash.accountName}</code>
                </div>
                <div class="payment-field">
                    <strong>GCash Number:</strong>
                    <code>${p.gcash.accountNumber}</code>
                </div>
                <p style="font-size:0.8rem; margin-top:0.75rem; color:var(--text-muted);">${p.gcash.instructions}</p>
            </div>
        </div>

        <!-- Maya Card -->
        <div class="payment-card">
            <div class="payment-card-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Maya Payment
            </div>
            <div class="payment-details-list">
                <div class="payment-field">
                    <strong>Account Name:</strong>
                    <code>${p.maya.accountName}</code>
                </div>
                <div class="payment-field">
                    <strong>Maya Number:</strong>
                    <code>${p.maya.accountNumber}</code>
                </div>
                <p style="font-size:0.8rem; margin-top:0.75rem; color:var(--text-muted);">${p.maya.instructions}</p>
            </div>
        </div>

        <!-- Bank Transfer Card -->
        <div class="payment-card">
            <div class="payment-card-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="12 3 3 10 21 10"/></svg>
                Bank Transfer
            </div>
            <div class="payment-details-list">
                <div class="payment-field">
                    <strong>Bank Name:</strong>
                    <code>${p.bank.bankName}</code>
                </div>
                <div class="payment-field">
                    <strong>Account Name:</strong>
                    <code>${p.bank.accountName}</code>
                </div>
                <div class="payment-field">
                    <strong>Account Number:</strong>
                    <code>${p.bank.accountNumber}</code>
                </div>
                <p style="font-size:0.8rem; margin-top:0.75rem; color:var(--text-muted);">${p.bank.instructions}</p>
            </div>
        </div>
    `;
}

/* -------------------------------------------------------------
   6. RENDER FAQ ACCORDION
   ------------------------------------------------------------- */
function renderFAQs() {
    const accordion = document.getElementById('faqAccordion');
    if (!accordion || !CONFIG.faqs) return;

    accordion.innerHTML = CONFIG.faqs.map((faq, index) => `
        <div class="faq-item">
            <button class="faq-question" aria-expanded="false" onclick="toggleFaq(${index})">
                <span>${faq.question}</span>
                <svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="faq-answer">
                <p style="padding-top: 0.5rem;">${faq.answer}</p>
            </div>
        </div>
    `).join('');
}

function toggleFaq(index) {
    const items = document.querySelectorAll('.faq-item');
    items.forEach((item, i) => {
        if (i === index) {
            const isActive = item.classList.contains('active');
            item.classList.toggle('active');
            const btn = item.querySelector('.faq-question');
            if (btn) btn.setAttribute('aria-expanded', !isActive);
        } else {
            item.classList.remove('active');
            const btn = item.querySelector('.faq-question');
            if (btn) btn.setAttribute('aria-expanded', 'false');
        }
    });
}

/* -------------------------------------------------------------
   7. EVENT HANDLERS & NAVIGATION
   ------------------------------------------------------------- */
function setupNavigation() {
    const toggle = document.getElementById('mobileNavToggle');
    const links = document.getElementById('navLinks');

    if (toggle && links) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('active');
        });

        // Close mobile nav when link clicked
        links.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                links.classList.remove('active');
            });
        });
    }

    // Active link highlighting on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.pageYOffset;

        sections.forEach(sec => {
            const secHeight = sec.offsetHeight;
            const secTop = sec.offsetTop - 100;
            const secId = sec.getAttribute('id');
            const navLink = document.querySelector(`.nav-links a[href*=${secId}]`);

            if (navLink) {
                if (scrollY > secTop && scrollY <= secTop + secHeight) {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            }
        });
    });
}

function setupPortfolioFilters() {
    const filterContainer = document.getElementById('portfolioFilter');
    if (!filterContainer) return;

    filterContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            filterContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const cat = e.target.getAttribute('data-filter');
            renderPortfolio(cat);
        }
    });
}

function selectServiceInForm(serviceName) {
    const select = document.getElementById('serviceType');
    if (select) {
        // Try exact option match or prefill custom preference
        let matched = false;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].text.toLowerCase().includes(serviceName.toLowerCase())) {
                select.selectedIndex = i;
                matched = true;
                break;
            }
        }
        if (!matched) {
            const prefInput = document.getElementById('designPreference');
            if (prefInput) prefInput.value = `Selected Service: ${serviceName}`;
        }
    }
}

/* -------------------------------------------------------------
   8. FILE UPLOAD DRAG AND DROP
   ------------------------------------------------------------- */
function setupFileUpload() {
    const box = document.getElementById('fileUploadBox');
    const input = document.getElementById('fileInput');
    const list = document.getElementById('fileList');

    if (!box || !input) return;

    box.addEventListener('click', () => input.click());

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        box.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        box.addEventListener(eventName, () => box.style.borderColor = 'var(--accent-color)', false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        box.addEventListener(eventName, () => box.style.borderColor = 'var(--border-color)', false);
    });

    box.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        input.files = files;
        updateFileList(files, list);
    });

    input.addEventListener('change', () => {
        updateFileList(input.files, list);
    });
}

function updateFileList(files, listElement) {
    if (!listElement) return;
    if (!files || files.length === 0) {
        listElement.innerHTML = '';
        return;
    }

    const fileNames = Array.from(files).map(f => f.name).join(', ');
    listElement.innerHTML = `✓ Attached Files (${files.length}): ${fileNames}`;
}

/* -------------------------------------------------------------
   9. FORM HANDLERS & MODAL SYSTEM
   ------------------------------------------------------------- */
function setupFormHandlers() {
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const clientName = document.getElementById('clientName').value.trim();
            const clientEmail = document.getElementById('clientEmail').value.trim();
            const serviceType = document.getElementById('serviceType').value;
            const orgName = document.getElementById('orgName').value.trim();
            const requiredText = document.getElementById('requiredText').value.trim();

            if (!clientName || !clientEmail || !serviceType || !orgName || !requiredText) {
                alert('Please complete all required fields marked with an asterisk (*).');
                return;
            }

            // Generate Random Reference ID
            const refId = 'PVC-' + Math.floor(1000 + Math.random() * 9000);

            // Fill Modal Details
            document.getElementById('modalClientName').textContent = clientName;
            document.getElementById('modalClientEmail').textContent = clientEmail;
            document.getElementById('modalServiceType').textContent = serviceType;
            document.getElementById('modalOrgName').textContent = orgName;
            document.getElementById('modalRefId').textContent = `#${refId}`;

            // Open Order Confirmation Modal
            const modal = document.getElementById('orderModal');
            if (modal) modal.classList.add('active');

            // Construct Mailto Backup Link
            const subject = encodeURIComponent(`New ID Design Order Request - ${refId} (${orgName})`);
            const body = encodeURIComponent(
                `ORDER REFERENCE: #${refId}\n\n` +
                `Client Name: ${clientName}\n` +
                `Client Email: ${clientEmail}\n` +
                `Service Type: ${serviceType}\n` +
                `Organization: ${orgName}\n\n` +
                `Required Text Details:\n${requiredText}\n\n` +
                `Please reply with payment confirmation and design proof details.`
            );

            // Optional trigger mailto window
            console.log("Order submitted successfully:", { refId, clientName, clientEmail, serviceType, orgName });
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const msg = document.getElementById('contactMessage').value;

            const targetEmail = CONFIG.business ? CONFIG.business.email : 'contact@pvciddesign.com';
            const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent('Inquiry from Website: ' + name)}&body=${encodeURIComponent('From: ' + name + ' (' + email + ')\n\nMessage:\n' + msg)}`;

            window.location.href = mailtoUrl;
            alert('Opening your email application to send your question directly to us!');
            contactForm.reset();
        });
    }
}

function setupModalHandlers() {
    const modal = document.getElementById('orderModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    const doneBtn = document.getElementById('modalDoneBtn');
    const paymentBtn = document.getElementById('modalPaymentBtn');

    const closeModal = () => {
        if (modal) modal.classList.remove('active');
        const form = document.getElementById('orderForm');
        if (form) form.reset();
        const fileList = document.getElementById('fileList');
        if (fileList) fileList.innerHTML = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (doneBtn) doneBtn.addEventListener('click', closeModal);
    if (paymentBtn) paymentBtn.addEventListener('click', closeModal);
}
