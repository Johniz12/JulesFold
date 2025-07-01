# Simple Todo List Application

A straightforward and responsive todo list application built with HTML, CSS, and vanilla JavaScript. This project allows users to manage their tasks effectively directly in their web browser. It features local storage to persist todos, and a clean, user-friendly interface.

## Features

- **Add Todos:** Easily add new tasks with a description and a due date.
- **Delete Todos:** Remove tasks that are no longer needed.
- **Edit Todos:** Modify the details (name and due date) of existing tasks.
- **Persistent Storage:** Todos are saved in the browser's local storage, so they persist even after closing the browser window.
- **Responsive Design:** The interface is designed to work seamlessly across various screen sizes, including desktop, tablet, and mobile devices.
- **User-Friendly Interface:** Clean and intuitive design for easy task management.

## Project Structure

The project consists of the following main files:

- `todoReview2.html`: This is the main HTML file that provides the structure for the todo list application. It includes the input fields for adding todos, the area where todos are rendered, and the JavaScript code for the application's logic.
- `styles/NewTodo.css`: This CSS file contains all the styles for the application, ensuring a visually appealing and responsive user interface.

## Setup and Usage

To use this application:

1.  **Clone or download the repository/files.**
    If you have `git` installed, you can clone it:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
    Alternatively, download the `todoReview2.html` file and the `styles` directory (containing `NewTodo.css`).

2.  **Open the application.**
    Navigate to the directory where you saved the files and open `todoReview2.html` in your preferred web browser (e.g., Chrome, Firefox, Safari, Edge).

3.  **Using the Todo List:**
    -   **Add a task:** Type the task description into the "Enter todo..." input field, select a due date, and click the "Add" button or press Enter.
    -   **Edit a task:** Click the "Edit" button next to a task. The task view will change to an edit form. Modify the name and/or due date, then click "Save". You can also click "Cancel" to discard changes.
    -   **Delete a task:** Click the "Delete" button next to the task you wish to remove.
    -   Tasks are automatically saved to your browser's local storage.

## Technologies Used

-   **HTML5:** For the basic structure and content of the application.
-   **CSS3:** For styling the user interface and ensuring responsiveness.
-   **Vanilla JavaScript (ES6+):** For all the application logic, including DOM manipulation, event handling, and interaction with local storage. No external frameworks or libraries are used for the core functionality.
