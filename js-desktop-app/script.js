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

    const PREDEFINED_EMOJIS = ['😊', '🎉', '⛽', '❤️', '🛒', '💼', '✈️', '🛠️', '❌']; // '❌' for remove

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
    // const summaryContent = document.getElementById('summary-content'); // Old reference, will be created dynamically

    /**
     * Updates the emoji summary panel with counts of each emoji.
     * This function will now target a div within the full calendar view.
     */
    function updateEmojiSummary() {
        const summaryPanel = document.getElementById('calendar-internal-summary-content');
        if (!summaryPanel) return; // If summary panel isn't visible/created yet

        summaryPanel.innerHTML = ''; // Clear previous summary

        if (Object.keys(emojiData).length === 0) {
            summaryPanel.textContent = 'No emojis recorded yet.';
            return;
        }

        const counts = {};
        for (const dateKey in emojiData) {
            const emoji = emojiData[dateKey];
            if (emoji) {
                counts[emoji] = (counts[emoji] || 0) + 1;
            }
        }

        if (Object.keys(counts).length === 0) {
            summaryPanel.textContent = 'No emojis recorded yet.';
            return;
        }

        const sortedSummary = Object.entries(counts).sort((a, b) => {
            if (b[1] === a[1]) {
                return a[0].localeCompare(b[0]);
            }
            return b[1] - a[1];
        });

        let summaryHTML = '<h4>Emoji Summary</h4><ul>'; // Add a title to the summary panel
        sortedSummary.forEach(([emoji, count]) => {
            summaryHTML += `<li>${emoji} : ${count}</li>`;
        });
        summaryHTML += '</ul>';
        summaryPanel.innerHTML = summaryHTML;
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
        // closeButton.style.marginLeft = 'auto'; // Let flexbox handle spacing
        closeButton.addEventListener('click', closeFullCalendar);

        const summaryButton = document.createElement('button');
        summaryButton.id = 'toggle-summary-calendar';
        summaryButton.textContent = 'Summary';
        summaryButton.addEventListener('click', () => {
            const summaryPanel = document.getElementById('calendar-internal-summary');
            if (summaryPanel) {
                const isHidden = summaryPanel.style.display === 'none';
                summaryPanel.style.display = isHidden ? 'block' : 'none';
                if (isHidden) {
                    updateEmojiSummary(); // Update content when shown
                }
                summaryButton.textContent = isHidden ? 'Hide Summary' : 'Summary';
            }
        });

        // Group navigation and action buttons
        const actionButtonsGroup = document.createElement('div');
        actionButtonsGroup.className = 'calendar-action-buttons';
        actionButtonsGroup.appendChild(summaryButton);
        actionButtonsGroup.appendChild(closeButton);

        header.appendChild(actionButtonsGroup); // Add the group to the header
        fullCalendarView.appendChild(header);

        // Container for the summary panel (initially hidden)
        const summaryPanelContainer = document.createElement('div');
        summaryPanelContainer.id = 'calendar-internal-summary';
        summaryPanelContainer.style.display = 'none'; // Hidden by default
        // Add a placeholder or content div inside
        const summaryPanelContent = document.createElement('div');
        summaryPanelContent.id = 'calendar-internal-summary-content';
        summaryPanelContainer.appendChild(summaryPanelContent);
        fullCalendarView.appendChild(summaryPanelContainer);


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
                const targetElement = event.currentTarget;
                // Close any existing picker first
                closeEmojiPicker();
                // console.log(`Date cell clicked: ${clickedDateKey}. Will open emoji picker.`);
                openEmojiPicker(clickedDateKey, targetElement); // To be fully implemented in next step
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

    // --- Emoji Picker Logic ---
    let activeEmojiPicker = null; // To keep track of the currently open picker

    /**
     * Creates and displays an emoji picker near the target element.
     * @param {string} dateKey - The date key (YYYY-MM-DD) for which to pick an emoji.
     * @param {HTMLElement} targetElement - The HTML element (date cell) that was clicked.
     */
    function openEmojiPicker(dateKey, targetElement) {
        closeEmojiPicker(); // Ensure only one picker is open at a time

        const picker = document.createElement('div');
        picker.id = 'emoji-picker-popup';

        PREDEFINED_EMOJIS.forEach(emoji => {
            const emojiButton = document.createElement('button');
            emojiButton.textContent = emoji;
            emojiButton.addEventListener('click', () => {
                const emojiToSave = (emoji === '❌') ? '' : emoji;
                addEmojiToDate(dateKey, emojiToSave);
                closeEmojiPicker();
            });
            picker.appendChild(emojiButton);
        });

        // Positioning logic (relative to fullCalendarView for simplicity)
        const calendarView = targetElement.closest('#full-calendar-view');
        if (!calendarView) {
            console.error("Could not find full-calendar-view to append emoji picker.");
            return;
        }
        calendarView.appendChild(picker);
        picker.style.position = 'absolute';

        // Position below the target element, trying to stay within calendar view bounds
        let top = targetElement.offsetTop + targetElement.offsetHeight + 2; // +2 for a small gap
        let left = targetElement.offsetLeft;

        // Basic boundary check (very simplified) - ensure it doesn't go too far right
        if (left + picker.offsetWidth > calendarView.offsetWidth) {
            left = calendarView.offsetWidth - picker.offsetWidth - 5; // Adjust left
        }
        if (left < 0) left = 5; // Ensure it's not off-screen left

        // (A more robust solution would also check bottom boundary and flip if needed)

        picker.style.top = `${top}px`;
        picker.style.left = `${left}px`;

        activeEmojiPicker = picker;

        // Add a one-time event listener to handle clicks outside the picker
        // Use setTimeout to allow the current click event (that opened the picker) to complete
        setTimeout(() => {
            document.addEventListener('click', handleClickOutsidePicker, { capture: true, once: true });
        }, 0);
    }

    /**
     * Handles clicks outside the emoji picker to close it.
     * @param {Event} event - The click event.
     */
    function handleClickOutsidePicker(event) {
        if (activeEmojiPicker && !activeEmojiPicker.contains(event.target)) {
            // Check if the click was on a day-cell. If so, the day-cell's own click
            // handler will call openEmojiPicker, which calls closeEmojiPicker first.
            // So, we only need to close if the click is NOT on a day-cell that would reopen it.
            if (!event.target.closest('.day-cell')) {
                 closeEmojiPicker();
            }
        }
        // Listener is {once: true}, so it's automatically removed.
        // If not using {once: true}, ensure to remove it in closeEmojiPicker or here.
    }

    /**
     * Closes the currently active emoji picker, if any.
     */
    function closeEmojiPicker() {
        // If we weren't using {once: true} for handleClickOutsidePicker, we'd remove it here:
        // document.removeEventListener('click', handleClickOutsidePicker, { capture: true });
        if (activeEmojiPicker) {
            activeEmojiPicker.remove();
            activeEmojiPicker = null;
        }
    }

    // --- Initialization ---
    renderCompactDateDisplay(); // Display compact date first
    // updateEmojiSummary(); // Summary is now part of full calendar, and updated when shown.
                             // No need to call it here on initial load as summary panel is hidden.

    console.log("JS Desktop App Initialized: Compact date shown, full calendar ready for expansion.");
});
