document.addEventListener('DOMContentLoaded', () => {
    // Main application container
    const appContainer = document.getElementById('app-container');
    const mainContentArea = document.getElementById('main-content-area');

    // Calendar related elements
    const calendarWidgetArea = document.getElementById('calendar-widget-area');
    const compactDateDisplay = document.getElementById('compact-date-display');
    const compactDateText = document.getElementById('compact-date-text');
    const fullCalendarView = document.getElementById('full-calendar-view');

    // Time Widget related elements
    const timeWidgetArea = document.getElementById('time-widget-area');
    const pcClockDisplay = document.getElementById('compact-time-display');
    const currentTimeText = document.getElementById('current-time-text');
    const timeSettingsView = document.getElementById('time-settings-view');
    const closeTimeSettingsButton = document.getElementById('close-time-settings');
    const syncNetworkTimeButton = document.getElementById('sync-network-time-button');
    const networkTimeDisplay = document.getElementById('network-time-display');
    const timezoneSelect1 = document.getElementById('timezone-select-1');
    const timezoneDisplay1 = document.getElementById('timezone-display-1');
    const timezoneSelect2 = document.getElementById('timezone-select-2');
    const timezoneDisplay2 = document.getElementById('timezone-display-2');
    const featureTz1Display = document.getElementById('feature-tz1-display');
    const featureTz2Display = document.getElementById('feature-tz2-display');
    const timerHoursInput = document.getElementById('timer-hours');
    const timerMinutesInput = document.getElementById('timer-minutes');
    const timerSecondsInput = document.getElementById('timer-seconds');
    const timerDisplay = document.getElementById('timer-display');
    const startTimerButton = document.getElementById('start-timer');
    const pauseTimerButton = document.getElementById('pause-timer');
    const resetTimerButton = document.getElementById('reset-timer');
    const alarmBlockStatus = document.getElementById('alarm-block-status');
    const newAlarmTimeInput = document.getElementById('new-alarm-time');
    const newAlarmLabelInput = document.getElementById('new-alarm-label');
    const addAlarmButton = document.getElementById('add-alarm-button');
    const alarmsListDiv = document.getElementById('alarms-list');
    const alarmSoundSelect = document.getElementById('alarm-sound-select');
    const previewAlarmSoundBtn = document.getElementById('preview-alarm-sound-btn');
    const stopwatchBlockDisplay = document.getElementById('stopwatch-block-display');
    const stopwatchMainDisplay = document.getElementById('stopwatch-main-display');
    const startStopwatchButton = document.getElementById('start-stopwatch');
    const stopStopwatchButton = document.getElementById('stop-stopwatch');
    const lapStopwatchButton = document.getElementById('lap-stopwatch');
    const resetStopwatchButton = document.getElementById('reset-stopwatch');
    const lapsList = document.getElementById('laps-list');
    const timeFeatureBlocksContainer = document.getElementById('time-feature-blocks-container');
    const timerFeatureBlock = document.getElementById('timer-feature-block');
    const networkTimeFeatureBlock = document.getElementById('network-time-feature-block');
    const timezonesFeatureBlock = document.getElementById('timezones-feature-block');
    const alarmFeatureBlock = document.getElementById('alarm-feature-block');
    const stopwatchFeatureBlock = document.getElementById('stopwatch-feature-block');
    const allTimeFeatureBlocks = [timerFeatureBlock, networkTimeFeatureBlock, timezonesFeatureBlock, alarmFeatureBlock, stopwatchFeatureBlock].filter(el => el);
    const timerSettingsSection = document.getElementById('timer-settings-section');
    const networkTimeSettingsSection = document.getElementById('network-time-settings-section');
    const timezonesSettingsSection = document.getElementById('timezones-settings-section');
    const alarmSettingsSection = document.getElementById('alarm-settings-section');
    const stopwatchSettingsSection = document.getElementById('stopwatch-settings-section');
    const allTimeFeatureSections = [timerSettingsSection, networkTimeSettingsSection, timezonesSettingsSection, alarmSettingsSection, stopwatchSettingsSection].filter(el => el);

    const visualNotificationOverlay = document.getElementById('visual-notification-overlay');
    const notificationImage = document.getElementById('notification-image');
    const dismissNotificationBtn = document.getElementById('dismiss-notification-btn');

    // --- Crypto Widget Elements (3-Slot Version) ---
    const cryptoWidgetArea = document.getElementById('crypto-widget-area');
    const compactCryptoDisplay = document.getElementById('compact-crypto-display'); // Main compact view
    const compactCryptoSlots = [
        document.getElementById('crypto-slot-1'),
        document.getElementById('crypto-slot-2'),
        document.getElementById('crypto-slot-3')
    ];
    const expandedCryptoView = document.getElementById('expanded-crypto-view');
    const cryptoBackToCompactBtn = document.getElementById('crypto-back-to-compact-btn');
    const cryptoDisplaySlots = [
        document.getElementById('crypto-display-slot-0'),
        document.getElementById('crypto-display-slot-1'),
        document.getElementById('crypto-display-slot-2')
    ];
    // Arrays for elements within each display slot
    const cryptoPriceButtonViews = [];
    const cryptoChartModeViews = [];
    const cryptoPairSelectors = [];
    const cryptoTVChartContainers = [];
    const cryptoSlotPairNameSpans = [];
    const cryptoSlotPairPriceSpans = [];

    cryptoDisplaySlots.forEach((slot, index) => {
        if (slot) {
            cryptoPriceButtonViews[index] = slot.querySelector('.crypto-price-button-view');
            cryptoChartModeViews[index] = slot.querySelector('.crypto-chart-mode-view');
            cryptoPairSelectors[index] = slot.querySelector(`#pair-selector-slot-${index}`);
            cryptoTVChartContainers[index] = slot.querySelector(`#tv-chart-container-slot-${index}`);
            if (cryptoPriceButtonViews[index]) {
                cryptoSlotPairNameSpans[index] = cryptoPriceButtonViews[index].querySelector('.slot-pair-name');
                cryptoSlotPairPriceSpans[index] = cryptoPriceButtonViews[index].querySelector('.slot-pair-price');
            }
        }
    });


    // Constants & State Variables
    const SAMPLE_TIMEZONES = [
        { value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'New York (EST/EDT)' },
        { value: 'Europe/London', label: 'London (GMT/BST)' }, { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
        { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' }, { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
        { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    ];
    let currentDate = new Date();
    let emojiData = loadEmojiData();
    const PREDEFINED_EMOJIS = ['😊', '🎉', '⛽', '❤️', '🛒', '💼', '✈️', '🛠️'];
    let timerDurationSet = 0, timerTimeRemaining = 0, timerIntervalId = null, isTimerPaused = false;
    let stopwatchStartTime = 0, stopwatchElapsedTime = 0, stopwatchIntervalId = null, isStopwatchRunning = false, laps = [];
    let alarms = [];
    const ALARMS_STORAGE_KEY = 'userAlarms';
    const DEFAULT_ALARM_SOUNDS = [
        { name: "Default Beep", file: "assets/sounds/default_alarm.mp3" }, { name: "Chime", file: "assets/sounds/chime.mp3" },
        { name: "Bell", file: "assets/sounds/bell.mp3" }, { name: "Digital", file: "assets/sounds/digital_alarm.mp3" }
    ];
    const ALARM_SOUND_STORAGE_KEY = 'selectedAlarmSoundFile';
    let currentSelectedAlarmSound = localStorage.getItem(ALARM_SOUND_STORAGE_KEY) || (DEFAULT_ALARM_SOUNDS[0]?.file || "");
    let currentSummaryPeriod = "all", lastCheckedMinute = -1, activeEmojiPicker = null;

    // --- NEW Crypto Widget State & Data (3-Slot Version) ---
    const COINGECKO_COINS_LIST_URL = 'https://api.coingecko.com/api/v3/coins/list?include_platform=false';
    const COINGECKO_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price'; //?ids=bitcoin&vs_currencies=usd
    const CRYPTO_STORAGE_KEY_SLOT_PAIRS = 'cryptoSlotPairsV1';
    const CRYPTO_STORAGE_KEY_ACTIVE_SLOT = 'cryptoActiveSlotV1';

    let availableCryptoCoins = []; // To store {id, symbol, name, tvSymbol}
    let cryptoSlotPairsData = []; // Array of 3 objects: {id, symbol, name, tvSymbol}
    let activeCryptoChartSlotIndex = 0;
    let tradingViewWidgets = [null, null, null]; // To hold TradingView widget instances for each slot

    const DEFAULT_CRYPTO_SLOT_PAIRS = [
        { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', tvSymbol: 'BINANCE:BTCUSDT' },
        { id: 'ethereum', symbol: 'eth', name: 'Ethereum', tvSymbol: 'BINANCE:ETHUSDT' },
        { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', tvSymbol: 'BINANCE:DOGEUSDT' }
    ];

    // --- Calendar Functions (Largely Unchanged) ---
    function renderCompactDateDisplay() { if (compactDateText) { compactDateText.textContent = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); } }
    if (compactDateDisplay) { compactDateDisplay.addEventListener('click', () => { if (appContainer) appContainer.classList.remove('expanded-crypto'); if (appContainer) appContainer.classList.add('expanded'); if (compactDateDisplay) compactDateDisplay.style.display = 'none'; if (fullCalendarView) fullCalendarView.style.display = 'block'; renderCalendar(currentDate.getFullYear(), currentDate.getMonth()); }); }
    function closeFullCalendar() { if (appContainer) appContainer.classList.remove('expanded'); if (fullCalendarView) { fullCalendarView.style.display = 'none'; fullCalendarView.innerHTML = ''; } if (compactDateDisplay) compactDateDisplay.style.display = 'block'; renderCompactDateDisplay(); }
    function saveEmojiData() { localStorage.setItem('calendarEmojiData', JSON.stringify(emojiData)); }
    function loadEmojiData() { const data = localStorage.getItem('calendarEmojiData'); return data ? JSON.parse(data) : {}; }
    function addEmojiToDate(dateKey, emojiToToggle) { if (!emojiData[dateKey] || !Array.isArray(emojiData[dateKey])) { emojiData[dateKey] = []; } const emojiIndex = emojiData[dateKey].indexOf(emojiToToggle); if (emojiToToggle === '') { emojiData[dateKey] = []; } else if (emojiIndex > -1) { emojiData[dateKey].splice(emojiIndex, 1); } else { emojiData[dateKey].push(emojiToToggle); } saveEmojiData(); renderCalendar(currentDate.getFullYear(), currentDate.getMonth()); const summaryPanel = document.getElementById('calendar-internal-summary'); if (summaryPanel && summaryPanel.style.display !== 'none') { updateEmojiSummary(); } }
    function getFilteredEmojiData(periodType, referenceYear, referenceMonth) { if (periodType === "all") return { ...emojiData }; const filtered = {}; for (const dateKey in emojiData) { const [year, month] = dateKey.split('-').map(Number); if (periodType === "year" && year === referenceYear) { filtered[dateKey] = emojiData[dateKey]; } else if (periodType === "month" && year === referenceYear && (month - 1) === referenceMonth) { filtered[dateKey] = emojiData[dateKey]; } } return filtered; }
    function updateEmojiSummary() { const summaryListDisplay = document.getElementById('summary-list-display'); if (!summaryListDisplay) return; const referenceYear = currentDate.getFullYear(); const referenceMonth = currentDate.getMonth(); const filteredData = getFilteredEmojiData(currentSummaryPeriod, referenceYear, referenceMonth); summaryListDisplay.innerHTML = ''; let summaryTitleText = "Emoji Summary - "; const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; if (currentSummaryPeriod === "month") summaryTitleText += `${monthNames[referenceMonth]} ${referenceYear}`; else if (currentSummaryPeriod === "year") summaryTitleText += `${referenceYear}`; else summaryTitleText += "All Time"; const periodButtons = document.querySelectorAll('#summary-period-selector button'); periodButtons.forEach(button => button.classList.toggle('active-period', button.dataset.period === currentSummaryPeriod)); if (Object.keys(filteredData).length === 0) { summaryListDisplay.innerHTML = `<h4>${summaryTitleText}</h4><p>No emojis recorded for this period.</p>`; return; } const counts = {}; for (const dateKey in filteredData) { const emojisOnDate = filteredData[dateKey]; if (Array.isArray(emojisOnDate)) { emojisOnDate.forEach(emoji => { if (emoji) counts[emoji] = (counts[emoji] || 0) + 1; }); } } if (Object.keys(counts).length === 0) { summaryListDisplay.innerHTML = `<h4>${summaryTitleText}</h4><p>No emojis recorded for this period.</p>`; return; } const sortedSummary = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); let summaryHTML = `<h4>${summaryTitleText}</h4><ul>`; if (sortedSummary.length > 0) { sortedSummary.forEach(([emoji, count]) => { summaryHTML += `<li class="clickable-summary-emoji" data-emoji="${emoji}" data-period="${currentSummaryPeriod}" data-year="${referenceYear}" data-month="${referenceMonth}">${emoji} : ${count}</li>`; }); } summaryHTML += '</ul>'; summaryListDisplay.innerHTML = summaryHTML; }
    function renderCalendar(year, month) { if (!fullCalendarView) return; fullCalendarView.innerHTML = ''; const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; const header = document.createElement('div'); header.className = 'calendar-header'; const prevButton = document.createElement('button'); prevButton.id = 'prev-month'; prevButton.textContent = '< Prev'; prevButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate.getFullYear(), currentDate.getMonth()); const summaryPanel = document.getElementById('calendar-internal-summary'); if (summaryPanel && summaryPanel.style.display !== 'none' && (currentSummaryPeriod === 'month' || currentSummaryPeriod === 'year')) updateEmojiSummary(); }); const monthYearLabel = document.createElement('h3'); monthYearLabel.id = 'month-year-label'; monthYearLabel.textContent = `${monthNames[month]} ${year}`; const nextButton = document.createElement('button'); nextButton.id = 'next-month'; nextButton.textContent = 'Next >'; nextButton.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate.getFullYear(), currentDate.getMonth()); const summaryPanel = document.getElementById('calendar-internal-summary'); if (summaryPanel && summaryPanel.style.display !== 'none' && (currentSummaryPeriod === 'month' || currentSummaryPeriod === 'year')) updateEmojiSummary(); }); header.appendChild(prevButton); header.appendChild(monthYearLabel); header.appendChild(nextButton); const closeButton = document.createElement('button'); closeButton.id = 'close-calendar'; closeButton.textContent = 'Close'; closeButton.addEventListener('click', closeFullCalendar); const summaryButton = document.createElement('button'); summaryButton.id = 'toggle-summary-calendar'; summaryButton.textContent = 'Summary'; summaryButton.addEventListener('click', () => { const summaryPanel = document.getElementById('calendar-internal-summary'); if (summaryPanel) { const isHidden = summaryPanel.style.display === 'none'; summaryPanel.style.display = isHidden ? 'block' : 'none'; if (isHidden) updateEmojiSummary(); summaryButton.textContent = isHidden ? 'Hide Summary' : 'Summary'; } }); const actionButtonsGroup = document.createElement('div'); actionButtonsGroup.className = 'calendar-action-buttons'; actionButtonsGroup.appendChild(summaryButton); actionButtonsGroup.appendChild(closeButton); header.appendChild(actionButtonsGroup); fullCalendarView.appendChild(header); const summaryPanelContainer = document.createElement('div'); summaryPanelContainer.id = 'calendar-internal-summary'; summaryPanelContainer.style.display = 'none'; const summaryPanelContent = document.createElement('div'); summaryPanelContent.id = 'calendar-internal-summary-content'; const periodSelectorContainer = document.createElement('div'); periodSelectorContainer.id = 'summary-period-selector'; ["month", "year", "all"].forEach(pType => { const btn = document.createElement('button'); btn.dataset.period = pType; btn.textContent = pType === 'month' ? "Current Month" : pType === 'year' ? "Current Year" : "All Time"; periodSelectorContainer.appendChild(btn); }); periodSelectorContainer.querySelectorAll('button').forEach(button => { button.addEventListener('click', (event) => { currentSummaryPeriod = event.target.dataset.period; updateEmojiSummary(); }); }); summaryPanelContent.appendChild(periodSelectorContainer); const summaryListDisplay = document.createElement('div'); summaryListDisplay.id = 'summary-list-display'; summaryPanelContent.appendChild(summaryListDisplay); const emojiDatesDetailView = document.createElement('div'); emojiDatesDetailView.id = 'summary-emoji-dates-detail'; emojiDatesDetailView.style.display = 'none'; const detailContent = document.createElement('div'); detailContent.id = 'summary-emoji-dates-content'; const backButton = document.createElement('button'); backButton.id = 'back-to-summary-list'; backButton.textContent = '← Back to Summary'; emojiDatesDetailView.appendChild(backButton); emojiDatesDetailView.appendChild(detailContent); summaryPanelContent.appendChild(emojiDatesDetailView); summaryPanelContainer.appendChild(summaryPanelContent); fullCalendarView.appendChild(summaryPanelContainer); if (backButton) { backButton.addEventListener('click', () => { const detailView = document.getElementById('summary-emoji-dates-detail'); const listDisplay = document.getElementById('summary-list-display'); const periodSel = document.getElementById('summary-period-selector'); if (detailView) detailView.style.display = 'none'; if (listDisplay) listDisplay.style.display = 'block'; if (periodSel) periodSel.style.display = 'flex'; }); } const grid = document.createElement('div'); grid.className = 'calendar-grid'; dayNames.forEach(dayName => { const dayNameCell = document.createElement('div'); dayNameCell.className = 'day-name'; dayNameCell.textContent = dayName; grid.appendChild(dayNameCell); }); const firstDayOfMonth = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); for (let i = 0; i < firstDayOfMonth; i++) { const emptyCell = document.createElement('div'); emptyCell.classList.add('day-cell', 'other-month'); grid.appendChild(emptyCell); } const today = new Date(); for (let day = 1; day <= daysInMonth; day++) { const dayCell = document.createElement('div'); dayCell.classList.add('day-cell'); const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; dayCell.dataset.date = dateKey; const dayNumberSpan = document.createElement('span'); dayNumberSpan.className = 'day-number'; dayNumberSpan.textContent = day; dayCell.appendChild(dayNumberSpan); if (emojiData[dateKey] && Array.isArray(emojiData[dateKey]) && emojiData[dateKey].length > 0) { const emojiContainer = document.createElement('div'); emojiContainer.className = 'emoji-display-container'; emojiData[dateKey].forEach(emo => { const emojiSpan = document.createElement('span'); emojiSpan.className = 'emoji'; emojiSpan.textContent = emo; emojiContainer.appendChild(emojiSpan); }); dayCell.appendChild(emojiContainer); } if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) dayCell.classList.add('current-day'); dayCell.addEventListener('click', (event) => { const clickedDateKey = event.currentTarget.dataset.date; const targetElement = event.currentTarget; closeEmojiPicker(); openEmojiPicker(clickedDateKey, targetElement); }); grid.appendChild(dayCell); } const totalCells = firstDayOfMonth + daysInMonth; const remainingCells = (7 - (totalCells % 7)) % 7; for (let i = 0; i < remainingCells; i++) { const emptyCell = document.createElement('div'); emptyCell.classList.add('day-cell', 'other-month'); grid.appendChild(emptyCell); } fullCalendarView.appendChild(grid); }
    function openEmojiPicker(dateKey, targetElement) { closeEmojiPicker(); const picker = document.createElement('div'); picker.id = 'emoji-picker-popup'; PREDEFINED_EMOJIS.forEach(emojiSymbol => { const emojiButton = document.createElement('button'); emojiButton.textContent = emojiSymbol; if (emojiData[dateKey] && emojiData[dateKey].includes(emojiSymbol)) emojiButton.classList.add('picker-emoji-active'); emojiButton.addEventListener('click', () => { addEmojiToDate(dateKey, emojiSymbol); emojiButton.classList.toggle('picker-emoji-active'); }); picker.appendChild(emojiButton); }); const doneButton = document.createElement('button'); doneButton.textContent = 'Done'; doneButton.classList.add('picker-done-button'); doneButton.addEventListener('click', closeEmojiPicker); picker.appendChild(doneButton); const calendarView = targetElement.closest('#full-calendar-view'); if (!calendarView) { console.error("Could not find full-calendar-view to append emoji picker."); return; } calendarView.appendChild(picker); picker.style.position = 'absolute'; let top = targetElement.offsetTop + targetElement.offsetHeight + 2; let left = targetElement.offsetLeft; if (left + picker.offsetWidth > calendarView.offsetWidth) left = calendarView.offsetWidth - picker.offsetWidth - 5; if (left < 0) left = 5; picker.style.top = `${top}px`; picker.style.left = `${left}px`; activeEmojiPicker = picker; setTimeout(() => document.addEventListener('click', handleClickOutsidePicker, { capture: true, once: true }), 0); }
    function handleClickOutsidePicker(event) { if (activeEmojiPicker && !activeEmojiPicker.contains(event.target) && !event.target.closest('.day-cell')) closeEmojiPicker(); }
    function closeEmojiPicker() { if (activeEmojiPicker) { activeEmojiPicker.remove(); activeEmojiPicker = null; } }
    function handleSummaryItemClick(event) { const clickedItem = event.target.closest('.clickable-summary-emoji'); if (!clickedItem) return; const emoji = clickedItem.dataset.emoji; const period = clickedItem.dataset.period; const year = parseInt(clickedItem.dataset.year); const month = parseInt(clickedItem.dataset.month); const detailView = document.getElementById('summary-emoji-dates-detail'); const detailContent = document.getElementById('summary-emoji-dates-content'); const summaryListDisplay = document.getElementById('summary-list-display'); const periodSelector = document.getElementById('summary-period-selector'); if (!detailView || !detailContent || !summaryListDisplay || !periodSelector) return; detailContent.innerHTML = ''; let title = `<h5>Dates for ${emoji}`; const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; if (period === "month") title += ` in ${monthNames[month]} ${year}`; else if (period === "year") title += ` in ${year}`; else title += ` (All Time)`; title += "</h5>"; detailContent.innerHTML = title; const datesForEmoji = []; const dataToFilter = getFilteredEmojiData(period, year, month); for (const dateKey in dataToFilter) { const emojisOnDate = dataToFilter[dateKey]; if (Array.isArray(emojisOnDate) && emojisOnDate.includes(emoji)) datesForEmoji.push(dateKey); } if (datesForEmoji.length > 0) { const ul = document.createElement('ul'); datesForEmoji.sort((a,b) => new Date(a) - new Date(b)); datesForEmoji.forEach(dateStr => { const li = document.createElement('li'); const dateParts = dateStr.split('-'); const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])); li.textContent = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }); ul.appendChild(li); }); detailContent.appendChild(ul); } else { detailContent.innerHTML += '<p>No specific dates found for this emoji in the selected period.</p>'; } summaryListDisplay.style.display = 'none'; periodSelector.style.display = 'none'; detailView.style.display = 'block'; }

    // --- Time Widget Functions (Largely Unchanged) ---
    function updateLiveClock() { if (currentTimeText) { currentTimeText.textContent = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }); } }
    if (pcClockDisplay) { pcClockDisplay.addEventListener('click', () => { if (timeSettingsView) { const isSettingsHidden = timeSettingsView.style.display === 'none' || !timeSettingsView.style.display; timeSettingsView.style.display = isSettingsHidden ? 'block' : 'none'; showFeatureBlocks(); } }); }
    function showDetailedSettingsSection(sectionToShow) { if (timeFeatureBlocksContainer) timeFeatureBlocksContainer.style.display = 'none'; allTimeFeatureSections.forEach(section => { if (section) section.style.display = (section === sectionToShow) ? 'block' : 'none'; }); }
    function showFeatureBlocks() { if (timeFeatureBlocksContainer) timeFeatureBlocksContainer.style.display = 'flex'; allTimeFeatureSections.forEach(section => { if (section) section.style.display = 'none'; }); }
    if (timerFeatureBlock) { timerFeatureBlock.addEventListener('click', () => { if (timerIntervalId || isTimerPaused) { if (isTimerPaused) startTimer(); else pauseTimer(); } else { showDetailedSettingsSection(timerSettingsSection); enableTimerInputs(true); if(startTimerButton) { startTimerButton.disabled = false; startTimerButton.textContent = "Start"; } if(pauseTimerButton) { pauseTimerButton.disabled = true; } updateTimerDisplayDOM(0, false); } }); timerFeatureBlock.addEventListener('dblclick', () => { if (timerIntervalId || isTimerPaused) { showDetailedSettingsSection(timerSettingsSection); if (startTimerButton) { startTimerButton.disabled = !isTimerPaused; startTimerButton.textContent = isTimerPaused ? "Resume" : "Start"; } if (pauseTimerButton) pauseTimerButton.disabled = isTimerPaused; enableTimerInputs(false); } }); }
    if (networkTimeFeatureBlock) networkTimeFeatureBlock.addEventListener('click', () => showDetailedSettingsSection(networkTimeSettingsSection));
    if (timezonesFeatureBlock) timezonesFeatureBlock.addEventListener('click', () => showDetailedSettingsSection(timezonesSettingsSection));
    if (alarmFeatureBlock) { alarmFeatureBlock.addEventListener('click', () => { showDetailedSettingsSection(alarmSettingsSection); renderAlarmsList(); }); }
    if (stopwatchFeatureBlock) { stopwatchFeatureBlock.addEventListener('click', () => showDetailedSettingsSection(stopwatchSettingsSection)); }
    document.querySelectorAll('.back-to-features-btn').forEach(button => button.addEventListener('click', showFeatureBlocks));
    if (closeTimeSettingsButton) { closeTimeSettingsButton.addEventListener('click', () => { if (timeSettingsView) { timeSettingsView.style.display = 'none'; showFeatureBlocks(); } }); }
    if (syncNetworkTimeButton) { syncNetworkTimeButton.addEventListener('click', () => { if (networkTimeDisplay) { networkTimeDisplay.textContent = 'Fetching network time...'; syncNetworkTimeButton.disabled = true; } fetch('https://worldtimeapi.org/api/ip').then(response => { if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); return response.json(); }).then(data => { if (networkTimeDisplay) { const networkDateTime = new Date(data.datetime); const timeString = networkDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }); const dateString = networkDateTime.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }); networkTimeDisplay.textContent = `Network Time: ${dateString}, ${timeString} (${data.timezone})`; } }).catch(error => { console.error('Error fetching network time:', error); if (networkTimeDisplay) networkTimeDisplay.textContent = 'Error fetching time.'; }).finally(() => { if (syncNetworkTimeButton) syncNetworkTimeButton.disabled = false; }); }); }
    let selectedTimeZone1 = localStorage.getItem('timezone-select-1_selectedZone') || ""; let selectedTimeZone2 = localStorage.getItem('timezone-select-2_selectedZone') || "";
    function displayTimeForZone(timeZone, displayElement, defaultText = "Select a zone") { if (!timeZone || !displayElement) { if(displayElement) displayElement.textContent = defaultText; return; } try { displayElement.textContent = new Date().toLocaleTimeString('en-US', { timeZone: timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit' }); } catch (error) { console.error(`Error formatting time for zone ${timeZone}:`, error); displayElement.textContent = "Invalid zone"; } }
    function populateTimeZoneSelects() { [timezoneSelect1, timezoneSelect2].forEach((selectElement, index) => { if (!selectElement) return; selectElement.innerHTML = ''; const defaultOption = document.createElement('option'); defaultOption.value = ""; defaultOption.textContent = "Select a time zone..."; selectElement.appendChild(defaultOption); SAMPLE_TIMEZONES.forEach(tz => { const option = document.createElement('option'); option.value = tz.value; option.textContent = tz.label; selectElement.appendChild(option); }); const savedZone = index === 0 ? selectedTimeZone1 : selectedTimeZone2; if (savedZone) selectElement.value = savedZone; }); }
    function handleTimeZoneChange(event, displayElement) { const selectedZone = event.target.value; if (event.target === timezoneSelect1) selectedTimeZone1 = selectedZone; else if (event.target === timezoneSelect2) selectedTimeZone2 = selectedZone; localStorage.setItem(event.target.id + '_selectedZone', selectedZone); displayTimeForZone(selectedZone, displayElement); updateDisplayedZoneTimes(); }
    if (timezoneSelect1) timezoneSelect1.addEventListener('change', (e) => handleTimeZoneChange(e, timezoneDisplay1)); if (timezoneSelect2) timezoneSelect2.addEventListener('change', (e) => handleTimeZoneChange(e, timezoneDisplay2));
    function updateDisplayedZoneTimes() { const getZoneLabel = (zoneValue) => { const zone = SAMPLE_TIMEZONES.find(tz => tz.value === zoneValue); return zone ? zone.label.split(' ')[0] : (zoneValue || "N/A"); }; displayTimeForZone(selectedTimeZone1, timezoneDisplay1, "Select a zone"); displayTimeForZone(selectedTimeZone2, timezoneDisplay2, "Select a zone"); if (featureTz1Display) { const label1 = getZoneLabel(selectedTimeZone1); const time1 = selectedTimeZone1 ? formatTimeForZoneDisplay(selectedTimeZone1) : "--:--"; featureTz1Display.innerHTML = `<span class="tz-label">${label1}:</span> <span class="tz-time">${time1}</span>`; } if (featureTz2Display) { const label2 = getZoneLabel(selectedTimeZone2); const time2 = selectedTimeZone2 ? formatTimeForZoneDisplay(selectedTimeZone2) : "--:--"; featureTz2Display.innerHTML = `<span class="tz-label">${label2}:</span> <span class="tz-time">${time2}</span>`; } }
    function formatTimeForZoneDisplay(timeZone) { if (!timeZone) return "--:--"; try { return new Date().toLocaleTimeString('en-US', { timeZone: timeZone, hour: '2-digit', minute: '2-digit' }); } catch (error) { return "Error"; } }
    function loadSelectedTimeZones() { populateTimeZoneSelects(); updateDisplayedZoneTimes(); }
    function getTimerDurationFromInputs() { const hours = parseInt(timerHoursInput.value) || 0; const minutes = parseInt(timerMinutesInput.value) || 0; const seconds = parseInt(timerSecondsInput.value) || 0; timerDurationSet = (hours * 3600) + (minutes * 60) + seconds; return timerDurationSet; }
    function formatTime(totalSeconds) { const h = Math.floor(totalSeconds / 3600); const m = Math.floor((totalSeconds % 3600) / 60); const s = totalSeconds % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
    function updateTimerDisplayDOM(timeInSeconds, isTimerRunning = false) { const formattedTime = formatTime(timeInSeconds); const timerBlockDisplaySpan = document.getElementById('timer-block-display'); if (timerBlockDisplaySpan) { if (isTimerRunning) { timerBlockDisplaySpan.textContent = formattedTime; if (timerFeatureBlock) {timerFeatureBlock.classList.add('timer-block-running'); timerFeatureBlock.classList.remove('timer-block-paused');} } else { timerBlockDisplaySpan.textContent = "Set Timer"; if (timerFeatureBlock) { timerFeatureBlock.classList.remove('timer-block-running', 'timer-block-paused'); } } } if (timerDisplay) timerDisplay.textContent = formattedTime; }
    function timerFinished() { playSound(currentSelectedAlarmSound); showVisualNotification('assets/images/timer_done_animation.gif'); if (startTimerButton) { startTimerButton.disabled = false; startTimerButton.textContent = "Start"; } if (pauseTimerButton) pauseTimerButton.disabled = true; const timerBlockDisplaySpan = document.getElementById('timer-block-display'); if(timerBlockDisplaySpan && timerFeatureBlock) { timerBlockDisplaySpan.textContent = "Timer Done!"; timerFeatureBlock.classList.remove('timer-block-running', 'timer-block-paused'); setTimeout(() => { if (timerTimeRemaining <= 0 && !timerIntervalId && !isTimerPaused) timerBlockDisplaySpan.textContent = "Set Timer"; }, 3000); } enableTimerInputs(true); }
    function tickTimer() { if (isTimerPaused) return; timerTimeRemaining--; updateTimerDisplayDOM(timerTimeRemaining, true); if (timerTimeRemaining < 0) { clearInterval(timerIntervalId); timerIntervalId = null; timerFinished(); timerTimeRemaining = 0; updateTimerDisplayDOM(timerTimeRemaining, false); } }
    function enableTimerInputs(enable) { if (timerHoursInput) timerHoursInput.disabled = !enable; if (timerMinutesInput) timerMinutesInput.disabled = !enable; if (timerSecondsInput) timerSecondsInput.disabled = !enable; }
    function startTimer() { if (!timerHoursInput || !timerMinutesInput || !timerSecondsInput || !startTimerButton || !pauseTimerButton) return; if (timerIntervalId && !isTimerPaused) return; if (!isTimerPaused || timerTimeRemaining <= 0) { getTimerDurationFromInputs(); if (timerDurationSet <= 0) { alert("Please set a timer duration greater than 0."); return; } timerTimeRemaining = timerDurationSet; } isTimerPaused = false; if (timerIntervalId) clearInterval(timerIntervalId); updateTimerDisplayDOM(timerTimeRemaining, true); timerIntervalId = setInterval(tickTimer, 1000); showFeatureBlocks(); if (timerFeatureBlock) { timerFeatureBlock.classList.add('timer-block-running'); timerFeatureBlock.classList.remove('timer-block-paused'); } if (startTimerButton) startTimerButton.disabled = true; if (pauseTimerButton) pauseTimerButton.disabled = false; enableTimerInputs(false); }
    function pauseTimer() { if (!timerIntervalId || isTimerPaused || !startTimerButton || !pauseTimerButton) return; clearInterval(timerIntervalId); isTimerPaused = true; const timerBlockDisplaySpan = document.getElementById('timer-block-display'); if (timerBlockDisplaySpan && timerFeatureBlock) { timerBlockDisplaySpan.textContent = `Paused: ${formatTime(timerTimeRemaining)}`; timerFeatureBlock.classList.add('timer-block-paused'); timerFeatureBlock.classList.remove('timer-block-running'); } if (timerDisplay) timerDisplay.textContent = formatTime(timerTimeRemaining); if (startTimerButton) { startTimerButton.disabled = false; startTimerButton.textContent = "Resume"; } if (pauseTimerButton) pauseTimerButton.disabled = true; }
    function resetTimer() { if (!timerDisplay || !startTimerButton || !pauseTimerButton || !timerHoursInput || !timerMinutesInput || !timerSecondsInput) return; clearInterval(timerIntervalId); timerIntervalId = null; isTimerPaused = false; timerTimeRemaining = 0; timerDurationSet = 0; updateTimerDisplayDOM(0, false); if (startTimerButton) { startTimerButton.disabled = false; startTimerButton.textContent = "Start"; } if (pauseTimerButton) pauseTimerButton.disabled = true; enableTimerInputs(true); if(timerHoursInput) timerHoursInput.value = 0; if(timerMinutesInput) timerMinutesInput.value = 0; if(timerSecondsInput) timerSecondsInput.value = 0; }
    if (startTimerButton) startTimerButton.addEventListener('click', startTimer); if (pauseTimerButton) pauseTimerButton.addEventListener('click', pauseTimer); if (resetTimerButton) resetTimerButton.addEventListener('click', resetTimer);
    function loadAlarms() { const storedAlarms = localStorage.getItem(ALARMS_STORAGE_KEY); if (storedAlarms) { alarms = JSON.parse(storedAlarms); } }
    function saveAlarms() { localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(alarms)); updateAlarmFeatureBlockDisplay(); }
    function renderAlarmsList() { if (!alarmsListDiv) return; alarmsListDiv.innerHTML = ''; if (alarms.length === 0) { alarmsListDiv.innerHTML = '<p>No alarms set.</p>'; return; } alarms.forEach(alarm => { const alarmItem = document.createElement('div'); alarmItem.className = 'alarm-item'; alarmItem.innerHTML = `<div class="alarm-details"><span class="alarm-time">${alarm.time}</span><span class="alarm-label">${alarm.label || 'Alarm'}</span></div><div class="alarm-actions"><input type="checkbox" class="alarm-toggle-switch" data-id="${alarm.id}" ${alarm.enabled ? 'checked' : ''}><button class="delete-alarm-btn" data-id="${alarm.id}">Delete</button></div>`; alarmsListDiv.appendChild(alarmItem); }); updateAlarmFeatureBlockDisplay(); }
    if (alarmsListDiv) { alarmsListDiv.addEventListener('click', (event) => { const target = event.target; if (target.classList.contains('delete-alarm-btn')) { const alarmId = parseInt(target.dataset.id); alarms = alarms.filter(a => a.id !== alarmId); saveAlarms(); renderAlarmsList(); } else if (target.classList.contains('alarm-toggle-switch')) { const alarmId = parseInt(target.dataset.id); const alarm = alarms.find(a => a.id === alarmId); if (alarm) { alarm.enabled = target.checked; saveAlarms(); } } }); }
    function updateAlarmFeatureBlockDisplay() { if (!alarmBlockStatus) return; const enabledAlarms = alarms.filter(a => a.enabled).sort((a,b) => a.time.localeCompare(b.time)); if (enabledAlarms.length > 0) { alarmBlockStatus.textContent = `Next: ${enabledAlarms[0].time}`; } else { alarmBlockStatus.textContent = "No Alarms Set"; } }
    function checkAlarms() { const now = new Date(); const currentHours = now.getHours(); const currentMinutes = now.getMinutes(); if (currentMinutes === lastCheckedMinute) return; lastCheckedMinute = currentMinutes; let alarmsChanged = false; alarms.forEach(alarm => { if (alarm.enabled) { const [alarmHours, alarmMinutes] = alarm.time.split(':').map(Number); if (alarmHours === currentHours && alarmMinutes === currentMinutes) { playSound(currentSelectedAlarmSound); showVisualNotification('assets/images/alarm_animation.gif'); alarm.enabled = false; alarmsChanged = true; } } }); if (alarmsChanged) { saveAlarms(); renderAlarmsList(); } }
    function populateAlarmSoundSelector() { if (!alarmSoundSelect) return; alarmSoundSelect.innerHTML = ''; DEFAULT_ALARM_SOUNDS.forEach(sound => { const option = document.createElement('option'); option.value = sound.file; option.textContent = sound.name; alarmSoundSelect.appendChild(option); }); alarmSoundSelect.value = currentSelectedAlarmSound; }
    if (alarmSoundSelect) { alarmSoundSelect.addEventListener('change', (event) => { currentSelectedAlarmSound = event.target.value; localStorage.setItem(ALARM_SOUND_STORAGE_KEY, currentSelectedAlarmSound); }); }
    if (previewAlarmSoundBtn) { previewAlarmSoundBtn.addEventListener('click', () => { if (currentSelectedAlarmSound) playSound(currentSelectedAlarmSound); else alert("No alarm sound selected to preview."); }); }
    if (addAlarmButton) { addAlarmButton.addEventListener('click', () => { if (!newAlarmTimeInput || !newAlarmLabelInput) return; const timeValue = newAlarmTimeInput.value; const labelValue = newAlarmLabelInput.value.trim(); if (!timeValue) { alert("Please select a time for the alarm."); return; } const newAlarm = { id: Date.now(), time: timeValue, label: labelValue, enabled: true }; alarms.push(newAlarm); saveAlarms(); renderAlarmsList(); newAlarmTimeInput.value = ''; newAlarmLabelInput.value = ''; }); }
    function formatStopwatchTime(timeInMilliseconds, precision = 1) { const totalSeconds = Math.floor(timeInMilliseconds / 1000); const hours = Math.floor(totalSeconds / 3600); const minutes = Math.floor((totalSeconds % 3600) / 60); const seconds = totalSeconds % 60; const msFactor = precision === 1 ? 100 : precision === 2 ? 10 : 1; const milliseconds = Math.floor((timeInMilliseconds % 1000) / msFactor); let timeStr = ""; if (hours > 0) timeStr += `${String(hours).padStart(2, '0')}:`; timeStr += `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; if (precision > 0) timeStr += `.${String(milliseconds).padStart(precision, '0').substring(0, precision)}`; return timeStr; }
    function updateStopwatchDisplay(currentTimeMs) { const formattedTimeCompact = formatStopwatchTime(currentTimeMs, 1); const formattedTimeDetailed = formatStopwatchTime(currentTimeMs, 3); if (stopwatchBlockDisplay) stopwatchBlockDisplay.textContent = formattedTimeCompact; if (stopwatchMainDisplay) stopwatchMainDisplay.textContent = formattedTimeDetailed; }
    function runStopwatch() { if (!isStopwatchRunning) return; const displayTime = stopwatchElapsedTime + (Date.now() - stopwatchStartTime); updateStopwatchDisplay(displayTime); }
    function startStopwatch() { if (isStopwatchRunning || !startStopwatchButton || !stopStopwatchButton || !lapStopwatchButton || !stopwatchFeatureBlock) return; isStopwatchRunning = true; stopwatchStartTime = Date.now() - stopwatchElapsedTime; if (stopwatchIntervalId) clearInterval(stopwatchIntervalId); stopwatchIntervalId = setInterval(runStopwatch, 75); startStopwatchButton.disabled = true; startStopwatchButton.textContent = "Start"; stopStopwatchButton.disabled = false; lapStopwatchButton.disabled = false; resetStopwatchButton.disabled = false; stopwatchFeatureBlock.classList.add('stopwatch-running'); }
    function stopStopwatch() { if (!isStopwatchRunning || !startStopwatchButton || !stopStopwatchButton || !lapStopwatchButton || !stopwatchFeatureBlock) return; isStopwatchRunning = false; clearInterval(stopwatchIntervalId); stopwatchElapsedTime = Date.now() - stopwatchStartTime; updateStopwatchDisplay(stopwatchElapsedTime); startStopwatchButton.disabled = false; startStopwatchButton.textContent = "Resume"; stopStopwatchButton.disabled = true; lapStopwatchButton.disabled = true; resetStopwatchButton.disabled = false; stopwatchFeatureBlock.classList.remove('stopwatch-running'); }
    function resetStopwatch() { if (!startStopwatchButton || !stopStopwatchButton || !lapStopwatchButton || !resetStopwatchButton || !stopwatchFeatureBlock) return; isStopwatchRunning = false; clearInterval(stopwatchIntervalId); stopwatchIntervalId = null; stopwatchElapsedTime = 0; stopwatchStartTime = 0; laps = []; updateStopwatchDisplay(0); renderLapsList(); startStopwatchButton.disabled = false; startStopwatchButton.textContent = "Start"; stopStopwatchButton.disabled = true; lapStopwatchButton.disabled = true; stopwatchFeatureBlock.classList.remove('stopwatch-running'); }
    function renderLapsList() { if (!lapsList) return; lapsList.innerHTML = ''; if (laps.length === 0) { const li = document.createElement('li'); li.textContent = 'No laps yet.'; lapsList.appendChild(li); return; } laps.forEach((lapTime, index) => { const li = document.createElement('li'); const numSpan = document.createElement('span'); numSpan.className = 'lap-number'; numSpan.textContent = `Lap ${index + 1}: `; const timeSpan = document.createElement('span'); timeSpan.className = 'lap-time-value'; timeSpan.textContent = formatStopwatchTime(lapTime, 3); li.appendChild(numSpan); li.appendChild(timeSpan); lapsList.appendChild(li); }); }
    function lapStopwatch() { if (!isStopwatchRunning || !lapsList) return; const currentElapsedTime = stopwatchElapsedTime + (Date.now() - stopwatchStartTime); laps.push(currentElapsedTime); renderLapsList(); }
    if (startStopwatchButton) startStopwatchButton.addEventListener('click', startStopwatch); if (stopStopwatchButton) stopStopwatchButton.addEventListener('click', stopStopwatch); if (lapStopwatchButton) lapStopwatchButton.addEventListener('click', lapStopwatch); if (resetStopwatchButton) resetStopwatchButton.addEventListener('click', resetStopwatch);
    function playSound(soundFileUrl) { try { const audio = new Audio(soundFileUrl); audio.play().catch(e => console.error("Error playing sound:", e)); } catch (e) { console.error("Error creating audio element:", e); } }
    function showVisualNotification(imageFileUrl) { if (visualNotificationOverlay && notificationImage) { notificationImage.src = imageFileUrl; visualNotificationOverlay.style.display = 'flex'; } }
    function hideVisualNotification() { if (visualNotificationOverlay) { visualNotificationOverlay.style.display = 'none'; if (notificationImage) notificationImage.src = "#"; } }
    if (dismissNotificationBtn) dismissNotificationBtn.addEventListener('click', hideVisualNotification); if (visualNotificationOverlay) { visualNotificationOverlay.addEventListener('click', (event) => { if (event.target === visualNotificationOverlay) hideVisualNotification(); }); }

    // --- Drag and Drop Widget Logic ---
    const draggableWidgets = [calendarWidgetArea, timeWidgetArea, cryptoWidgetArea].filter(el => el);
    draggableWidgets.forEach(widget => { if (!widget) return; widget.addEventListener('dragstart', (event) => { event.target.classList.add('dragging'); event.dataTransfer.setData('text/plain', event.target.id); event.dataTransfer.effectAllowed = 'move'; }); widget.addEventListener('dragend', (event) => event.target.classList.remove('dragging')); });
    if (mainContentArea) { mainContentArea.addEventListener('dragover', (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; const draggingElement = document.querySelector('.dragging'); if (!draggingElement) return; draggableWidgets.forEach(w => w.classList.remove('drop-target-highlight-before', 'drop-target-highlight-after')); const afterElement = getDragAfterElement(mainContentArea, event.clientY); if (afterElement == null) { const lastWidget = mainContentArea.querySelector('[draggable="true"]:not(.dragging):last-child'); if (lastWidget) lastWidget.classList.add('drop-target-highlight-after'); } else { if (afterElement !== draggingElement) afterElement.classList.add('drop-target-highlight-before'); } }); mainContentArea.addEventListener('dragleave', (event) => { if (!mainContentArea.contains(event.relatedTarget) ) draggableWidgets.forEach(w => w.classList.remove('drop-target-highlight-before', 'drop-target-highlight-after')); }); mainContentArea.addEventListener('drop', (event) => { event.preventDefault(); const draggedElementId = event.dataTransfer.getData('text/plain'); const draggedElement = document.getElementById(draggedElementId); if (!draggedElement) return; draggableWidgets.forEach(w => w.classList.remove('drop-target-highlight-before', 'drop-target-highlight-after')); const afterElement = getDragAfterElement(mainContentArea, event.clientY); if (afterElement == null) mainContentArea.appendChild(draggedElement); else mainContentArea.insertBefore(draggedElement, afterElement); saveWidgetOrder(); }); }
    function getDragAfterElement(container, y) { const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')]; return draggableElements.reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2; if (offset < 0 && offset > closest.offset) return { offset: offset, element: child }; return closest; }, { offset: Number.NEGATIVE_INFINITY }).element; }
    function saveWidgetOrder() { if (!mainContentArea) return; const orderedWidgetIds = Array.from(mainContentArea.children).filter(child => child.draggable).map(child => child.id); localStorage.setItem('widgetOrder', JSON.stringify(orderedWidgetIds)); }
    function loadWidgetOrder() { if (!mainContentArea) return; const savedOrder = localStorage.getItem('widgetOrder'); if (savedOrder) { const orderedIds = JSON.parse(savedOrder); const currentWidgetsMap = new Map(); Array.from(mainContentArea.children).forEach(child => { if (child.id) currentWidgetsMap.set(child.id, child); }); orderedIds.forEach(id => { const widget = currentWidgetsMap.get(id); if (widget) mainContentArea.appendChild(widget); }); } }

    // --- NEW Crypto Widget (3-Slot) Functions ---

    async function fetchAvailableCryptoCoinsList() {
        const CACHE_KEY = 'cryptoCoinsList';
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
        const cachedData = localStorage.getItem(CACHE_KEY);

        if (cachedData) {
            const { timestamp, coins } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_DURATION) {
                console.log("Using cached crypto coins list.");
                availableCryptoCoins = coins;
                return;
            }
        }

        try {
            const response = await fetch(COINGECKO_COINS_LIST_URL);
            if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
            const coins = await response.json();

            availableCryptoCoins = coins.map(coin => ({
                id: coin.id,
                symbol: coin.symbol.toUpperCase(),
                name: coin.name,
                tvSymbol: `BINANCE:${coin.symbol.toUpperCase()}USDT`
            })).sort((a,b) => a.name.localeCompare(b.name));

            localStorage.setItem(CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                coins: availableCryptoCoins
            }));

            console.log("Fetched and cached available crypto coins:", availableCryptoCoins.length);
        } catch (error) {
            console.error("Error fetching available crypto coins:", error);
            availableCryptoCoins = [...DEFAULT_CRYPTO_SLOT_PAIRS]; // Fallback to defaults
        }
    }

    function populateAllCryptoPairSelectors() {
        cryptoPairSelectors.forEach((selector, index) => {
            if (!selector) return;
            selector.innerHTML = ''; // Clear existing options

            availableCryptoCoins.forEach(coin => {
                const option = document.createElement('option');
                option.value = coin.tvSymbol; // Store tvSymbol
                // Display as "Bitcoin (BTC/USDT)"
                const pair = coin.tvSymbol.split(':')[1] || '';
                const base = pair.replace('USDT', '');
                const quote = 'USDT';
                option.textContent = `${coin.name} (${base}/${quote})`;
                option.dataset.coinId = coin.id; // Store coingecko id for price fetching
                option.dataset.coinSymbol = coin.symbol;
                option.dataset.coinName = coin.name;
                selector.appendChild(option);
            });

            if (cryptoSlotPairsData[index] && cryptoSlotPairsData[index].tvSymbol) {
                selector.value = cryptoSlotPairsData[index].tvSymbol;
            } else if (availableCryptoCoins.length > 0 && DEFAULT_CRYPTO_SLOT_PAIRS[index]) {
                 // Fallback to default if current slot data is bad but defaults exist
                selector.value = DEFAULT_CRYPTO_SLOT_PAIRS[index].tvSymbol;
            }
        });
    }

    async function fetchCryptoPriceById(coinId) {
        if (!coinId) return { price: 'N/A', symbol: '' };
        const url = `${COINGECKO_PRICE_URL}?ids=${coinId}&vs_currencies=usd`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Error fetching price for ${coinId}: ${response.status}`);
                return { price: 'Error', symbol: coinId.substring(0,3).toUpperCase() };
            }
            const data = await response.json();
            if (data[coinId] && data[coinId].usd) {
                const price = parseFloat(data[coinId].usd);
                // Attempt to find the coin's symbol from our list for display
                const coinInfo = cryptoSlotPairsData.find(p => p.id === coinId) || availableCryptoCoins.find(c => c.id === coinId);
                return { price: price.toLocaleString(undefined, { style: 'currency', currency: 'USD' }), symbol: coinInfo ? coinInfo.symbol : coinId.substring(0,3).toUpperCase() };
            }
            return { price: 'N/A', symbol: coinId.substring(0,3).toUpperCase() };
        } catch (error) {
            console.error(`Error fetching price for ${coinId}:`, error);
            return { price: 'Error', symbol: coinId.substring(0,3).toUpperCase() };
        }
    }

    function _loadTradingViewChartForSlot(slotIndex, tvSymbol) {
        const chartContainer = cryptoTVChartContainers[slotIndex];
        console.log(`[Crypto] Attempting to load chart for slot ${slotIndex}, Symbol: ${tvSymbol}, Container ID: ${chartContainer ? chartContainer.id : 'Not Found'}`);

        if (!chartContainer) {
            console.error(`[Crypto] Chart container DOM element for slot ${slotIndex} not found.`);
            return;
        }

        // Clear previous widget and content
        if (tradingViewWidgets[slotIndex]) {
            try {
                tradingViewWidgets[slotIndex].remove();
                console.log(`[Crypto] Removed previous TradingView widget for slot ${slotIndex}.`);
            } catch (e) {
                console.warn(`[Crypto] Error removing previous TradingView widget for slot ${slotIndex}:`, e);
            }
            tradingViewWidgets[slotIndex] = null;
        }
        chartContainer.innerHTML = ''; // Ensure container is empty

        if (typeof TradingView === 'undefined') {
            chartContainer.innerHTML = `<p style="text-align:center; padding:20px; height:100%; display:flex; align-items:center; justify-content:center;">TradingView library not loaded.</p>`;
            console.error(`[Crypto] TradingView library (TradingView object) is undefined.`);
            return;
        }

        if (!tvSymbol) {
            chartContainer.innerHTML = `<p style="text-align:center; padding:20px; height:100%; display:flex; align-items:center; justify-content:center;">No symbol provided for chart.</p>`;
            console.error(`[Crypto] No tvSymbol provided for slot ${slotIndex}.`);
            return;
        }

        setTimeout(() => {
            console.log(`[Crypto] Instantiating TradingView widget for ${tvSymbol} in container ${chartContainer.id}`);
            try {
                tradingViewWidgets[slotIndex] = new TradingView.widget({
                    "container_id": chartContainer.id,
                    "width": "100%",
                    "height": "100%", // Relies on CSS for actual height of container
                    "symbol": tvSymbol,
                    "interval": "60",
                    "timezone": "Etc/UTC",
                    "theme": "light",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "#f1f3f6",
                    "enable_publishing": false,
                    "allow_symbol_change": false,
                    "details": true,
                    "autosize": true,
                    "hide_side_toolbar": true,
                    "no_referral_id": true,
                    "save_image": false,
                });
                console.log(`[Crypto] TradingView widget for slot ${slotIndex} (${tvSymbol}) instantiated.`);
            } catch (e) {
                console.error(`[Crypto] Error creating TradingView widget for slot ${slotIndex} with symbol ${tvSymbol}:`, e);
                chartContainer.innerHTML = `<p style="text-align:center; padding:20px; height:100%; display:flex; align-items:center; justify-content:center;">Error creating chart for ${tvSymbol}. Check console.</p>`;
            }
        }, 100);
    }

    async function renderCryptoWidgetExpandedState() {
        if (!expandedCryptoView) {
            console.error("[Crypto] Expanded crypto view element not found. Cannot render.");
            return;
        }
        console.log(`[Crypto] Rendering expanded state. Active slot: ${activeCryptoChartSlotIndex}`);

        for (let i = 0; i < 3; i++) {
            const slotElement = cryptoDisplaySlots[i];
            const priceButtonView = cryptoPriceButtonViews[i];
            const chartModeView = cryptoChartModeViews[i];
            const pairNameSpan = cryptoSlotPairNameSpans[i];
            const pairPriceSpan = cryptoSlotPairPriceSpans[i];
            const currentPairData = cryptoSlotPairsData[i] || {};

            if (!slotElement || !priceButtonView || !chartModeView || !pairNameSpan || !pairPriceSpan) {
                console.warn(`[Crypto] Missing elements for slot ${i}, skipping render for this slot.`);
                continue;
            }

            const currentPairData = cryptoSlotPairsData[i] || {};
            console.log(`[Crypto] Processing slot ${i}:`, currentPairData);

            if (i === activeCryptoChartSlotIndex) {
                console.log(`[Crypto] Slot ${i} is the active chart slot. Showing chart.`);
                slotElement.classList.add('active-chart-slot');
                // Chart mode is visible, price button hidden by CSS
                if (cryptoPairSelectors[i]) cryptoPairSelectors[i].value = currentPairData.tvSymbol || '';
                _loadTradingViewChartForSlot(i, currentPairData.tvSymbol);
            } else {
                console.log(`[Crypto] Slot ${i} is not active. Showing price button.`);
                slotElement.classList.remove('active-chart-slot');
                // Price button visible, chart mode hidden by CSS
                pairNameSpan.textContent = currentPairData.name || 'N/A';
                pairPriceSpan.textContent = 'Loading...';
                if (currentPairData.id) {
                    const { price } = await fetchCryptoPriceById(currentPairData.id);
                    pairPriceSpan.textContent = price;
                } else {
                     pairPriceSpan.textContent = 'N/A';
                }
            }
        }
    }

    async function updateCompactCryptoDisplayPrices() {
        for (let i = 0; i < 3; i++) {
            const compactSlotEl = compactCryptoSlots[i];
            const pairData = cryptoSlotPairsData[i];
            if (compactSlotEl && pairData && pairData.id) {
                compactSlotEl.innerHTML = `<span class="pair-name">${pairData.symbol || '---'}:</span> <span class="pair-price">Loading...</span>`;
                const { price } = await fetchCryptoPriceById(pairData.id);
                compactSlotEl.innerHTML = `<span class="pair-name">${pairData.symbol || '---'}:</span> <span class="pair-price">${price}</span>`;
            } else if (compactSlotEl) {
                compactSlotEl.innerHTML = `<span class="pair-name">---:</span> <span class="pair-price">N/A</span>`;
            }
        }
    }

    function handleCryptoSlotClick(slotIndex) {
        console.log(`[Crypto] Handling click on slot ${slotIndex}. Current active slot is ${activeCryptoChartSlotIndex}.`);
        if (slotIndex === activeCryptoChartSlotIndex) {
            console.log(`[Crypto] Clicked on the already active slot, no change.`);
            return;
        }
        activeCryptoChartSlotIndex = slotIndex;
        localStorage.setItem(CRYPTO_STORAGE_KEY_ACTIVE_SLOT, activeCryptoChartSlotIndex.toString());
        console.log(`[Crypto] Set active slot to ${slotIndex}. Rendering expanded state.`);
        renderCryptoWidgetExpandedState();
    }

    function handleCryptoPairChange(slotIndex, selectedTvSymbol) {
        const selectedOption = availableCryptoCoins.find(coin => coin.tvSymbol === selectedTvSymbol);
        if (selectedOption) {
            cryptoSlotPairsData[slotIndex] = { ...selectedOption }; // Store all details
            localStorage.setItem(CRYPTO_STORAGE_KEY_SLOT_PAIRS, JSON.stringify(cryptoSlotPairsData));

            if (slotIndex === activeCryptoChartSlotIndex) { // If the active chart's pair changed
                _loadTradingViewChartForSlot(slotIndex, selectedTvSymbol);
            } else { // If a button's pair changed (less common, but for completeness)
                renderCryptoWidgetExpandedState(); // Re-render to update button text
            }
            updateCompactCryptoDisplayPrices(); // Update compact view as well
        }
    }

    async function initCryptoWidget() {
        console.log("[Crypto] Initializing Crypto Widget...");
        const storedPairs = localStorage.getItem(CRYPTO_STORAGE_KEY_SLOT_PAIRS);
        try {
            cryptoSlotPairsData = storedPairs ? JSON.parse(storedPairs) : [...DEFAULT_CRYPTO_SLOT_PAIRS];
            console.log("[Crypto] Loaded slot pairs data:", cryptoSlotPairsData);
        } catch (e) {
            console.error("[Crypto] Error parsing stored slot pairs. Using defaults.", e);
            cryptoSlotPairsData = [...DEFAULT_CRYPTO_SLOT_PAIRS];
        }
        // Ensure cryptoSlotPairsData has 3 elements, padding with defaults if necessary
        for (let i = 0; i < 3; i++) {
            if (!cryptoSlotPairsData[i]) {
                cryptoSlotPairsData[i] = DEFAULT_CRYPTO_SLOT_PAIRS[i] || { id: `unknown-${i}`, symbol: 'N/A', name: 'Not Set', tvSymbol: '' };
            }
        }


        const storedActiveSlot = localStorage.getItem(CRYPTO_STORAGE_KEY_ACTIVE_SLOT);
        activeCryptoChartSlotIndex = storedActiveSlot ? parseInt(storedActiveSlot, 10) : 0;
        if (isNaN(activeCryptoChartSlotIndex) || activeCryptoChartSlotIndex < 0 || activeCryptoChartSlotIndex > 2) {
            activeCryptoChartSlotIndex = 0; // Default to first slot if invalid
        }

        await fetchAvailableCryptoCoinsList(); // Fetch full list
        populateAllCryptoPairSelectors(); // Then populate

        if (compactCryptoDisplay) {
            compactCryptoDisplay.addEventListener('click', () => {
                if (appContainer) appContainer.classList.add('expanded-crypto');
                if (mainContentArea) mainContentArea.classList.add('main-content-crypto-focus');
                if (expandedCryptoView) expandedCryptoView.style.display = 'flex';
                if (compactCryptoDisplay) compactCryptoDisplay.style.display = 'none';
                renderCryptoWidgetExpandedState();
            });
        }

        if (cryptoBackToCompactBtn) {
            cryptoBackToCompactBtn.addEventListener('click', () => {
                if (appContainer) appContainer.classList.remove('expanded-crypto');
                if (mainContentArea) mainContentArea.classList.remove('main-content-crypto-focus');
                if (expandedCryptoView) expandedCryptoView.style.display = 'none';
                if (compactCryptoDisplay) compactCryptoDisplay.style.display = 'flex';
                 // Stop active chart when going compact? Consider later.
            });
        }

        cryptoDisplaySlots.forEach((slotElement, index) => {
            if (slotElement) {
                const priceButtonView = cryptoPriceButtonViews[index];
                if (priceButtonView) {
                    priceButtonView.addEventListener('click', () => handleCryptoSlotClick(index));
                }
                const selector = cryptoPairSelectors[index];
                if (selector) {
                    selector.addEventListener('change', (event) => handleCryptoPairChange(index, event.target.value));
                }
            }
        });

        updateCompactCryptoDisplayPrices(); // Initial price load for compact
        setInterval(updateCompactCryptoDisplayPrices, 60000); // Update compact prices every 60s
        // Initial render of expanded state (even if hidden) to set up selectors correctly.
        // It will be properly rendered again when expanded.
        renderCryptoWidgetExpandedState();
    }

    // --- Initialization ---
    renderCompactDateDisplay();
    updateLiveClock();
    setInterval(updateLiveClock, 1000);
    if(timeSettingsView) timeSettingsView.style.display = 'none';
    loadSelectedTimeZones();
    setInterval(updateDisplayedZoneTimes, 1000);
    loadWidgetOrder();
    if (timerDisplay) updateTimerDisplayDOM(0);
    updateStopwatchDisplay(0);
    loadAlarms();
    renderAlarmsList();
    updateAlarmFeatureBlockDisplay();
    populateAlarmSoundSelector();

    initCryptoWidget(); // Initialize the new crypto widget

    if (fullCalendarView) fullCalendarView.addEventListener('click', handleSummaryItemClick);
    setInterval(checkAlarms, 10000);
    console.log("JS Desktop App Initialized.");
});
