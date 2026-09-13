// =================================================================
// PVC ID STUDIO - SITE CONFIGURATION & CONTENT DATA
// =================================================================
// Business owners can easily edit the values below to customize the
// website information, prices, payment details, FAQs, and services.
// =================================================================

const CONFIG = {
    // -------------------------------------------------------------
    // 1. BUSINESS INFORMATION
    // -------------------------------------------------------------
    business: {
        name: "PVC ID Design Studio",
        shortName: "ID Studio",
        tagline: "Professional PVC ID Layouts & Print-Ready Designs",
        email: "contact@pvciddesign.com", // [EDIT HERE] Business Email
        phone: "+63 917 123 4567",         // [EDIT HERE] Business Phone
        hours: "Mon - Sat: 8:00 AM - 6:00 PM (PST)",
        serviceArea: "Nationwide Digital Service (Philippines)",
        turnaroundTime: "24 to 48 Hours Proof Turnaround",
        social: {
            facebook: "https://facebook.com/pvciddesignstudio",
            messenger: "https://m.me/pvciddesignstudio",
            viber: "+639171234567"
        }
    },

    // -------------------------------------------------------------
    // 2. PAYMENT INSTRUCTIONS & PLACEHOLDERS
    // -------------------------------------------------------------
    // Update these placeholders with your actual payment details.
    payment: {
        gcash: {
            accountName: "[EDIT HERE: e.g. JUAN DELA CRUZ]",
            accountNumber: "[EDIT HERE: e.g. 0917-XXX-XXXX]",
            instructions: "Send exact amount via GCash Express Send. Save transaction reference number or screenshot."
        },
        maya: {
            accountName: "[EDIT HERE: e.g. JUAN DELA CRUZ]",
            accountNumber: "[EDIT HERE: e.g. 0917-XXX-XXXX]",
            instructions: "Send payment via Maya Send Money or QR code. Save reference number."
        },
        bank: {
            bankName: "[EDIT HERE: e.g. BDO / BPI / UnionBank]",
            accountName: "[EDIT HERE: e.g. PVC ID DESIGN SERVICES]",
            accountNumber: "[EDIT HERE: e.g. 1234-5678-9012]",
            instructions: "Transfer via online banking or OTC deposit. Send bank receipt screenshot to our email."
        }
    },

    // -------------------------------------------------------------
    // 3. PRICING PACKAGES
    // -------------------------------------------------------------
    // Edit package names, prices, and features here.
    pricing: [
        {
            id: "basic",
            badge: "Popular for Single Cards",
            title: "Basic ID Layout",
            price: "₱250",
            period: "per layout",
            description: "Ideal for quick single-side ID card layout or simple standard card formatting.",
            features: [
                "Clean Front Side Layout",
                "Basic Personalization & Photo Placement",
                "High-Res Print-Ready File (PDF/PNG)",
                "Standard 300 DPI CR80 Size (85.6mm x 53.98mm)",
                "1 Round of Free Revision",
                "24-48 Hour Turnaround"
            ],
            popular: false,
            ctaText: "Select Basic Package"
        },
        {
            id: "custom",
            badge: "Best Value",
            title: "Custom ID Design (Front & Back)",
            price: "₱450",
            period: "per layout design",
            description: "Complete custom front and back PVC ID layout with custom typography and color schemes.",
            features: [
                "Full Front & Back Layout Design",
                "Custom Color Palette & Logo Integration",
                "Includes QR Code / Barcode Formatting",
                "Print-Ready High-Res PDF/PNG/TIFF",
                "2 Rounds of Free Revisions",
                "Fast 24-Hour Express Proof Delivery"
            ],
            popular: true,
            ctaText: "Select Custom Package"
        },
        {
            id: "bulk",
            badge: "Schools & Enterprises",
            title: "Bulk / Organization Orders",
            price: "Custom Quote",
            period: "volume-based discount",
            description: "Tailored for schools, companies, and large organizations needing multi-person template generation.",
            features: [
                "Master ID Template Creation",
                "Data-Driven Bulk ID Personalization",
                "Consistent Formatting Across Hundreds of IDs",
                "Includes Excel/CSV Sheet Data Mapping",
                "Dedicated Designer Support & Multiple Revisions",
                "Custom Turnaround Schedule"
            ],
            popular: false,
            ctaText: "Request Bulk Quote"
        }
    ],

    // -------------------------------------------------------------
    // 4. SERVICES LIST
    // -------------------------------------------------------------
    services: [
        {
            id: "from-scratch",
            icon: "palette",
            title: "PVC ID Layout From Scratch",
            description: "Custom-designed ID layouts starting from your logo, brand guidelines, and requirements.",
            startingPrice: "From ₱250"
        },
        {
            id: "layout-editing",
            icon: "edit-3",
            title: "Existing ID Layout Editing",
            description: "Update existing ID cards with updated details, high-res redraws, or fixed formatting errors.",
            startingPrice: "From ₱150"
        },
        {
            id: "employee-ids",
            icon: "briefcase",
            title: "Employee & Company IDs",
            description: "Sleek, corporate staff badges with security photo areas, department indicators, and barcodes.",
            startingPrice: "From ₱250"
        },
        {
            id: "school-ids",
            icon: "award",
            title: "School & Organization IDs",
            description: "Vibrant and durable layouts for students, teachers, faculty members, and campus visitors.",
            startingPrice: "From ₱250"
        },
        {
            id: "membership-cards",
            icon: "credit-card",
            title: "Membership & Club Cards",
            description: "Premium layouts for gyms, VIP clubs, loyalty programs, and community associations.",
            startingPrice: "From ₱300"
        },
        {
            id: "event-ids",
            icon: "calendar",
            title: "Event & VIP Pass IDs",
            description: "High-visibility badges for conferences, concerts, backstage passes, and security staff.",
            startingPrice: "From ₱200"
        },
        {
            id: "bulk-prep",
            icon: "layers",
            title: "Bulk ID Layout Preparation",
            description: "Batch layout generation mapped from customer spreadsheet data for quick printer handoff.",
            startingPrice: "Contact for Quote"
        }
    ],

    // -------------------------------------------------------------
    // 5. SAMPLE DESIGNS / PORTFOLIO
    // -------------------------------------------------------------
    // Showcase items with fictional names and information.
    portfolio: [
        {
            id: "card-1",
            category: "employee",
            title: "Apex Logistics Employee Badge",
            type: "Corporate ID",
            holderName: "Alexander Hayes",
            role: "Operations Manager",
            orgName: "Apex Logistics Inc.",
            idNumber: "EMP-2025-0842",
            accentColor: "#1e3a8a",
            theme: "Corporate Blue",
            hasBack: true,
            frontImageText: "Corporate Staff ID",
            backDetails: "Emergency Contact: +63 917 000 1111 | If found, please return to Apex HQ, Pasig City."
        },
        {
            id: "card-2",
            category: "school",
            title: "St. Jude Academy Student ID",
            type: "School / Faculty ID",
            holderName: "Sophia Rose Mendoza",
            role: "Grade 11 - STEM",
            orgName: "St. Jude Academy",
            idNumber: "SJA-2024-9102",
            accentColor: "#065f46",
            theme: "Academic Green",
            hasBack: true,
            frontImageText: "Student Pass",
            backDetails: "Valid for Academic Year 2024-2025. Non-transferable."
        },
        {
            id: "card-3",
            category: "membership",
            title: "Aura Fitness Club VIP Card",
            type: "Membership Card",
            holderName: "Marcus Vance",
            role: "VIP Member",
            orgName: "Aura Health & Fitness",
            idNumber: "MEM-77821",
            accentColor: "#7e22ce",
            theme: "VIP Purple",
            hasBack: false,
            frontImageText: "VIP Member Pass",
            backDetails: "Access to all premium branches and spa facilities."
        },
        {
            id: "card-4",
            category: "event",
            title: "TechCon 2025 VIP Speaker Pass",
            type: "Event Access Badge",
            holderName: "Dr. Elena Rostova",
            role: "Keynote Speaker",
            orgName: "TechCon Global 2025",
            idNumber: "SPK-004",
            accentColor: "#b91c1c",
            theme: "Event Red",
            hasBack: true,
            frontImageText: "All Access Speaker",
            backDetails: "Grants access to Stage A, Executive Lounge, and Media Room."
        },
        {
            id: "card-5",
            category: "organization",
            title: "Metro Rescue Volunteer ID",
            type: "Organization ID",
            holderName: "Gabriel Santos",
            role: "Senior First Responder",
            orgName: "Metro Volunteer Corps",
            idNumber: "MVC-8820",
            accentColor: "#c2410c",
            theme: "Safety Orange",
            hasBack: true,
            frontImageText: "Official Volunteer",
            backDetails: "Authorized field team member. Verified Blood Type: O+"
        },
        {
            id: "card-6",
            category: "employee",
            title: "Veritas Medical Center Staff Pass",
            type: "Healthcare Badge",
            holderName: "Dr. Chloe Ramirez, MD",
            role: "Cardiology Dept.",
            orgName: "Veritas Medical Center",
            idNumber: "MED-4091",
            accentColor: "#0284c7",
            theme: "Clean Cyan",
            hasBack: true,
            frontImageText: "Medical Staff ID",
            backDetails: "Restricted Access: Operating Room & ICU Wings."
        }
    ],

    // -------------------------------------------------------------
    // 6. FREQUENTLY ASKED QUESTIONS (FAQ)
    // -------------------------------------------------------------
    faqs: [
        {
            question: "How do I place an order?",
            answer: "Simply scroll to our 'Start Your Order' section, fill in your requirements (service type, text details, quantity, and logo/photo uploads), and click Submit Order Request. You will receive an immediate confirmation on screen and an order summary via email."
        },
        {
            question: "How long does a design take?",
            answer: "Standard initial design proofs are ready within 24 to 48 hours after order details and payment confirmation are received. Express turnaround options are available upon request."
        },
        {
            question: "Can you edit an existing ID layout?",
            answer: "Yes! If you already have a printed card, scanned file, or vector template that needs updates (new employee details, updated logo, or corrected text), select 'Existing ID Layout Editing'."
        },
        {
            question: "Can you create a design completely from scratch?",
            answer: "Absolutely. Provide us with your company/school logo, brand colors, required data fields (e.g. Name, ID number, Department), and any sample preference, and our team will design a clean, professional layout from scratch."
        },
        {
            question: "Do you offer front and back designs?",
            answer: "Yes! Our Custom ID Design package covers both front and back layouts, including barcode/QR code placements, emergency contacts, terms of use, and return address details."
        },
        {
            question: "Do you offer bulk ID order layouts?",
            answer: "Yes. For schools, events, or companies with dozens or hundreds of employees, we set up a master template and map data directly from your Excel or CSV file. Contact us for custom volume pricing."
        },
        {
            question: "How many revisions are included?",
            answer: "Basic layouts include 1 round of revisions, while Custom designs include 2 rounds. Minor typos or color tweaks are always handled promptly to ensure 100% satisfaction before final approval."
        },
        {
            question: "What file format will I receive?",
            answer: "You will receive high-resolution, print-ready files (300 DPI PDF, high-res PNG, or TIFF) formatted to standard CR80 PVC dimensions (85.6mm x 53.98mm with optional bleed guides for PVC printers)."
        },
        {
            question: "Do you print physical PVC cards or only design?",
            answer: "We specialize in digital ID layout design and print-ready prepress files. You can send our print-ready files directly to any local PVC card printer or thermal card printer (Evolis, Zebra, Fargo, Datacard)."
        },
        {
            question: "What payment methods are available?",
            answer: "We support GCash, Maya, and Direct Bank Transfer (BDO, BPI, UnionBank). Complete account details and instructions are shown during checkout and in your order summary."
        },
        {
            question: "What types of identification documents do you accept?",
            answer: "We ONLY accept legitimate organizational, employee, student, membership, event, and club ID design requests. We strictly DO NOT design, alter, or reproduce government-issued IDs, driver's licenses, passports, or official state documents."
        }
    ]
};

// Make CONFIG accessible globally in browser
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
