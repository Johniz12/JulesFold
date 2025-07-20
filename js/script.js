// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add scroll-based animations
const cards = document.querySelectorAll('.card');
const testimonials = document.querySelectorAll('.testimonial-card');

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = `fadeInUp 1s ${entry.target.dataset.delay || ''} forwards`;
        }
    });
}, {
    threshold: 0.1
});

cards.forEach((card, index) => {
    card.dataset.delay = `${index * 0.1}s`;
    observer.observe(card);
});

testimonials.forEach((testimonial, index) => {
    testimonial.dataset.delay = `${index * 0.1}s`;
    observer.observe(testimonial);
});

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;
document.head.appendChild(styleSheet);
