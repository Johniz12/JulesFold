document.addEventListener('DOMContentLoaded', () => {
    // Main application container
    const appContainer = document.getElementById('app-container');
    const mainContentArea = document.getElementById('main-content-area'); // Parent of draggable widgets

    // Calendar related elements
    const calendarWidgetArea = document.getElementById('calendar-widget-area');
    const compactDateDisplay = document.getElementById('compact-date-display');
    const compactDateText = document.getElementById('compact-date-text');
    const fullCalendarView = document.getElementById('full-calendar-view'); // Container for full calendar

    // Time Widget related elements
    const timeWidgetArea = document.getElementById('time-widget-area');
    const compactTimeDisplay = document.getElementById('compact-time-display');
    const currentTimeText = document.getElementById('current-time-text');
    const timeSettingsView = document.getElementById('time-settings-view');
    const closeTimeSettingsButton = document.getElementById('close-time-settings');
    const syncNetworkTimeButton = document.getElementById('sync-network-time-button');
    const networkTimeDisplay = document.getElementById('network-time-display');

    // Time Zone elements
    const timezoneSelect1 = document.getElementById('timezone-select-1');
    const timezoneDisplay1 = document.getElementById('timezone-display-1');
    const timezoneSelect2 = document.getElementById('timezone-select-2');
    const timezoneDisplay2 = document.getElementById('timezone-display-2');

    // Timer UI Elements
    // const compactTimerControl = document.getElementById('compact-timer-control'); // REVERTED
    const timerHoursInput = document.getElementById('timer-hours');
    const timerMinutesInput = document.getElementById('timer-minutes');
    const timerSecondsInput = document.getElementById('timer-seconds');
    const timerDisplay = document.getElementById('timer-display');
    const startTimerButton = document.getElementById('start-timer');
    const pauseTimerButton = document.getElementById('pause-timer');
    const resetTimerButton = document.getElementById('reset-timer');

    // Time Settings Sectioning Elements
    const timeFeatureBlocksContainer = document.getElementById('time-feature-blocks-container');
    const timerFeatureBlock = document.getElementById('timer-feature-block');
    const networkTimeFeatureBlock = document.getElementById('network-time-feature-block');
    const timezonesFeatureBlock = document.getElementById('timezones-feature-block');
    const allTimeFeatureBlocks = [timerFeatureBlock, networkTimeFeatureBlock, timezonesFeatureBlock].filter(el => el);

    const timerSettingsSection = document.getElementById('timer-settings-section');
    const networkTimeSettingsSection = document.getElementById('network-time-settings-section');
    const timezonesSettingsSection = document.getElementById('timezones-settings-section');
    const allTimeFeatureSections = [timerSettingsSection, networkTimeSettingsSection, timezonesSettingsSection].filter(el => el);


    const SAMPLE_TIMEZONES = [ // A small list for now, can be expanded
        { value: 'UTC', label: 'UTC' },
        { value: 'America/New_York', label: 'New York (EST/EDT)' },
        { value: 'Europe/London', label: 'London (GMT/BST)' },
        { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
        { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
        { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
        { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    ];


    let currentDate = new Date(); // Tracks the currently displayed month and year (for both views)
    let emojiData = loadEmojiData(); // Holds all emoji data { "YYYY-MM-DD": ["😊", "🎉"] }

    const PREDEFINED_EMOJIS = ['😊', '🎉', '⛽', '❤️', '🛒', '💼', '✈️', '🛠️']; // '❌' removed, toggle handles removal

    // --- Timer State ---
    let timerDurationSet = 0; // Total duration set by user in seconds
    let timerTimeRemaining = 0; // Current time remaining in seconds
    let timerIntervalId = null;   // ID for setInterval
    let isTimerPaused = false;    // Flag for pause state


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
     * @param {string} emojiToToggle - The emoji character to add or remove.
     */
    function addEmojiToDate(dateKey, emojiToToggle) {
        // Ensure the dateKey entry is an array
        if (!emojiData[dateKey] || !Array.isArray(emojiData[dateKey])) {
            emojiData[dateKey] = [];
        }

        const emojiIndex = emojiData[dateKey].indexOf(emojiToToggle);

        if (emojiToToggle === '') { // Special case: clear all emojis for this date (if '❌' was used)
            emojiData[dateKey] = [];
        } else if (emojiIndex > -1) { // Emoji exists, so remove it (toggle off)
            emojiData[dateKey].splice(emojiIndex, 1);
        } else { // Emoji doesn't exist, so add it (toggle on)
            emojiData[dateKey].push(emojiToToggle);
            // Optional: Sort emojis in the array for consistent display order, e.g., alphabetically
            // emojiData[dateKey].sort();
        }

        // If after modifications, the array is empty, we can choose to delete the key or keep an empty array.
        // For consistency and easier type checking later, let's keep the empty array.
        // if (emojiData[dateKey].length === 0) {
        //     delete emojiData[dateKey];
        // }

        saveEmojiData();
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth()); // Re-render calendar

        // Ensure summary updates if it's visible
        const summaryPanel = document.getElementById('calendar-internal-summary');
        if (summaryPanel && summaryPanel.style.display !== 'none') {
            updateEmojiSummary();
        }
    }

    // --- Emoji Summary Display ---

    let currentSummaryPeriod = "all"; // Default period

    /**
     * Filters emojiData based on the specified period.
     * @param {string} periodType - "month", "year", or "all".
     * @param {number} referenceYear - The year for month/year filtering.
     * @param {number} referenceMonth - The month (0-indexed) for month filtering.
     * @returns {object} Filtered emoji data.
     */
    function getFilteredEmojiData(periodType, referenceYear, referenceMonth) {
        if (periodType === "all") {
            return { ...emojiData }; // Return a copy of all data
        }

        const filtered = {};
        for (const dateKey in emojiData) {
            const [year, month] = dateKey.split('-').map(Number); // month is 1-indexed from split

            if (periodType === "year" && year === referenceYear) {
                filtered[dateKey] = emojiData[dateKey];
            } else if (periodType === "month" && year === referenceYear && (month - 1) === referenceMonth) {
                filtered[dateKey] = emojiData[dateKey];
            }
        }
        return filtered;
    }

    /**
     * Updates the emoji summary panel with counts of each emoji for the current period.
     */
    function updateEmojiSummary() {
        const summaryListDisplay = document.getElementById('summary-list-display');
        if (!summaryListDisplay) {
            // This can happen if summary panel is not yet fully rendered or is hidden
            // console.warn("Summary list display area not found.");
            return;
        }

        const referenceYear = currentDate.getFullYear();
        const referenceMonth = currentDate.getMonth(); // 0-indexed

        const filteredData = getFilteredEmojiData(currentSummaryPeriod, referenceYear, referenceMonth);
        summaryListDisplay.innerHTML = ''; // Clear previous summary list

        let summaryTitleText = "Emoji Summary - ";
        const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"];
        if (currentSummaryPeriod === "month") {
            summaryTitleText += `${monthNames[referenceMonth]} ${referenceYear}`;
        } else if (currentSummaryPeriod === "year") {
            summaryTitleText += `${referenceYear}`;
        } else {
            summaryTitleText += "All Time";
        }

        // Update active button style
        const periodButtons = document.querySelectorAll('#summary-period-selector button');
        periodButtons.forEach(button => {
            button.classList.toggle('active-period', button.dataset.period === currentSummaryPeriod);
        });


        if (Object.keys(filteredData).length === 0) {
            summaryListDisplay.innerHTML = `<h4>${summaryTitleText}</h4><p>No emojis recorded for this period.</p>`;
            return;
        }

        const counts = {};
        for (const dateKey in filteredData) {
            const emojisOnDate = filteredData[dateKey]; // This is now an array
            if (Array.isArray(emojisOnDate)) {
                emojisOnDate.forEach(emoji => {
                    if (emoji) { // Ensure emoji string is not empty/null
                        counts[emoji] = (counts[emoji] || 0) + 1;
                    }
                });
            }
        }

        if (Object.keys(counts).length === 0) {
            summaryListDisplay.innerHTML = `<h4>${summaryTitleText}</h4><p>No emojis recorded for this period.</p>`;
            return;
        }

        const sortedSummary = Object.entries(counts).sort((a, b) => {
            if (b[1] === a[1]) {
                return a[0].localeCompare(b[0]);
            }
            return b[1] - a[1];
        });

        let summaryHTML = `<h4>${summaryTitleText}</h4><ul>`;
        if (sortedSummary.length > 0) {
            sortedSummary.forEach(([emoji, count]) => {
                summaryHTML += `<li class="clickable-summary-emoji" data-emoji="${emoji}"
                                    data-period="${currentSummaryPeriod}"
                                    data-year="${referenceYear}"
                                    data-month="${referenceMonth}">
                                    ${emoji} : ${count}
                              </li>`;
            });
        } else {
            // This case is already handled by the filteredData check earlier,
            // but if counts somehow became empty after filtering, this would be a fallback.
            // summaryHTML += `<li>No specific emojis found for this period.</li>`;
        }
        summaryHTML += '</ul>';
        summaryListDisplay.innerHTML = summaryHTML;
    }


    // --- Calendar Rendering Logic ---

    // Event delegation for clickable summary emojis
    // This listener is added once to a persistent parent, #calendar-internal-summary-content
    // if it's guaranteed to exist when this code runs, or to fullCalendarView.
    // Let's ensure #calendar-internal-summary-content exists by the time this is attached,
    // or attach it when fullCalendarView is created.
    // For simplicity, will attach it when summary is shown for the first time if not already.
    // Better: Attach when fullCalendarView is created.

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
            // If summary is visible and in a relevant period, update it
            const summaryPanel = document.getElementById('calendar-internal-summary');
            if (summaryPanel && summaryPanel.style.display !== 'none' && (currentSummaryPeriod === 'month' || currentSummaryPeriod === 'year')) {
                updateEmojiSummary();
            }
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
            // If summary is visible and in a relevant period, update it
            const summaryPanel = document.getElementById('calendar-internal-summary');
            if (summaryPanel && summaryPanel.style.display !== 'none' && (currentSummaryPeriod === 'month' || currentSummaryPeriod === 'year')) {
                updateEmojiSummary();
            }
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
                    // currentSummaryPeriod = "all"; // Optionally reset to 'all' when opening, or remember last
                    updateEmojiSummary(); // Update content based on currentSummaryPeriod
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
        const summaryPanelContent = document.createElement('div'); // This will now hold both buttons and list
        summaryPanelContent.id = 'calendar-internal-summary-content';

        // Create period selection buttons container
        const periodSelectorContainer = document.createElement('div');
        periodSelectorContainer.id = 'summary-period-selector';

        const btnMonth = document.createElement('button');
        btnMonth.dataset.period = "month"; // Store period type in data attribute
        btnMonth.textContent = "Current Month";
        periodSelectorContainer.appendChild(btnMonth);

        const btnYear = document.createElement('button');
        btnYear.dataset.period = "year";
        btnYear.textContent = "Current Year";
        periodSelectorContainer.appendChild(btnYear);

        const btnAll = document.createElement('button');
        btnAll.dataset.period = "all";
        btnAll.textContent = "All Time";
        periodSelectorContainer.appendChild(btnAll);

        // Add event listeners to period buttons
        periodSelectorContainer.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (event) => {
                currentSummaryPeriod = event.target.dataset.period;
                updateEmojiSummary();
            });
        });

        summaryPanelContent.appendChild(periodSelectorContainer); // Add buttons first

        // Div for the actual summary list (will be populated by updateEmojiSummary)
        const summaryListDisplay = document.createElement('div');
        summaryListDisplay.id = 'summary-list-display';
        summaryPanelContent.appendChild(summaryListDisplay);

        // Div for displaying specific dates of a clicked emoji (initially hidden)
        const emojiDatesDetailView = document.createElement('div');
        emojiDatesDetailView.id = 'summary-emoji-dates-detail';
        emojiDatesDetailView.style.display = 'none'; // Hidden by default
        // Add a placeholder and a back button inside it
        const detailContent = document.createElement('div'); // To hold list of dates
        detailContent.id = 'summary-emoji-dates-content';
        const backButton = document.createElement('button');
        backButton.id = 'back-to-summary-list';
        backButton.textContent = '← Back to Summary';

        emojiDatesDetailView.appendChild(backButton);
        emojiDatesDetailView.appendChild(detailContent);
        summaryPanelContent.appendChild(emojiDatesDetailView); // Add after summary list

        summaryPanelContainer.appendChild(summaryPanelContent);
        fullCalendarView.appendChild(summaryPanelContainer);

        // Event listener for delegated clicks on summary items is now attached to fullCalendarView once on init.
        // No longer need to add/check here.

        // Add event listener for the "Back to Summary" button (variable backButton already declared when element was created)
        if (backButton) {
            // Ensure the listener is not added multiple times if renderCalendar could be called without full clear
            // However, fullCalendarView.innerHTML = '' should prevent this issue with current structure.
            // For safety, could check if a listener already exists or use a flag.
            // But given the full clear, this direct attachment should be fine.
            // Check if the listener was already added to this specific button instance
            // This is a bit tricky since the button is recreated.
            // A simpler way is to ensure the old one is gone via innerHTML = ''
            // and then just add it.
            // Or, ensure backButton reference is fresh if it's fetched by ID after creation.
            // The current structure: backButton is the newly created element.
            backButton.addEventListener('click', () => {
                const detailView = document.getElementById('summary-emoji-dates-detail');
                const summaryListDisplay = document.getElementById('summary-list-display');
                const periodSelector = document.getElementById('summary-period-selector');

                if (detailView) detailView.style.display = 'none';
                if (summaryListDisplay) summaryListDisplay.style.display = 'block';
                if (periodSelector) periodSelector.style.display = 'flex'; // Show period selector
            });
        }


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

            // Display emoji(s) if they exist for this date
            if (emojiData[dateKey] && Array.isArray(emojiData[dateKey]) && emojiData[dateKey].length > 0) {
                const emojiContainer = document.createElement('div'); // Use a div for better layout control if needed
                emojiContainer.className = 'emoji-display-container';

                // Option 1: Join emojis into a single string
                // emojiContainer.textContent = emojiData[dateKey].join(' ');

                // Option 2: Create separate spans for each emoji (better for individual styling/spacing if needed)
                emojiData[dateKey].forEach(emo => {
                    const emojiSpan = document.createElement('span');
                    emojiSpan.className = 'emoji';
                    emojiSpan.textContent = emo;
                    emojiContainer.appendChild(emojiSpan);
                });
                dayCell.appendChild(emojiContainer);
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

        PREDEFINED_EMOJIS.forEach(emojiSymbol => {
            const emojiButton = document.createElement('button');
            emojiButton.textContent = emojiSymbol;

            // Check if this emoji is already selected for the date
            if (emojiData[dateKey] && emojiData[dateKey].includes(emojiSymbol)) {
                emojiButton.classList.add('picker-emoji-active');
            }

            emojiButton.addEventListener('click', () => {
                // emojiToToggle is just the emojiSymbol itself.
                // addEmojiToDate will handle adding or removing it from the array.
                addEmojiToDate(dateKey, emojiSymbol);
                // No need to close picker immediately, allow multiple toggles.
                // Picker will close on "click outside" or if another date is clicked.
                // Or, we can explicitly close it: closeEmojiPicker();
                // For now, let's keep it open to allow multiple toggles, and rely on click-outside.
                // To reflect the change immediately on the button:
                emojiButton.classList.toggle('picker-emoji-active');
            });
            picker.appendChild(emojiButton);
        });

        // Add a "Done" or "Close Picker" button to the picker itself
        const doneButton = document.createElement('button');
        doneButton.textContent = 'Done';
        doneButton.classList.add('picker-done-button'); // For specific styling
        doneButton.addEventListener('click', () => {
            closeEmojiPicker();
        });
        picker.appendChild(doneButton);

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

    // --- Live Clock Update ---
    /**
     * Updates the compact time display with the current system time.
     */
    function updateLiveClock() {
        if (currentTimeText) { // Ensure element exists
            const now = new Date();
            const timeString = now.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            currentTimeText.textContent = timeString;
        }
    }


    // --- Time Settings Expand/Collapse ---
    // #compact-time-display (PC clock) will now toggle the whole #time-settings-view
    if (compactTimeDisplay) { // This is the main PC clock display
        compactTimeDisplay.addEventListener('click', () => {
            if (timeSettingsView) {
                const isSettingsHidden = timeSettingsView.style.display === 'none';
                timeSettingsView.style.display = isSettingsHidden ? 'block' : 'none';

                if (isSettingsHidden) { // When opening the settings view
                    // Ensure all specific feature sections are hidden initially
                    allTimeFeatureSections.forEach(section => {
                        if(section) section.style.display = 'none';
                    });
                    // When settings view is opened, the new feature blocks will be visible by default.
                    // Specific feature sections (timer-settings-section, etc.) will be hidden.
                    // This initial hiding of sections is already done by their inline style or will be handled by JS.
                    allTimeFeatureSections.forEach(section => { // Ensure detailed sections are hidden
                        if(section) section.style.display = 'none';
                    });
                    // The feature blocks themselves will be visible as direct children of timeSettingsView.
                } else { // When closing the settings view
                    // Also hide all detailed feature sections
                    allTimeFeatureSections.forEach(section => {
                        if(section) section.style.display = 'none';
                    });
                    // And hide the feature blocks (which will be added in next step as children of timeSettingsView)
                    // For now, this part is conceptual as blocks aren't there yet.
                    // document.querySelectorAll('.time-feature-block').forEach(block => block.style.display = 'none');
                }
            }
        });
    }
    // Removed showTimeFeatureSection function.
    // New function to handle showing one section and hiding blocks.
    function showDetailedSettingsSection(sectionToShow) {
        if (timeFeatureBlocksContainer) timeFeatureBlocksContainer.style.display = 'none';
        allTimeFeatureSections.forEach(section => {
            if (section) section.style.display = (section === sectionToShow) ? 'block' : 'none';
        });
    }

    function showFeatureBlocks() {
        if (timeFeatureBlocksContainer) timeFeatureBlocksContainer.style.display = 'flex'; // Or 'block' depending on desired layout for blocks
        allTimeFeatureSections.forEach(section => {
            if (section) section.style.display = 'none';
        });
        // Reset active class from any specific feature blocks if needed, though not strictly necessary here
        // as they are not "menu buttons" in the same way.
    }

    // Adapt #compact-time-display click listener
    if (compactTimeDisplay) { // This is the main PC clock display
        compactTimeDisplay.addEventListener('click', () => {
            if (timeSettingsView) {
                const isSettingsHidden = timeSettingsView.style.display === 'none';
                timeSettingsView.style.display = isSettingsHidden ? 'block' : 'none';
                if (isSettingsHidden) { // When opening the settings view
                    showFeatureBlocks(); // Show the main feature blocks, hide detailed sections
                } else { // When closing the settings view
                    showFeatureBlocks(); // Also ensure details are hidden and blocks would be shown if view was not closing
                }
            }
        });
    }


    // Add listeners to new feature blocks
    if (timerFeatureBlock) {
        timerFeatureBlock.addEventListener('click', () => {
            if (timerIntervalId || isTimerPaused) { // Timer is active or paused, so toggle pause/resume
                if (isTimerPaused) {
                    startTimer(); // This will resume
                } else {
                    pauseTimer();
                }
            } else { // Timer is idle, so show settings
                showDetailedSettingsSection(timerSettingsSection);
                // Ensure timer inputs are enabled and buttons are in correct initial state
                enableTimerInputs(true);
                if(startTimerButton) { startTimerButton.disabled = false; startTimerButton.textContent = "Start"; }
                if(pauseTimerButton) { pauseTimerButton.disabled = true; }
                updateTimerDisplayDOM(0, false); // Ensure display in settings is 00:00:00
            }
        });

        timerFeatureBlock.addEventListener('dblclick', () => {
            if (timerIntervalId || isTimerPaused) { // Only if timer is active or paused
                showDetailedSettingsSection(timerSettingsSection);
                // Ensure buttons/inputs in settings reflect current state
                if (startTimerButton) {
                    startTimerButton.disabled = !isTimerPaused;
                    startTimerButton.textContent = isTimerPaused ? "Resume" : "Start";
                }
                if (pauseTimerButton) pauseTimerButton.disabled = isTimerPaused;
                enableTimerInputs(false); // Inputs should be disabled if timer is active/paused
            }
            // If timer is idle, dblclick could also open settings, same as single click.
            // Or do nothing if already handled by single click. For now, let single click handle idle.
        });
    }
    if (networkTimeFeatureBlock) {
        networkTimeFeatureBlock.addEventListener('click', () => showDetailedSettingsSection(networkTimeSettingsSection));
    }
    if (timezonesFeatureBlock) {
        timezonesFeatureBlock.addEventListener('click', () => showDetailedSettingsSection(timezonesSettingsSection));
    }

    // Add listeners to "Back to Features" buttons
    document.querySelectorAll('.back-to-features-btn').forEach(button => {
        button.addEventListener('click', showFeatureBlocks);
    });


    if (closeTimeSettingsButton) {
        closeTimeSettingsButton.addEventListener('click', () => {
            if (timeSettingsView) {
                timeSettingsView.style.display = 'none';
                // When closing main settings, ensure feature blocks are conceptually ready to be shown next time
                // and detailed sections are hidden (showFeatureBlocks does this).
                showFeatureBlocks();
            }
        });
    }


    // --- Network Time Sync Placeholder ---
    if (syncNetworkTimeButton) {
        syncNetworkTimeButton.addEventListener('click', () => {
            if (networkTimeDisplay) {
                networkTimeDisplay.textContent = 'Fetching network time...';
                syncNetworkTimeButton.disabled = true; // Disable button during fetch
            }

            fetch('https://worldtimeapi.org/api/ip')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (networkTimeDisplay) {
                        const networkDateTime = new Date(data.datetime); // The API provides ISO 8601 datetime string
                        const timeString = networkDateTime.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZoneName: 'short'
                        });
                        const dateString = networkDateTime.toLocaleDateString(undefined, {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                        });
                        networkTimeDisplay.textContent = `Network Time: ${dateString}, ${timeString} (${data.timezone})`;
                    }
                })
                .catch(error => {
                    console.error('Error fetching network time:', error);
                    if (networkTimeDisplay) {
                        networkTimeDisplay.textContent = 'Error fetching time.';
                    }
                })
                .finally(() => {
                    if (syncNetworkTimeButton) {
                        syncNetworkTimeButton.disabled = false; // Re-enable button
                    }
                });
        });
    }


    // --- Time Zone Functions Placeholder ---
    /**
     * Populates the time zone select dropdowns.
     */
    function populateTimeZoneSelects() {
        [timezoneSelect1, timezoneSelect2].forEach(selectElement => {
            if (!selectElement) return;
            // Add a default "Select a zone" option
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "Select a time zone...";
            defaultOption.disabled = true; // Disable it so it can't be "selected" after choosing another
            defaultOption.selected = true; // Make it the default shown
            selectElement.appendChild(defaultOption);

            SAMPLE_TIMEZONES.forEach(tz => {
                const option = document.createElement('option');
                option.value = tz.value;
                option.textContent = tz.label;
                selectElement.appendChild(option);
            });
        });
    }

    // --- Time Zone Functions ---
    let selectedTimeZone1 = localStorage.getItem('timezone-select-1_selectedZone') || "";
    let selectedTimeZone2 = localStorage.getItem('timezone-select-2_selectedZone') || "";

    // Get references to the new display spans in the feature block
    const featureTz1Display = document.getElementById('feature-tz1-display');
    const featureTz2Display = document.getElementById('feature-tz2-display');

    /**
     * Formats and displays time for a given IANA timezone.
     * @param {string} timeZone - The IANA timezone string.
     * @param {HTMLElement} displayElement - The HTML element to display the time in.
     * @param {string} defaultText - Text to show if timezone is not set.
     */
    function displayTimeForZone(timeZone, displayElement, defaultText = "Select a zone") {
        if (!timeZone || !displayElement) {
            if(displayElement) displayElement.textContent = defaultText;
            return;
        }
        try {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { // Using en-US for consistency, locale can be dynamic
                timeZone: timeZone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                // timeZoneName: 'short' // Can be verbose, consider removing or making optional
            });
            displayElement.textContent = timeString;
        } catch (error) {
            console.error(`Error formatting time for zone ${timeZone}:`, error);
            displayElement.textContent = "Invalid zone";
        }
    }

    /**
     * Populates the time zone select dropdowns.
     */
    function populateTimeZoneSelects() {
        [timezoneSelect1, timezoneSelect2].forEach((selectElement, index) => {
            if (!selectElement) return;

            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "Select a time zone...";
            // defaultOption.disabled = true; // Keep it selectable to "unset"
            selectElement.appendChild(defaultOption);

            SAMPLE_TIMEZONES.forEach(tz => {
                const option = document.createElement('option');
                option.value = tz.value;
                option.textContent = tz.label;
                selectElement.appendChild(option);
            });

            // Set initial value from localStorage
            const savedZone = index === 0 ? selectedTimeZone1 : selectedTimeZone2;
            if (savedZone) {
                selectElement.value = savedZone;
            }
        });
    }

    function handleTimeZoneChange(event, displayElement) {
        const selectedZone = event.target.value;
        if (event.target === timezoneSelect1) {
            selectedTimeZone1 = selectedZone;
        } else if (event.target === timezoneSelect2) {
            selectedTimeZone2 = selectedZone;
        }

        localStorage.setItem(event.target.id + '_selectedZone', selectedZone);
        displayTimeForZone(selectedZone, displayElement);
    }

    // Event listeners for dropdowns in the detailed settings section
    if (timezoneSelect1) timezoneSelect1.addEventListener('change', (e) => handleTimeZoneChange(e, timezoneDisplay1));
    if (timezoneSelect2) timezoneSelect2.addEventListener('change', (e) => handleTimeZoneChange(e, timezoneDisplay2));


    function updateDisplayedZoneTimes() {
        // Update the displays within the detailed settings section (if visible)
        displayTimeForZone(selectedTimeZone1, timezoneDisplay1, "Zone 1: Select");
        displayTimeForZone(selectedTimeZone2, timezoneDisplay2, "Zone 2: Select");

        // Update the displays within the #timezones-feature-block
        // Use more descriptive default text for the feature block if zones are not set
        const defaultFeatureText1 = "Zone 1: --:--:--";
        const defaultFeatureText2 = "Zone 2: --:--:--";

        if (featureTz1Display) {
             displayTimeForZone(selectedTimeZone1, featureTz1Display, defaultFeatureText1);
        }
        if (featureTz2Display) {
            displayTimeForZone(selectedTimeZone2, featureTz2Display, defaultFeatureText2);
        }
    }

    // Load initial times for selected zones
    function loadSelectedTimeZones() {
        // Values for selectedTimeZone1 & selectedTimeZone2 are already loaded from localStorage at the top
        populateTimeZoneSelects(); // Populates <select> elements AND sets their initial values from selectedTimeZone1/2
        updateDisplayedZoneTimes(); // Initial display of times in both detailed view and feature block
    }


    // --- Drag and Drop Widget Logic ---
    const draggableWidgets = [calendarWidgetArea, timeWidgetArea].filter(el => el); // Filter out nulls if some elements don't exist

    draggableWidgets.forEach(widget => {
        if (!widget) return; // Should be filtered, but good practice

        widget.addEventListener('dragstart', (event) => {
            event.target.classList.add('dragging');
            event.dataTransfer.setData('text/plain', event.target.id);
            event.dataTransfer.effectAllowed = 'move'; // Indicate it's a move operation
        });

        widget.addEventListener('dragend', (event) => {
            event.target.classList.remove('dragging');
        });
    });

    if (mainContentArea) {
        mainContentArea.addEventListener('dragover', (event) => {
            event.preventDefault(); // Necessary to allow dropping
            event.dataTransfer.dropEffect = 'move';

            const draggingElement = document.querySelector('.dragging');
            if (!draggingElement) return;

            // Remove previous highlights from all widgets
            draggableWidgets.forEach(widget => {
                widget.classList.remove('drop-target-highlight-before', 'drop-target-highlight-after');
            });

            const afterElement = getDragAfterElement(mainContentArea, event.clientY);

            if (afterElement == null) { // Dropping at the end
                // If you want a specific placeholder for the end, you could add it here.
                // For now, if it's at the end, no specific highlight on a sibling.
                // Or, highlight the last element to drop "after" it.
                const lastWidget = mainContentArea.querySelector('[draggable="true"]:not(.dragging):last-child');
                if (lastWidget) {
                    lastWidget.classList.add('drop-target-highlight-after');
                }
            } else { // Dropping before 'afterElement'
                if (afterElement !== draggingElement) { // Don't highlight self
                    afterElement.classList.add('drop-target-highlight-before');
                }
            }
        });

        // Clean up highlights when dragging leaves the container
        mainContentArea.addEventListener('dragleave', (event) => {
            // Check if the relatedTarget (where the mouse is going) is outside mainContentArea
            if (!mainContentArea.contains(event.relatedTarget) ) {
                 draggableWidgets.forEach(widget => {
                    widget.classList.remove('drop-target-highlight-before', 'drop-target-highlight-after');
                });
            }
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    if (mainContentArea) {
        mainContentArea.addEventListener('drop', (event) => {
            event.preventDefault();
            const draggedElementId = event.dataTransfer.getData('text/plain');
            const draggedElement = document.getElementById(draggedElementId);

            if (!draggedElement) return;

            // Remove all highlights first
            draggableWidgets.forEach(widget => {
                widget.classList.remove('drop-target-highlight-before', 'drop-target-highlight-after');
            });

            const afterElement = getDragAfterElement(mainContentArea, event.clientY);

            if (afterElement == null) {
                mainContentArea.appendChild(draggedElement);
            } else {
                mainContentArea.insertBefore(draggedElement, afterElement);
            }

            saveWidgetOrder();
        });
    }

    // --- Widget Order Persistence ---
    function saveWidgetOrder() {
        if (!mainContentArea) return;
        const orderedWidgetIds = Array.from(mainContentArea.children)
            .filter(child => child.draggable) // Ensure we only save IDs of draggable widgets
            .map(child => child.id);
        localStorage.setItem('widgetOrder', JSON.stringify(orderedWidgetIds));
        console.log("Widget order saved:", orderedWidgetIds);
    }

    function loadWidgetOrder() {
        if (!mainContentArea) return;
        const savedOrder = localStorage.getItem('widgetOrder');
        if (savedOrder) {
            const orderedIds = JSON.parse(savedOrder);
            console.log("Loading saved widget order:", orderedIds);

            // Create a map of current elements by ID for easy lookup
            const currentWidgetsMap = new Map();
            Array.from(mainContentArea.children).forEach(child => {
                if (child.id) {
                    currentWidgetsMap.set(child.id, child);
                }
            });

            // Re-append elements in the saved order
            orderedIds.forEach(id => {
                const widget = currentWidgetsMap.get(id);
                if (widget) {
                    mainContentArea.appendChild(widget); // Re-appending moves the element
                }
            });
        }
    }


    function handleSummaryItemClick(event) {
        const clickedItem = event.target.closest('.clickable-summary-emoji');
        if (!clickedItem) return;

        const emoji = clickedItem.dataset.emoji;
        const period = clickedItem.dataset.period;
        const year = parseInt(clickedItem.dataset.year);
        const month = parseInt(clickedItem.dataset.month); // 0-indexed

        const detailView = document.getElementById('summary-emoji-dates-detail');
        const detailContent = document.getElementById('summary-emoji-dates-content');
        const summaryListDisplay = document.getElementById('summary-list-display');
        const periodSelector = document.getElementById('summary-period-selector');

        if (!detailView || !detailContent || !summaryListDisplay || !periodSelector) return;

        detailContent.innerHTML = ''; // Clear previous details

        let title = `<h5>Dates for ${emoji}`;
        const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"];
        if (period === "month") {
            title += ` in ${monthNames[month]} ${year}`;
        } else if (period === "year") {
            title += ` in ${year}`;
        } else {
            title += ` (All Time)`;
        }
        title += "</h5>";
        detailContent.innerHTML = title;

        const datesForEmoji = [];
        const dataToFilter = getFilteredEmojiData(period, year, month); // Get data for the specific period

        for (const dateKey in dataToFilter) {
            const emojisOnDate = dataToFilter[dateKey]; // This is an array
            if (Array.isArray(emojisOnDate) && emojisOnDate.includes(emoji)) {
                datesForEmoji.push(dateKey);
            }
        }

        if (datesForEmoji.length > 0) {
            const ul = document.createElement('ul');
            // Sort dates chronologically before displaying
            datesForEmoji.sort((a,b) => new Date(a) - new Date(b));
            datesForEmoji.forEach(dateStr => {
                const li = document.createElement('li');
                // Optionally format dateStr for better readability
                const d = new Date(dateStr + 'T00:00:00'); // Ensure correct date parsing
                li.textContent = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
                ul.appendChild(li);
            });
            detailContent.appendChild(ul);
        } else {
            detailContent.innerHTML += '<p>No specific dates found for this emoji in the selected period.</p>';
        }

        summaryListDisplay.style.display = 'none';
        periodSelector.style.display = 'none'; // Hide period selector when showing details
        detailView.style.display = 'block';
    }


    // --- Timer Helper Functions ---
    /**
     * Reads timer input fields and returns total duration in seconds.
     * Also updates timerDurationSet.
     * @returns {number} Total duration in seconds.
     */
    function getTimerDurationFromInputs() {
        const hours = parseInt(timerHoursInput.value) || 0;
        const minutes = parseInt(timerMinutesInput.value) || 0;
        const seconds = parseInt(timerSecondsInput.value) || 0;
        timerDurationSet = (hours * 3600) + (minutes * 60) + seconds;
        return timerDurationSet;
    }

    /**
     * Formats total seconds into HH:MM:SS string.
     * @param {number} totalSeconds - Total seconds to format.
     * @returns {string} Formatted time string (HH:MM:SS).
     */
    function formatTime(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    /**
     * Updates the timer display DOM element.
     * @param {number} timeInSeconds - Time in seconds to display.
     * @param {boolean} isTimerRunning - Indicates if the timer is actively running (not paused, not idle).
     */
    function updateTimerDisplayDOM(timeInSeconds, isTimerRunning = false) {
        const formattedTime = formatTime(timeInSeconds);
        const timerBlockDisplaySpan = document.getElementById('timer-block-display');

        if (timerBlockDisplaySpan) {
            if (isTimerRunning) {
                timerBlockDisplaySpan.textContent = formattedTime;
                if (timerFeatureBlock) timerFeatureBlock.classList.add('timer-block-running');
                if (timerFeatureBlock) timerFeatureBlock.classList.remove('timer-block-paused');
            } else if (isTimerPaused && timeInSeconds > 0) { // Specific paused state handled by pauseTimer
                // This case will be handled by pauseTimer directly setting text and class
            }
            else { // Timer is reset, finished and reverted, or not set
                timerBlockDisplaySpan.textContent = "Set Timer";
                if (timerFeatureBlock) {
                    timerFeatureBlock.classList.remove('timer-block-running', 'timer-block-paused');
                }
            }
        }

        if (timerDisplay) { // This is the display inside the #timer-settings-section
            timerDisplay.textContent = formattedTime; // Always show current countdown or 00:00:00 here
        }
    }


    // --- Timer Core Logic ---
    function timerFinished() {
        alert("Timer Finished!");

        if (startTimerButton) {
             startTimerButton.disabled = false;
             startTimerButton.textContent = "Start";
        }
        if (pauseTimerButton) pauseTimerButton.disabled = true;

        const timerBlockDisplaySpan = document.getElementById('timer-block-display');
        if(timerBlockDisplaySpan && timerFeatureBlock) {
            timerBlockDisplaySpan.textContent = "Timer Done!";
            timerFeatureBlock.classList.remove('timer-block-running', 'timer-block-paused');
             setTimeout(() => {
                // Check if still in a finished state (not reset or a new timer started)
                if (timerTimeRemaining <= 0 && !timerIntervalId && !isTimerPaused) {
                    timerBlockDisplaySpan.textContent = "Set Timer";
                }
            }, 3000);
        }
        enableTimerInputs(true); // Re-enable inputs when timer is truly done
    }

    function tickTimer() {
        if (isTimerPaused) return;

        timerTimeRemaining--;
        updateTimerDisplayDOM(timerTimeRemaining, true); // True indicates timer is running

        if (timerTimeRemaining < 0) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
            timerFinished();
            timerTimeRemaining = 0;
            updateTimerDisplayDOM(timerTimeRemaining, false); // Not active anymore
        }
    }

    function enableTimerInputs(enable) {
        if (timerHoursInput) timerHoursInput.disabled = !enable;
        if (timerMinutesInput) timerMinutesInput.disabled = !enable;
        if (timerSecondsInput) timerSecondsInput.disabled = !enable;
    }

    function startTimer() {
        if (!timerHoursInput || !timerMinutesInput || !timerSecondsInput || !startTimerButton || !pauseTimerButton) return;

        if (timerIntervalId && !isTimerPaused) return; // Already running

        if (!isTimerPaused || timerTimeRemaining <= 0) {
            getTimerDurationFromInputs();
            if (timerDurationSet <= 0) {
                alert("Please set a timer duration greater than 0.");
                return;
            }
            timerTimeRemaining = timerDurationSet;
        }

        isTimerPaused = false;
        if (timerIntervalId) clearInterval(timerIntervalId);

        updateTimerDisplayDOM(timerTimeRemaining, true); // Update display, indicate timer is running
        timerIntervalId = setInterval(tickTimer, 1000);

        if (timerSettingsSection) {
            timerSettingsSection.style.display = 'none'; // Hide detailed settings
        }
        if (timeFeatureBlocksContainer) { // Ensure feature blocks (including updated timer block) are shown
            timeFeatureBlocksContainer.style.display = 'flex';
        }
        // Note: The above might conflict if showDetailedSettingsSection was called by another feature block.
        // The expectation is that starting timer returns to the "feature blocks" view.
        // So, it's better to call showFeatureBlocks()
        showFeatureBlocks(); // This will show all blocks and hide all detailed sections.

        if (timerFeatureBlock) { // Apply running style to the block
            timerFeatureBlock.classList.add('timer-block-running');
            timerFeatureBlock.classList.remove('timer-block-paused');
        }

        if (startTimerButton) startTimerButton.disabled = true;
        if (pauseTimerButton) pauseTimerButton.disabled = false;
        enableTimerInputs(false); // Disable input fields
    }

    function pauseTimer() {
        if (!timerIntervalId || isTimerPaused || !startTimerButton || !pauseTimerButton) return;

        clearInterval(timerIntervalId);
        isTimerPaused = true;

        const timerBlockDisplaySpan = document.getElementById('timer-block-display');
        if (timerBlockDisplaySpan && timerFeatureBlock) {
            timerBlockDisplaySpan.textContent = `Paused: ${formatTime(timerTimeRemaining)}`;
            timerFeatureBlock.classList.add('timer-block-paused');
            timerFeatureBlock.classList.remove('timer-block-running');
        }
        // Also update the display within settings if it's open (which it usually won't be on pause via compact click)
        if (timerDisplay) timerDisplay.textContent = formatTime(timerTimeRemaining);


        if (startTimerButton) {
            startTimerButton.disabled = false;
            startTimerButton.textContent = "Resume";
        }
        if (pauseTimerButton) pauseTimerButton.disabled = true;
    }

    function resetTimer() {
        if (!timerDisplay || !startTimerButton || !pauseTimerButton || !timerHoursInput || !timerMinutesInput || !timerSecondsInput) return;

        clearInterval(timerIntervalId);
        timerIntervalId = null;
        isTimerPaused = false;
        timerTimeRemaining = 0;
        timerDurationSet = 0;

        updateTimerDisplayDOM(0, false); // This updates timer-block-display via its logic

        // No need to update timerFeatureBlock text/class here, updateTimerDisplayDOM handles it.

        if (startTimerButton) {
            startTimerButton.disabled = false;
            startTimerButton.textContent = "Start";
        }
        if (pauseTimerButton) pauseTimerButton.disabled = true;

        enableTimerInputs(true);
        timerHoursInput.disabled = false;
        timerMinutesInput.disabled = false;
        timerSecondsInput.disabled = false;
        timerHoursInput.value = 0;
        timerMinutesInput.value = 0;
        timerSecondsInput.value = 0;
    }


    // --- Timer Event Listeners ---
    if (startTimerButton) {
        startTimerButton.addEventListener('click', startTimer);
    }
    if (pauseTimerButton) {
        pauseTimerButton.addEventListener('click', pauseTimer);
    }
    if (resetTimerButton) {
        resetTimerButton.addEventListener('click', resetTimer);
    }


    // --- Initialization ---
    renderCompactDateDisplay(); // Display compact date first
    updateLiveClock(); // Initial call to set time immediately
    setInterval(updateLiveClock, 1000); // Update time every second

    if(timeSettingsView) timeSettingsView.style.display = 'none'; // Ensure it's hidden on init

    loadSelectedTimeZones(); // Populates dropdowns, loads saved selections, and displays initial times
    setInterval(updateDisplayedZoneTimes, 1000); // Update displayed time zone times every second

    loadWidgetOrder(); // Load and apply saved widget order

    // Initialize timer display if the element exists
    if (timerDisplay) {
        updateTimerDisplayDOM(0);
    }

    // Add the delegated event listener for summary item clicks to fullCalendarView
    if (fullCalendarView) {
        fullCalendarView.addEventListener('click', handleSummaryItemClick);
    }


    // updateEmojiSummary(); // Summary is now part of full calendar, and updated when shown.
                             // No need to call it here on initial load as summary panel is hidden.

    console.log("JS Desktop App Initialized: Compact date and time shown. Widgets ready for drag/drop setup.");
});
