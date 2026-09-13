# PVC ID Design Studio - Storefront & Intake Web Template

A modern, trustworthy, conversion-focused website and customer intake system designed for small PVC ID layout and design service providers.

---

## 🌟 Key Features

- **Storefront & Portfolio:** Showcases professional PVC ID layout examples for employee, school, membership, organization, and event cards.
- **Configurable Content System:** All business information, prices, payment details, services, FAQs, and portfolio cards are centralized in `js/config.js`.
- **Primary Conversion Order Intake:** Accessible form collecting service preferences, customer text, organization name, delivery dates, and file upload attachments.
- **Manual Payment Instructions:** Supports GCash, Maya, and Bank Transfer with clearly customizable placeholders.
- **Independent Section Architecture:** Section backgrounds are decoupled from individual components, ensuring zero layout gaps if items are removed.
- **Mobile Responsive & Accessible:** Fully responsive design tested across mobile, tablet, and desktop viewports with accessible semantic markup.

---

## 📁 File Structure

```text
├── index.html        # Main semantic HTML template
├── css/
│   └── style.css     # CSS variables, responsive grid/flex layouts, and PVC card mockups
├── js/
│   ├── config.js     # EDITABLE business settings, pricing, payment details & FAQs
│   └── main.js       # Dynamic UI rendering, portfolio filtering, FAQ accordion & form logic
└── README.md         # Customization documentation
```

---

## 🛠️ How to Customize Business Information (`/js/config.js`)

To adapt this website for your own service business or client, open **`js/config.js`** in any text editor and update the fields described below:

### 1. Business Info & Contact
```javascript
business: {
    name: "Your Studio Name",
    email: "your-email@example.com",
    phone: "+63 917 XXX XXXX",
    hours: "Mon - Sat: 8:00 AM - 6:00 PM (PST)",
    serviceArea: "Nationwide Digital Service"
}
```

### 2. Manual Payment Details
```javascript
payment: {
    gcash: {
        accountName: "JUAN DELA CRUZ",
        accountNumber: "0917-123-4567"
    },
    maya: {
        accountName: "JUAN DELA CRUZ",
        accountNumber: "0917-123-4567"
    },
    bank: {
        bankName: "BDO / BPI",
        accountName: "YOUR BUSINESS NAME",
        accountNumber: "1234-5678-9012"
    }
}
```

### 3. Pricing Packages
Change package titles, prices, descriptions, or feature lists in `CONFIG.pricing`:
```javascript
pricing: [
    {
        title: "Basic ID Layout",
        price: "₱250",
        period: "per layout",
        description: "Clean front side layout for single cards."
    }
]
```

---

## 🚀 How to Run Locally

Since this template is built with standard HTML5, CSS3, and ES6 JavaScript (no Node/React build steps required), simply open `index.html` in any modern browser or host it via Python's HTTP server:

```bash
# Optional local testing server
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

---

## 🔒 Legitimacy Notice

This website template is intended **exclusively** for legitimate identification, membership, school, employee, and organizational ID card layouts. It strictly excludes support or positioning for counterfeit or government ID reproduction.
