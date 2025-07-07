/*
    Developer Portfolio Website Scripts
    Author: [Your Name] / Jules AI Agent
    Version: 1.0
    ------------------------------------------
    NOTE FOR PRODUCTION:
    Consider minifying this JavaScript file to reduce its size and improve loading times.
    Tools like UglifyJS, Terser, or esbuild can be used.
    ------------------------------------------
*/

// Basic JavaScript for future interactivity (e.g., animations, carousel)

document.addEventListener('DOMContentLoaded', function() {
    console.log('Portfolio website loaded successfully!');

    // Example: Smooth scroll for navigation links (can be expanded)
    const navLinks = document.querySelectorAll('header nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Basic check if it's an on-page link
            if (this.hash !== "") {
                // Check if the target element exists on the current page
                const targetElement = document.querySelector(this.hash);
                if (targetElement) {
                    // Prevent default anchor click behavior
                    e.preventDefault();
                    // Smooth scroll to target
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
                // If it's a link to another page, let the default behavior happen
            }
        });
    });

    // Placeholder for fade-in/slide-up animations
    // This is a very basic example. A library like AOS (Animate On Scroll) or Intersection Observer API would be better for more complex animations.
const elementsToAnimate = document.querySelectorAll('.hero, .main-content, .sidebar, .project-card, .testimonial-card');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                // Optional: unobserve after animation
                // observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 }); // Trigger when 10% of the element is visible

    elementsToAnimate.forEach(el => {
        el.style.opacity = 0; // Start transparent
        el.style.transform = 'translateY(20px)'; // Start slightly down
        el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        observer.observe(el);
    });

});

// Placeholder for carousel functionality
// This will be implemented in later steps for Projects and Testimonials sections
// For now, this is just a conceptual placeholder.
function initCarousel(carouselSelector) {
    const carousel = document.querySelector(carouselSelector);
    if (carousel) {
        console.log(`Carousel found: ${carouselSelector}. Functionality to be added.`);
        // Basic carousel logic will go here
        // - Get items
        // - Add next/prev buttons
        // - Implement sliding
    }
}

// Call carousel initializers if those sections exist on the page
// document.addEventListener('DOMContentLoaded', function() {
//     if (document.querySelector('.projects-carousel')) {
//         initCarousel('.projects-carousel');
//     }
//     if (document.querySelector('.testimonials-carousel')) {
//         initCarousel('.testimonials-carousel');
//     }
// });

    // Update copyright year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Generic Carousel Functionality
    function initCarousel(carouselId) {
        const carouselElement = document.getElementById(carouselId);
        if (!carouselElement) {
            // console.log(`Carousel with ID ${carouselId} not found on this page.`);
            return;
        }

        const track = carouselElement.querySelector('.carousel-track');
        const cards = Array.from(track.children);
        const nextButton = carouselElement.querySelector('.carousel-button.next');
        const prevButton = carouselElement.querySelector('.carousel-button.prev');

        if (!track || !nextButton || !prevButton || cards.length === 0) {
            // console.log(`Carousel ${carouselId} is missing track, buttons, or cards.`);
            return;
        }

        let cardWidth = cards[0].offsetWidth;
        let currentTranslate = 0;
        let currentIndex = 0;
        const gap = parseInt(window.getComputedStyle(track).gap) || 0; // Get gap from CSS

        function updateCardWidth() {
            // Only update cardWidth if cards are displayed in a row (desktop view)
            if (window.innerWidth > 768) { // Matches the CSS breakpoint for stacking
                 // Ensure cards are visible and have width before measuring
                if (cards.length > 0 && cards[0].offsetWidth > 0) {
                    cardWidth = cards[0].offsetWidth;
                } else {
                    // Fallback or wait for layout
                    // console.log("Card width not available yet for " + carouselId);
                    // Potentially use a ResizeObserver or a more robust way to get width after layout
                    // For now, we'll rely on initial load or a fixed width if this fails often.
                    // This might happen if the carousel is initially hidden or cards have no content.
                    // A simple fixed fallback if needed: cardWidth = 300;
                }
            } else {
                // On mobile, cards are stacked, so horizontal scrolling logic isn't applicable
                // or needs to be handled differently. For now, we disable buttons on mobile.
            }
            updateButtonStates();
        }


        function moveToCard(index) {
            if (window.innerWidth <= 768) { // Disable horizontal scroll on mobile
                track.style.transform = 'translateX(0px)';
                return;
            }
            currentTranslate = -index * (cardWidth + gap);
            track.style.transform = `translateX(${currentTranslate}px)`;
            currentIndex = index;
            updateButtonStates();
        }

        function updateButtonStates() {
            if (window.innerWidth <= 768) { // Disable buttons on mobile where cards stack
                prevButton.style.display = 'none';
                nextButton.style.display = 'none';
                track.style.transform = 'translateX(0px)'; // Ensure no horizontal translation
                return;
            }

            prevButton.style.display = 'block';
            nextButton.style.display = 'block';

            prevButton.disabled = currentIndex === 0;
            // To check if the last card is fully visible:
            // The total width of the track content is (cards.length * cardWidth) + ((cards.length - 1) * gap)
            // The visible width of the carousel container is carouselElement.offsetWidth
            // If currentTranslate makes the end of the track visible, disable next.
            const trackWidth = track.scrollWidth;
            const containerWidth = carouselElement.offsetWidth;
            nextButton.disabled = currentIndex >= cards.length - 1 || (currentTranslate + trackWidth) <= containerWidth;

            // A simpler way to check if the last "group" of cards is visible
            // This logic assumes we can show more than one card at a time if the container is wide enough
            // For one-by-one card scrolling, the above is fine.
            // For this implementation, let's assume we scroll one card at a time.
            // If last card is in view, disable next.
             if (cards.length > 0) {
                const lastCard = cards[cards.length - 1];
                const lastCardRect = lastCard.getBoundingClientRect();
                const containerRect = carouselElement.getBoundingClientRect();
                // Check if the right edge of the last card is within or past the right edge of the container
                if (lastCardRect.right <= containerRect.right + 5) { // +5 for small tolerance
                    nextButton.disabled = true;
                }
            }
        }

        nextButton.addEventListener('click', () => {
            if (currentIndex < cards.length - 1) {
                moveToCard(currentIndex + 1);
            }
        });

        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                moveToCard(currentIndex - 1);
            }
        });

        // Initial setup
        updateCardWidth(); // Get initial card width
        moveToCard(0);     // Set initial position and button states

        // Update on resize
        window.addEventListener('resize', () => {
            updateCardWidth();
            moveToCard(currentIndex); // Recalculate position based on new width and current index
        });
    }

    // Initialize carousels
    initCarousel('projects-carousel');
    initCarousel('testimonials-carousel');
