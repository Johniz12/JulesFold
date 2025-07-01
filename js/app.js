// Examination App JavaScript
console.log("Examination App Loaded");

const questionTextElement = document.getElementById('question-text');
const optionsContainerElement = document.getElementById('options-container');
const nextButtonElement = document.getElementById('next-button');
const scoreValueElement = document.getElementById('score-value');
const quizAreaElement = document.getElementById('quiz-area');
const resultsAreaElement = document.getElementById('results-area');
const finalScoreElement = document.getElementById('final-score');
const recommendationsElement = document.getElementById('recommendations');
const restartButtonElement = document.getElementById('restart-button');

// Mock question data
let questions = [
    {
        id: 1,
        text: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4",
        competency: "Basic Arithmetic"
    },
    {
        id: 2,
        text: "What is the capital of France?",
        options: ["Berlin", "Madrid", "Paris", "Rome"],
        correctAnswer: "Paris",
        competency: "Geography"
    },
    {
        id: 3,
        text: "Which planet is known as the Red Planet?",
        options: ["Earth", "Mars", "Jupiter", "Saturn"],
        correctAnswer: "Mars",
        competency: "Astronomy"
    },
    {
        id: 4,
        text: "What is the chemical symbol for water?",
        options: ["O2", "H2O", "CO2", "NaCl"],
        correctAnswer: "H2O",
        competency: "Basic Chemistry"
    }
];

let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null; // To store the selected answer temporarily

// Function to display the current question and options
function displayQuestion() {
    selectedAnswer = null; // Reset selected answer for new question
    const currentQuestion = questions[currentQuestionIndex];
    questionTextElement.textContent = currentQuestion.text;
    optionsContainerElement.innerHTML = ''; // Clear previous options

    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-button');
        button.addEventListener('click', () => selectAnswer(button, option));
        optionsContainerElement.appendChild(button);
    });

    nextButtonElement.disabled = true; // Disable next until an answer is selected
}

// Function to handle answer selection
function selectAnswer(buttonElement, answer) {
    // Remove 'selected' class from any previously selected option
    const allOptionButtons = optionsContainerElement.querySelectorAll('.option-button');
    allOptionButtons.forEach(btn => btn.classList.remove('selected'));

    // Add 'selected' class to the clicked button
    buttonElement.classList.add('selected');
    selectedAnswer = answer;
    nextButtonElement.disabled = false; // Enable next button
}


// Initial setup when the script loads
document.addEventListener('DOMContentLoaded', async () => {
    // Load questions using the simulated API fetch
    questionTextElement.textContent = "Loading questions...";
    try {
        const fetchedQuestions = await fetchQuestions(); // Use the async fetch
        questions = fetchedQuestions; // Update global questions array

        if (questions && questions.length > 0) {
            displayQuestion();
        } else {
            questionTextElement.textContent = "No questions found or error loading questions.";
            optionsContainerElement.innerHTML = '';
            nextButtonElement.classList.add('hidden');
        }
    } catch (error) {
        console.error("Error fetching questions:", error);
        questionTextElement.textContent = "Failed to load questions. Please try again later.";
        optionsContainerElement.innerHTML = '';
        nextButtonElement.classList.add('hidden');
    }

    // Event listeners
    nextButtonElement.addEventListener('click', handleNextQuestion);
    restartButtonElement.addEventListener('click', restartQuiz);
});

function handleNextQuestion() {
    if (selectedAnswer === null) {
        alert("Please select an answer before proceeding.");
        return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const allOptionButtons = optionsContainerElement.querySelectorAll('.option-button');

    // Check answer and update score
    if (selectedAnswer === currentQuestion.correctAnswer) {
        score++;
        scoreValueElement.textContent = score;
        // Optionally, mark the selected answer as correct immediately
        allOptionButtons.forEach(btn => {
            if (btn.textContent === selectedAnswer) {
                btn.classList.add('correct');
            }
        });
    } else {
        // Optionally, mark the selected answer as incorrect and show the correct one
        allOptionButtons.forEach(btn => {
            if (btn.textContent === selectedAnswer) {
                btn.classList.add('incorrect');
            }
            if (btn.textContent === currentQuestion.correctAnswer) {
                btn.classList.add('correct');
            }
        });
    }

    // Disable options after answering
    allOptionButtons.forEach(btn => btn.disabled = true);
    nextButtonElement.disabled = true; // Keep next disabled until next question is loaded or answer selected

    // Move to the next question or end quiz
    setTimeout(() => { // Add a small delay to show feedback
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            displayQuestion();
            allOptionButtons.forEach(btn => btn.disabled = false); // Re-enable buttons for new question
        } else {
            endQuiz();
        }
    }, 1000); // 1 second delay to see correctness
}

function endQuiz() {
    quizAreaElement.classList.add('hidden');
    resultsAreaElement.classList.remove('hidden');
    finalScoreElement.textContent = score;
    // Basic recommendation (can be expanded)
    if (score >= questions.length * 0.7) { // Example: 70% correct
        recommendationsElement.textContent = "Great job! You have a good understanding of these topics.";
    } else if (score >= questions.length * 0.4) { // Example: 40-69%
        recommendationsElement.textContent = "Good effort! Consider reviewing some of the topics you found challenging.";
    } else {
        recommendationsElement.textContent = "Keep practicing! Reviewing the material will help improve your score.";
    }
    // In a real app, you'd analyze competencies of missed questions here.
}

function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    selectedAnswer = null;
    scoreValueElement.textContent = score;

    resultsAreaElement.classList.add('hidden');
    quizAreaElement.classList.remove('hidden');

    if (questions.length > 0) {
        displayQuestion();
    } else {
        questionTextElement.textContent = "No questions loaded.";
        optionsContainerElement.innerHTML = '';
        nextButtonElement.classList.add('hidden');
    }
}

// API fetching function (simulated)
async function fetchQuestions() {
    console.log("Attempting to fetch questions (simulated)...");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real scenario, this would be an actual fetch() call to an API endpoint
    // For now, we return a copy of our mock data to simulate an API response.
    // It's good practice to return a new array/object to mimic immutability of API responses.
    const mockApiResponse = [
        {
            id: 1,
            text: "What is 5 + 7?",
            options: ["10", "12", "14", "8"],
            correctAnswer: "12",
            competency: "Basic Arithmetic"
        },
        {
            id: 2,
            text: "Which is the largest ocean on Earth?",
            options: ["Atlantic", "Indian", "Arctic", "Pacific"],
            correctAnswer: "Pacific",
            competency: "Geography"
        },
        {
            id: 3,
            text: "What gas do plants absorb from the atmosphere?",
            options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
            correctAnswer: "Carbon Dioxide",
            competency: "Basic Biology"
        },
        {
            id: 4,
            text: "What is the square root of 81?",
            options: ["7", "8", "9", "10"],
            correctAnswer: "9",
            competency: "Mathematics"
        }
    ];
    console.log("Simulated questions fetched.");
    return mockApiResponse;
    // If you want to test with the original questions array (which might be modified by the app):
    // return JSON.parse(JSON.stringify(questions)); // To return a deep copy
}
