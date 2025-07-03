document.addEventListener('DOMContentLoaded', () => {
    // Main application container
    const appContainer = document.getElementById('app-container');

    // Calendar related elements
    const calendarWidgetArea = document.getElementById('calendar-widget-area'); // Overall area for calendar widget
    const compactDateDisplay = document.getElementById('compact-date-display');
    const compactDateText = document.getElementById('compact-date-text');
    const fullCalendarView = document.getElementById('full-calendar-view'); // Container for full calendar

    let currentDate = new Date(); // Tracks the currently displayed month and year (for both views)
    let emojiData = loadEmojiData(); // Holds all emoji data { "YYYY-MM-DD": "😊" }

    // --- Compact Date Display ---
    /**
     * Renders the current date in a compact format.
     */
    function renderCompactDateDisplay() {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        compactDateText.textContent = new Date().toLocaleDateString(undefined, options); // Use current real-time date
    }

    // --- Expand/Collapse Calendar ---
    compactDateDisplay.addEventListener('click', () => {
        appContainer.classList.add('expanded');
        compactDateDisplay.style.display = 'none';
        fullCalendarView.style.display = 'block'; // Or 'flex' if it's a flex container
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth()); // Render full calendar
    });

    function closeFullCalendar() {
        appContainer.classList.remove('expanded');
        fullCalendarView.style.display = 'none';
        fullCalendarView.innerHTML = ''; // Clear the full calendar content
        compactDateDisplay.style.display = 'block'; // Or 'flex'
        renderCompactDateDisplay(); // Refresh compact display, e.g., if date changed while open
    }


    // --- LocalStorage Persistence ---
    /**
     * Saves the current emojiData object to localStorage.
     */
    function saveEmojiData() {
        localStorage.setItem('calendarEmojiData', JSON.stringify(emojiData));
    }

    /**
     * Loads emoji data from localStorage.
     * @returns {object} The parsed emoji data object or an empty object if none found.
     */
    function loadEmojiData() {
        const data = localStorage.getItem('calendarEmojiData');
        return data ? JSON.parse(data) : {};
    }

    /**
     * Adds or removes an emoji for a specific date and saves the data.
     * @param {string} dateKey - The date in "YYYY-MM-DD" format.
     * @param {string} emoji - The emoji character. If empty, the emoji is removed.
     */
    function addEmojiToDate(dateKey, emoji) {
        if (emoji) { // Add/update emoji if provided
            emojiData[dateKey] = emoji;
        } else { // Remove emoji if input is empty
            delete emojiData[dateKey];
        }
        saveEmojiData();
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth()); // Re-render calendar
        updateEmojiSummary(); // Update summary display
    }

    // --- Emoji Summary Display ---
    const summaryContent = document.getElementById('summary-content'); // Reference to the summary display area

    /**
     * Updates the emoji summary panel with counts of each emoji.
     */
    function updateEmojiSummary() {
        summaryContent.innerHTML = ''; // Clear previous summary

        if (Object.keys(emojiData).length === 0) {
            summaryContent.textContent = 'No emojis recorded yet.';
            return;
        }

        const counts = {};
        for (const dateKey in emojiData) {
            const emoji = emojiData[dateKey];
            if (emoji) { // Ensure it's not an empty string if that was ever stored
                counts[emoji] = (counts[emoji] || 0) + 1;
            }
        }

        if (Object.keys(counts).length === 0) {
            summaryContent.textContent = 'No emojis recorded yet.';
            return;
        }

        // Sort by count descending, then by emoji
        const sortedSummary = Object.entries(counts).sort((a, b) => {
            if (b[1] === a[1]) {
                return a[0].localeCompare(b[0]); // Sort by emoji string if counts are equal
            }
            return b[1] - a[1]; // Sort by count descending
        });

        let summaryHTML = '<ul>';
        sortedSummary.forEach(([emoji, count]) => {
            summaryHTML += `<li>${emoji} : ${count}</li>`;
        });
        summaryHTML += '</ul>';
        summaryContent.innerHTML = summaryHTML;
    }


    // --- Calendar Rendering Logic ---
    /**
     * Renders the calendar for the given year and month.
     * @param {number} year - The full year (e.g., 2024).
     * @param {number} month - The month index (0-11).
     */
    function renderCalendar(year, month) {
        fullCalendarView.innerHTML = ''; // Target the new container and clear it

        const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // Sunday as 0, matching Date.getDay()

        // Create Calendar Header (Month/Year and Navigation)
        const header = document.createElement('div');
        header.className = 'calendar-header';

        const prevButton = document.createElement('button');
        prevButton.id = 'prev-month';
        prevButton.textContent = '< Prev';
        prevButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });

        const monthYearLabel = document.createElement('h3');
        monthYearLabel.id = 'month-year-label';
        monthYearLabel.textContent = `${monthNames[month]} ${year}`;

        const nextButton = document.createElement('button');
        nextButton.id = 'next-month';
        nextButton.textContent = 'Next >';
        nextButton.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });

        header.appendChild(prevButton);
        header.appendChild(monthYearLabel);
        header.appendChild(nextButton);

        const closeButton = document.createElement('button');
        closeButton.id = 'close-calendar';
        closeButton.textContent = 'Close';
        closeButton.style.marginLeft = 'auto'; // Push to the right
        closeButton.addEventListener('click', closeFullCalendar);
        header.appendChild(closeButton);

        fullCalendarView.appendChild(header);

        // Calendar Grid
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        // Day Names Row
        dayNames.forEach(day => {
            const dayNameCell = document.createElement('div');
            dayNameCell.className = 'day-name';
            dayNameCell.textContent = day;
            grid.appendChild(dayNameCell);
        });

        // Days of the month
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate(); // Last day of current month

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day-cell', 'other-month');
            grid.appendChild(emptyCell);
        }

        // Add day cells for the current month
        const today = new Date(); // For highlighting the current day
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day-cell');

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = dateKey; // Store YYYY-MM-DD for easy access

            // Span for the day number
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.className = 'day-number';
            dayNumberSpan.textContent = day;
            dayCell.appendChild(dayNumberSpan);

            // Display emoji if one exists for this date
            if (emojiData[dateKey]) {
                const emojiSpan = document.createElement('span');
                emojiSpan.className = 'emoji';
                emojiSpan.textContent = emojiData[dateKey];
                dayCell.appendChild(emojiSpan);
            }

            // Highlight today's date
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayCell.classList.add('current-day');
            }

            // Event listener for adding/editing emojis
            dayCell.addEventListener('click', (event) => {
                const clickedDateKey = event.currentTarget.dataset.date;
                const currentEmoji = emojiData[clickedDateKey] || '';
                const newEmoji = prompt(`Enter emoji for ${clickedDateKey} (leave empty to remove):`, currentEmoji);

                if (newEmoji !== null) { // User did not cancel prompt
                    // Basic validation: allow one or two characters (for emojis like flags or skin tone modifiers), or empty to remove
                    if (newEmoji === '' || (newEmoji.length >= 1 && newEmoji.length <= 2)) {
                         addEmojiToDate(clickedDateKey, newEmoji);
                    } else {
                        alert("Invalid input. Please enter a single emoji character (or a 2-char flag/modifier), or leave empty to remove.");
                    }
                }
            });
            grid.appendChild(dayCell);
        }

        // Fill remaining cells in the last week with empty placeholders for a complete grid
        const totalCells = firstDayOfMonth + daysInMonth;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let i = 0; i < remainingCells; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day-cell', 'other-month'); // Style as non-interactive
            grid.appendChild(emptyCell);
        }

        fullCalendarView.appendChild(grid); // Append grid to the full calendar view
    }

    // --- Initialization ---
    renderCompactDateDisplay(); // Display compact date first
    // renderCalendar(currentDate.getFullYear(), currentDate.getMonth()); // Defer full calendar rendering
    updateEmojiSummary();

    console.log("JS Desktop App Initialized: Compact date shown, full calendar ready for expansion.");
});
