# JS Calendar & Emoji Tracker (Web-based)

A simple web-based application that provides an interactive monthly calendar allowing users to add emojis to specific dates. It also tracks and summarizes the usage of these emojis.

## Features

*   **Interactive Calendar:**
    *   Displays a full month view.
    *   Navigate to previous and next months.
    *   Current day is highlighted.
*   **Emoji Tagging:**
    *   Click on any date to add or update an emoji using a browser prompt.
    *   Enter an empty string in the prompt to remove an emoji from a date.
    *   Emojis are displayed directly on the calendar dates.
*   **Data Persistence:**
    *   Emoji data is saved in the browser's `localStorage`, so your emojis persist across sessions on the same browser.
*   **Emoji Summary:**
    *   A summary panel displays a list of all unique emojis used, along with their total counts.
    *   The summary is sorted by frequency (most used first).
    *   Updates in real-time as emojis are added or removed.
*   **Styling:**
    *   Clean and responsive (basic) interface styled with CSS.

## How to Run

1.  **Clone or Download:** Get the project files onto your local machine.
    ```bash
    git clone <repository_url>
    # or download ZIP and extract
    ```
2.  **Navigate to Folder:** Open your terminal or file explorer and go into the `js-desktop-app` directory.
    ```bash
    cd js-desktop-app
    ```
3.  **Open in Browser:** Simply open the `index.html` file in your preferred web browser (e.g., Chrome, Firefox, Safari, Edge).
    *   You can usually do this by double-clicking the file or right-clicking and selecting "Open with...".

## Technologies Used

*   **HTML5:** For the basic structure of the application.
*   **CSS3:** For styling the visual presentation.
*   **Vanilla JavaScript (ES6+):** For all application logic, DOM manipulation, and interaction. No external frameworks or libraries are used.

## Project Structure

```
js-desktop-app/
├── index.html       # Main HTML file
├── style.css        # CSS styles
├── script.js        # JavaScript application logic
└── README.md        # This file
```
