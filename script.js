/*
    Developer Portfolio Website Scripts
    Author: [Your Name] / Jules AI Agent
    Version: 1.1 (Attempting auto-scroll fix)
    ------------------------------------------
    NOTE FOR PRODUCTION:
    Consider minifying this JavaScript file to reduce its size and improve loading times.
    ------------------------------------------
*/

document.addEventListener('DOMContentLoaded', function() {
    // console.log('Portfolio website loaded successfully!');

    // Navigation link handling (smooth scroll on Home, direct on others)
    const navLinks = document.querySelectorAll('header nav a');
    const previewSectionIds = {
        'About Me': 'home-about-preview',
        'Projects': 'home-projects-preview',
        'Testimonials': 'home-testimonials-preview',
        'Contact': 'home-contact-preview'
    };

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const linkText = this.textContent.trim();
            const targetSectionId = previewSectionIds[linkText];

            if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
                if (targetSectionId) {
                    const targetElement = document.getElementById(targetSectionId);
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                        navLinks.forEach(navLink => navLink.classList.remove('active'));
                        this.classList.add('active');
                    }
                } else if (this.getAttribute('href') === 'index.html' || this.getAttribute('href') === './') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    const homeLink = document.querySelector('header nav a[href="index.html"]');
                    if (homeLink) homeLink.classList.add('active');
                }
            }
        });
    });

    // Active nav link highlighting on scroll for Home page
    if (window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
        const sectionsForScrollSpy = Object.values(previewSectionIds)
            .map(id => document.getElementById(id))
            .filter(el => el);
        const heroSection = document.querySelector('.hero');
        if (heroSection) sectionsForScrollSpy.unshift(heroSection);

        window.addEventListener('scroll', () => {
            let currentActiveSectionId = '';
            const scrollPosition = window.scrollY + window.innerHeight / 2;

            sectionsForScrollSpy.forEach(section => {
                if (section.offsetTop <= scrollPosition && (section.offsetTop + section.offsetHeight) > scrollPosition) {
                    if (section.classList.contains('hero')) {
                        currentActiveSectionId = 'index.html';
                    } else {
                        currentActiveSectionId = section.id;
                    }
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                const linkText = link.textContent.trim();
                const targetSectionId = previewSectionIds[linkText];
                if (targetSectionId === currentActiveSectionId) {
                    link.classList.add('active');
                } else if ((link.getAttribute('href') === 'index.html' || link.getAttribute('href') === './') && currentActiveSectionId === 'index.html') {
                    link.classList.add('active');
                }
            });

            if (!currentActiveSectionId && sectionsForScrollSpy.length > 0 && scrollPosition < sectionsForScrollSpy[0].offsetTop) {
                 navLinks.forEach(link => link.classList.remove('active'));
                 const homeLink = document.querySelector('header nav a[href="index.html"]');
                 if (homeLink) homeLink.classList.add('active');
            }
        });
    }

    // Fade-in/slide-up animations
    const elementsToAnimate = document.querySelectorAll('.hero, .main-content, .sidebar, .project-card, .testimonial-card, .page-preview-section');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elementsToAnimate.forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Update copyright year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Generic Carousel Functionality
    function initCarousel(carouselId) {
        // console.log(`[${carouselId}] initCarousel called.`);
        const carouselElement = document.getElementById(carouselId);
        if (!carouselElement) return;

        const track = carouselElement.querySelector('.carousel-track');
        const cards = Array.from(track.children);
        const nextButton = carouselElement.querySelector('.carousel-button.next');
        const prevButton = carouselElement.querySelector('.carousel-button.prev');
        const playPauseButton = carouselElement.querySelector('.carousel-button.play-pause');

        if (!track || !nextButton || !prevButton || !playPauseButton || cards.length === 0) {
            console.error(`[${carouselId}] Missing critical elements. Cannot initialize.`);
            return;
        }

        let cardWidth = 0;
        let currentTranslate = 0;
        let currentIndex = 0;
        let gap = 0;

        let autoScrollInterval = null;
        let isPaused = false;
        const autoScrollDelay = 4000;

        function updateCardWidthAndGap() {
            if (cards.length > 0 && cards[0].offsetWidth > 0) {
                cardWidth = cards[0].offsetWidth;
                gap = parseInt(window.getComputedStyle(track).gap) || 0;
            } else {
                cardWidth = 0;
                gap = 0;
                // console.warn(`[${carouselId}] Card width not available during updateCardWidthAndGap.`);
            }

            if (window.innerWidth <= 768) {
                stopAutoScroll();
            }
            updateButtonStates();
        }

        function moveToCard(index, smooth = true) {
            if (window.innerWidth <= 768) {
                track.style.transform = 'translateX(0px)';
                track.style.transition = 'none';
                return;
            }
            if (cardWidth === 0 && cards.length > 0) {
                 updateCardWidthAndGap();
                 if(cardWidth === 0) {
                    // console.error(`[${carouselId}] cardWidth is still 0. Aborting move.`);
                    return;
                 }
            }
            if (cards.length === 0) return;

            track.style.transition = smooth ? 'transform 0.5s ease-in-out' : 'none';
            currentTranslate = -index * (cardWidth + gap);
            track.style.transform = `translateX(${currentTranslate}px)`;
            currentIndex = index;
            updateButtonStates();
        }

        function updateButtonStates() {
            if (window.innerWidth <= 768) {
                prevButton.style.display = 'none';
                nextButton.style.display = 'none';
                playPauseButton.style.display = 'none';
                return;
            }

            prevButton.style.display = 'block';
            nextButton.style.display = 'block';
            playPauseButton.style.display = 'block';

            prevButton.disabled = cards.length <= 1;
            nextButton.disabled = cards.length <= 1;

            if (isPaused) {
                playPauseButton.textContent = '►';
                playPauseButton.setAttribute('aria-label', 'Play carousel');
                playPauseButton.setAttribute('aria-pressed', 'false');
            } else {
                playPauseButton.textContent = '❚❚';
                playPauseButton.setAttribute('aria-label', 'Pause carousel');
                playPauseButton.setAttribute('aria-pressed', 'true');
            }
        }

        function advanceCarousel() {
            if(isPaused || cards.length === 0 || cardWidth === 0) return;

            let nextIndex = currentIndex + 1;
            if (nextIndex >= cards.length) {
                nextIndex = 0;
            }
            moveToCard(nextIndex);
        }

        function startAutoScroll() {
            // console.log(`[${carouselId}] Attempting startAutoScroll. isPaused: ${isPaused}, cardWidth: ${cardWidth}`);
            if (isPaused || autoScrollInterval || window.innerWidth <= 768 || cards.length === 0 || cardWidth === 0) {
                // console.log(`[${carouselId}] Auto-scroll NOT started. Conditions met to prevent.`);
                return;
            }
            clearInterval(autoScrollInterval);
            autoScrollInterval = setInterval(advanceCarousel, autoScrollDelay);
            // console.log(`[${carouselId}] Auto-scroll STARTED.`);
            isPaused = false; // Ensure state is playing
            updateButtonStates(); // Reflect playing state on button
        }

        function stopAutoScroll() {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
            // console.log(`[${carouselId}] Auto-scroll STOPPED.`);
        }

        playPauseButton.addEventListener('click', () => {
            if (isPaused) {
                isPaused = false;
                startAutoScroll();
            } else {
                isPaused = true;
                stopAutoScroll();
            }
            updateButtonStates();
        });

        nextButton.addEventListener('click', () => {
            isPaused = true;
            stopAutoScroll();
            updateButtonStates();
            let nextIndex = currentIndex + 1;
            if (nextIndex >= cards.length) nextIndex = 0;
            moveToCard(nextIndex);
        });

        prevButton.addEventListener('click', () => {
            isPaused = true;
            stopAutoScroll();
            updateButtonStates();
            let prevIndex = currentIndex - 1;
            if (prevIndex < 0) prevIndex = cards.length - 1;
            moveToCard(prevIndex);
        });

        // Initial setup
        updateCardWidthAndGap();
        moveToCard(0, false);

        // Delay initial auto-scroll start slightly to ensure layout is stable
        setTimeout(() => {
            if (window.innerWidth > 768 && !isPaused && cards.length > 0 && cardWidth > 0) {
                // console.log(`[${carouselId}] Desktop view on init after timeout, !isPaused. Starting auto-scroll.`);
                startAutoScroll();
            } else {
                // console.log(`[${carouselId}] Conditions not met for auto-scroll start after timeout.`);
                updateButtonStates();
            }
        }, 100); // 100ms delay, can be adjusted

        window.addEventListener('resize', () => {
            const wasPlaying = !isPaused && autoScrollInterval;
            stopAutoScroll();
            updateCardWidthAndGap();
            moveToCard(currentIndex, false);
            if (wasPlaying && window.innerWidth > 768 && cardWidth > 0) {
                startAutoScroll();
            } else {
                if (window.innerWidth > 768) updateButtonStates();
            }
        });

        carouselElement.addEventListener('focusin', () => {
            if (!isPaused && autoScrollInterval) {
                stopAutoScroll();
                // To indicate it's paused by focus, not user choice:
                // isPaused = true; // Temporarily consider it paused
                // updateButtonStates(); // This will show play icon
                // isPaused = false; // But don't keep it paused if user tabs out without clicking play/pause
                // Simpler: just stop, user can click play.
                // For now, we'll just ensure the button reflects a "paused" state if auto-scroll stops.
                // The most reliable is to let the user click play again.
                // So, if it was playing, and focus stops it, the button should ideally allow resuming.
                // This means we might need a temporary pause state for focus.
                // For now, let's assume focus just stops it, and user can click play.
                // To make the button show "Play" when focus stops auto-scroll:
                playPauseButton.textContent = '►';
                playPauseButton.setAttribute('aria-label', 'Play carousel (paused by focus)');
                playPauseButton.setAttribute('aria-pressed', 'false'); // Visually it's paused
            }
        });
         // Optional: Resume on focusout if it wasn't manually paused and focus is truly outside
        carouselElement.addEventListener('focusout', (event) => {
            if (!carouselElement.contains(event.relatedTarget) && !isPaused && !autoScrollInterval && window.innerWidth > 768 && cardWidth > 0) {
                // console.log(`[${carouselId}] Focus left carousel, restarting auto-scroll if it wasn't manually paused.`);
                startAutoScroll();
            }
        });
    }

    initCarousel('projects-carousel');
    initCarousel('testimonials-carousel');

    // Simplified Auto-Scrolling Carousel for Home Page Previews
    function initSimpleAutoCarousel(carouselId) {
        // console.log(`[${carouselId}] initSimpleAutoCarousel called.`);
        const carouselElement = document.getElementById(carouselId);
        if (!carouselElement) {
            // console.log(`[${carouselId}] Simple carousel element NOT FOUND.`);
            return;
        }

        const track = carouselElement.querySelector('.carousel-track');
        if (!track) {
            // console.error(`[${carouselId}] Track element not found.`);
            return;
        }

        let originalCards = Array.from(track.children);
        if (originalCards.length === 0) {
            // console.log(`[${carouselId}] No cards found.`);
            return;
        }

        // --- Infinite scroll setup: Clone cards ---
        // To make the loop seamless, clone the initial set of cards and append them
        // This way, when scrolling, it appears infinite.
        // Only clone if there are enough cards to make cloning worthwhile / fill the view

        let cardWidth = 0;
        let gap = 0;
        let totalWidthOfOriginalSet = 0;
        let scrollInterval = null;
        const scrollDelay = 30; // Milliseconds for smoother animation step
        const pauseDelayOnHover = 2000; // ms to pause before resuming after mouseleave
        let resumeScrollTimer = null;
        let currentScrollLeft = 0;
        let step = 1; // Scroll speed (pixels per interval)

        function setupDimensionsAndClones() {
            // console.log(`[${carouselId}] setupDimensionsAndClones`);
            // Clear existing clones if any (e.g., on resize)
            track.innerHTML = '';
            originalCards.forEach(card => track.appendChild(card.cloneNode(true)));
            originalCards = Array.from(track.children); // Re-select after potential recreation

            if (originalCards.length === 0 || window.innerWidth <= 768) {
                track.style.transform = 'translateX(0px)'; // Reset on mobile
                if(originalCards.length > 0) originalCards.forEach(card => track.appendChild(card)); // Put original cards back if they were cleared
                return false; // Don't proceed with cloning or width calculation for mobile/no cards
            }

            cardWidth = originalCards.length > 0 ? originalCards[0].offsetWidth : 0;
            gap = originalCards.length > 0 ? parseInt(window.getComputedStyle(track).gap) || 0 : 0;

            if (cardWidth === 0) return false; // Cannot proceed if cardWidth is 0

            totalWidthOfOriginalSet = originalCards.reduce((acc, card) => acc + card.offsetWidth + gap, 0) - gap;

            // Clone cards only if the total width of original cards is less than, say, 3x the container width
            // Or simply if they don't already fill up a good amount of scrollable space.
            // For continuous scroll, we need enough clones to cover the transition when looping.
            let numClonesToAppend = Math.ceil(carouselElement.offsetWidth / (cardWidth + gap)) + 2;
            if (originalCards.length < numClonesToAppend ) numClonesToAppend = originalCards.length;


            if (track.scrollWidth < carouselElement.offsetWidth * 2 && originalCards.length > 0) { // Only clone if needed
                 for(let i = 0; i < numClonesToAppend; ++i) {
                    const clone = originalCards[i % originalCards.length].cloneNode(true);
                    track.appendChild(clone);
                }
            }
            return true;
        }


        function scrollTick() {
            currentScrollLeft += step;
            if (currentScrollLeft >= totalWidthOfOriginalSet + gap) {
                currentScrollLeft = 0; // Jump back to the start
                track.style.transition = 'none'; // No transition for the jump
                track.style.transform = `translateX(-${currentScrollLeft}px)`;
                // Force reflow/repaint before re-enabling transition
                void track.offsetWidth;
                track.style.transition = ''; // Re-enable CSS transition if it was defined
            } else {
                if (track.style.transition === 'none') track.style.transition = '';
                track.style.transform = `translateX(-${currentScrollLeft}px)`;
            }
        }

        function startSimpleAutoScroll() {
            // console.log(`[${carouselId}] startSimpleAutoScroll. Interval: ${scrollInterval}`);
            if (scrollInterval || window.innerWidth <= 768 || cardWidth === 0) return;

            clearInterval(scrollInterval); // Clear just in case
            scrollInterval = setInterval(scrollTick, scrollDelay);
            // console.log(`[${carouselId}] Simple auto-scroll STARTED.`);
        }

        function stopSimpleAutoScroll() {
            // console.log(`[${carouselId}] stopSimpleAutoScroll. Interval: ${scrollInterval}`);
            clearInterval(scrollInterval);
            scrollInterval = null;
            // console.log(`[${carouselId}] Simple auto-scroll STOPPED.`);
        }

        carouselElement.addEventListener('mouseenter', () => {
            if (window.innerWidth > 768) {
                // console.log(`[${carouselId}] Mouse enter, stopping scroll.`);
                clearTimeout(resumeScrollTimer);
                stopSimpleAutoScroll();
            }
        });

        carouselElement.addEventListener('mouseleave', () => {
            if (window.innerWidth > 768) {
                // console.log(`[${carouselId}] Mouse leave, planning to resume scroll.`);
                clearTimeout(resumeScrollTimer); // Clear any pending resume
                resumeScrollTimer = setTimeout(() => {
                    // console.log(`[${carouselId}] Resuming scroll after mouseleave delay.`);
                    currentScrollLeft = parseFloat(getComputedStyle(track).transform.split(',')[4]) * -1 || 0; // Get current position
                    startSimpleAutoScroll();
                }, pauseDelayOnHover);
            }
        });

        let initialSetupDone = false;
        function reinitialize() {
            // console.log(`[${carouselId}] Reinitializing simple carousel`);
            stopSimpleAutoScroll();
            currentScrollLeft = 0; // Reset scroll position
            track.style.transform = 'translateX(0px)'; // Visually reset
            if (setupDimensionsAndClones()) { // Setup dimensions and clones
                if (window.innerWidth > 768) {
                    startSimpleAutoScroll();
                }
            }
            initialSetupDone = true;
        }


        // Initial setup
        // Use a small delay for initial setup to ensure layout is stable
        setTimeout(() => {
            reinitialize();
        }, 100);


        window.addEventListener('resize', () => {
            // console.log(`[${carouselId}] Window resize simple carousel.`);
             // If it was never properly initialized (e.g. started on mobile), try to init now if desktop
            if (!initialSetupDone && window.innerWidth > 768) {
                reinitialize();
            } else if (initialSetupDone) { // If already initialized, just re-evaluate
                stopSimpleAutoScroll();
                if (setupDimensionsAndClones()) { // Recalculate and re-clone if needed
                    // Reset scroll position before restarting to avoid jump if cardWidth changed
                    currentScrollLeft = 0;
                    track.style.transform = 'translateX(0px)';
                    if (window.innerWidth > 768) {
                        startSimpleAutoScroll();
                    }
                } else if (window.innerWidth <= 768) { // Switched to mobile
                    track.style.transform = 'translateX(0px)'; // Ensure it's reset
                }
            }
        });
    }

    // Initialize simple carousels on Home page if they exist
    if (document.getElementById('home-projects-preview-carousel')) {
        initSimpleAutoCarousel('home-projects-preview-carousel');
    }
    if (document.getElementById('home-testimonials-preview-carousel')) {
        initSimpleAutoCarousel('home-testimonials-preview-carousel');
    }

});
