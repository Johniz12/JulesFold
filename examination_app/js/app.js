// Examination App JavaScript
console.log("Examination App Loaded");

const questionTextElement = document.getElementById('question-text');
const optionsContainerElement = document.getElementById('options-container');
const nextButtonElement = document.getElementById('next-button');
const scoreAreaElement = document.getElementById('score-area'); // Added this
const scoreValueElement = document.getElementById('score-value');
const quizAreaElement = document.getElementById('quiz-area');
const resultsAreaElement = document.getElementById('results-area');
const finalScoreElement = document.getElementById('final-score');
const recommendationsElement = document.getElementById('recommendations');
const restartButtonElement = document.getElementById('restart-button');

const userAreaElement = document.getElementById('user-area');
const usernameInputElement = document.getElementById('username-input');
const startQuizButtonElement = document.getElementById('start-quiz-button');

const reviewAreaElement = document.getElementById('review-area');
const reviewContentElement = document.getElementById('review-content');
const reviewAnswersButtonElement = document.getElementById('review-answers-button');
const backToResultsButtonElement = document.getElementById('back-to-results-button');

const categorySelectElement = document.getElementById('category-select');

const assessedGradeLevelDisplayElement = document.getElementById('assessed-grade-level-display');
const gradeLevelValueElement = document.getElementById('grade-level-value');

const changeUserButtonElement = document.getElementById('change-user-button');


// Global store for all questions fetched from API/mock
let allFetchedQuestions = [];
// `questions` will now hold the currently filtered list for the active quiz
let questions = [];

// The initial mock question data that was here was malformed and has been removed.
// All questions are now exclusively sourced from the fetchQuestions() function
// and stored in allFetchedQuestions.

let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null; // To store the selected answer temporarily
let quizSessionResults = []; // To store detailed results for the current session
let currentUsername = ''; // To store the current user's name
let currentCategory = 'all'; // To store the selected category, default to 'all'

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
document.addEventListener('DOMContentLoaded', () => {
    const storedUsername = localStorage.getItem('currentUsername');
    if (storedUsername) {
        usernameInputElement.value = storedUsername;
        currentUsername = storedUsername; // Set currentUsername if found
    }
    // User area is visible by default, quiz area is hidden by HTML class.
    startQuizButtonElement.addEventListener('click', handleUserSetup);

    // Quiz-specific listeners are set up *after* username is provided.
    nextButtonElement.addEventListener('click', handleNextQuestion);
    restartButtonElement.addEventListener('click', restartQuiz);
    reviewAnswersButtonElement.addEventListener('click', displayReview);
    backToResultsButtonElement.addEventListener('click', hideReview);
    changeUserButtonElement.addEventListener('click', handleChangeUser); // Add listener for new button

    // Fetch all questions once and populate categories
    fetchAllQuestionsAndSetupCategories();
});

function handleChangeUser() {
    resultsAreaElement.classList.add('hidden');
    reviewAreaElement.classList.add('hidden'); // Ensure review area is also hidden
    quizAreaElement.classList.add('hidden'); // Ensure quiz area is hidden
    scoreAreaElement.classList.add('hidden'); // Hide score area as well

    usernameInputElement.value = ''; // Clear the username input field
    // currentUsername = ''; // No need to clear here, will be set on new user setup
    // categorySelectElement.value = 'all'; // Optionally reset category, or leave as is

    userAreaElement.classList.remove('hidden'); // Show the user login area

    // Any other cleanup for a full user switch can go here.
    // For instance, if we displayed user-specific history summaries, clear them.
    // The current setup where loadQuizHistory is called after new user setup is fine.
}

async function fetchAllQuestionsAndSetupCategories() {
    try {
        allFetchedQuestions = await fetchQuestions(); // Store all questions globally
        populateCategoryFilter();
    } catch (error) {
        console.error("Failed to fetch initial questions for categories:", error);
        // Handle error, maybe show a message to the user
    }
}

function populateCategoryFilter() {
    if (!allFetchedQuestions || allFetchedQuestions.length === 0) return;

    const competencies = new Set();
    allFetchedQuestions.forEach(q => competencies.add(q.competency));

    competencies.forEach(comp => {
        const option = document.createElement('option');
        option.value = comp;
        option.textContent = comp;
        categorySelectElement.appendChild(option);
    });
}

function handleUserSetup() {
    const username = usernameInputElement.value.trim();
    if (!username) {
        alert("Please enter your name.");
        return;
    }
    currentUsername = username;
    localStorage.setItem('currentUsername', currentUsername);
    currentCategory = categorySelectElement.value; // Get selected category

    userAreaElement.classList.add('hidden');
    // quizAreaElement.classList.remove('hidden'); // This will be handled by startNewQuizSession

    initializeAppLogic();
}

async function initializeAppLogic() {
    // This function now orchestrates the quiz start
    await startNewQuizSession(); // This will show the quiz area and load filtered questions
    loadQuizHistory(); // Load and log history for the current user (can be filtered later)
}

async function startNewQuizSession() {
    // Reset quiz state for a new session
    currentQuestionIndex = 0;
    score = 0;
    selectedAnswer = null;
    quizSessionResults = []; // Clear previous session results
    scoreValueElement.textContent = score;

    // Ensure correct areas are visible/hidden
    userAreaElement.classList.add('hidden'); // Make sure user area is hidden
    resultsAreaElement.classList.add('hidden'); // Hide previous results if any
    quizAreaElement.classList.remove('hidden'); // Show the quiz playing area
    scoreAreaElement.classList.remove('hidden'); // Make score area visible for the new quiz

    questionTextElement.textContent = "Loading questions...";
    try {
        // Filter questions based on currentCategory
        if (currentCategory === 'all') {
            questions = [...allFetchedQuestions]; // Use all questions (create a copy)
        } else {
            questions = allFetchedQuestions.filter(q => q.competency === currentCategory);
        }

        if (questions && questions.length > 0) {
            displayQuestion();
        } else {
            questionTextElement.textContent = `No questions found for category: ${currentCategory}. Try 'All Categories'.`;
            optionsContainerElement.innerHTML = '';
            nextButtonElement.classList.add('hidden');
        }
    } catch (error) {
        console.error("Error processing questions for the session:", error);
        questionTextElement.textContent = "Failed to load questions. Please try again later.";
        optionsContainerElement.innerHTML = '';
        nextButtonElement.classList.add('hidden');
    }
    // Event listeners for next/restart are already set in DOMContentLoaded,
    // which is fine as they operate on elements within quizArea.
}

function handleNextQuestion() {
    if (selectedAnswer === null) {
        alert("Please select an answer before proceeding.");
        return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const allOptionButtons = optionsContainerElement.querySelectorAll('.option-button');
    let isCorrect = false;

    // Check answer and update score
    if (selectedAnswer === currentQuestion.correctAnswer) {
        score++;
        scoreValueElement.textContent = score;
        isCorrect = true;
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

    // Store detailed result for this question
    quizSessionResults.push({
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        options: currentQuestion.options, // Storing options for review feature
        userAnswer: selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: isCorrect,
        competency: currentQuestion.competency,
        gradeLevel: currentQuestion.gradeLevel // Store gradeLevel
    });

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

    const assessedResult = calculateAssessedGradeLevel();
    if (typeof assessedResult === 'number') {
        gradeLevelValueElement.textContent = `Grade ${assessedResult}`;
        assessedGradeLevelDisplayElement.classList.remove('hidden');
    } else if (typeof assessedResult === 'string') { // Covers "Needs review..." or "Could not determine..." etc.
        gradeLevelValueElement.textContent = assessedResult;
        assessedGradeLevelDisplayElement.classList.remove('hidden');
    } else {
        assessedGradeLevelDisplayElement.classList.add('hidden'); // Should not happen with current logic
    }

    generateDetailedRecommendations(assessedResult); // Pass assessedResult (which can be number or string)

    saveQuizAttempt(); // Save the attempt at the end of the quiz
}

function generateDetailedRecommendations(assessedGradeInfo) { // Accept assessedGradeInfo
    const incorrectAnswers = quizSessionResults.filter(result => !result.isCorrect);
    let recommendationHtml = "";

    // Determine numeric assessed grade if possible for comparison
    let numericAssessedGrade = null;
    if (typeof assessedGradeInfo === 'number') {
        numericAssessedGrade = assessedGradeInfo;
    }

    if (incorrectAnswers.length === 0) {
        recommendationHtml = "<p>Excellent work! You answered all questions correctly. Keep up the great effort!</p>";
    } else {
        const competencyMap = {};
        incorrectAnswers.forEach(result => {
            if (result.competency) {
                competencyMap[result.competency] = (competencyMap[result.competency] || 0) + 1;
            }
        });

        const sortedCompetencies = Object.entries(competencyMap)
            .sort(([, aCount], [, bCount]) => bCount - aCount); // Sort by most incorrect

        if (sortedCompetencies.length > 0) {
            recommendationHtml += "<p>Here are some areas you might want to focus on:</p><ul>";
            sortedCompetencies.forEach(([competency, count]) => {
                // Find one of the incorrect questions in this competency to check its grade level
                const sampleIncorrectQuestionInCompetency = incorrectAnswers.find(q => q.competency === competency);
                let gradeLevelInfo = "";
                if (sampleIncorrectQuestionInCompetency && sampleIncorrectQuestionInCompetency.gradeLevel !== undefined) {
                    gradeLevelInfo = ` (around Grade ${sampleIncorrectQuestionInCompetency.gradeLevel} material`;
                    if (numericAssessedGrade && sampleIncorrectQuestionInCompetency.gradeLevel < numericAssessedGrade) {
                        gradeLevelInfo += " - <strong style='color:red;'>reviewing this foundational topic is important!</strong>";
                    }
                    gradeLevelInfo += ")";
                }
                recommendationHtml += `<li>${competency} (you missed ${count} question${count > 1 ? 's' : ''} in this area${gradeLevelInfo})</li>`;
            });
            recommendationHtml += "</ul>";
        } else {
            // This case (incorrectAnswers.length > 0 but sortedCompetencies.length === 0)
            // would only happen if incorrect questions had no competency.
            recommendationHtml = "<p>Good effort! Review the specific questions you missed to improve further.</p>";
        }
    }

    // Overall score feedback
    if (score >= questions.length * 0.85) { // e.g. 85%+
        recommendationHtml += "<p>Overall, you did very well!</p>";
    } else if (score < questions.length * 0.5) { // e.g. below 50%
        recommendationHtml += "<p>Keep practicing to improve your overall understanding.</p>";
    }

    recommendationsElement.innerHTML = recommendationHtml;
}

function calculateAssessedGradeLevel() {
    if (!quizSessionResults || quizSessionResults.length === 0) {
        return "Not enough data to assess grade level.";
    }

    const proficiencyThreshold = 0.75; // 75% needed to be considered proficient at a grade level
    const gradeLevelStats = {}; // Store { total: x, correct: y } for each grade level

    quizSessionResults.forEach(result => {
        if (result.gradeLevel === undefined || result.gradeLevel === null) return; // Skip if no grade level

        if (!gradeLevelStats[result.gradeLevel]) {
            gradeLevelStats[result.gradeLevel] = { total: 0, correct: 0 };
        }
        gradeLevelStats[result.gradeLevel].total++;
        if (result.isCorrect) {
            gradeLevelStats[result.gradeLevel].correct++;
        }
    });

    let assessedGrade = 0; // Start with 0, meaning below Grade 1 or not proficient at any tested level

    // Get sorted unique grade levels present in the quiz
    const sortedGradeLevels = Object.keys(gradeLevelStats)
                                   .map(Number)
                                   .sort((a, b) => a - b);

    for (const level of sortedGradeLevels) {
        const stats = gradeLevelStats[level];
        if (stats.total > 0) { // Ensure there were questions at this level
            const proficiency = stats.correct / stats.total;
            console.log(`Grade Level ${level}: Correct ${stats.correct}/${stats.total}, Proficiency: ${proficiency.toFixed(2)}`);
            if (proficiency >= proficiencyThreshold) {
                assessedGrade = level; // Update to this level if proficient
            } else {
                // If proficiency is not met at a certain level,
                // they cannot be assessed at a higher level based on this model.
                // However, if they were proficient at a lower level, that still stands.
                // The current logic correctly finds the *highest* level of proficiency.
            }
        }
    }

    if (assessedGrade === 0 && sortedGradeLevels.length > 0) {
        // Check if they attempted any questions at all.
        // If they attempted questions but weren't proficient at the lowest level tested.
        const lowestTestedLevel = sortedGradeLevels[0];
        const lowestLevelStats = gradeLevelStats[lowestTestedLevel];
        if (lowestLevelStats && lowestLevelStats.total > 0 && (lowestLevelStats.correct / lowestLevelStats.total) < proficiencyThreshold) {
             return `Needs review at Grade ${lowestTestedLevel} material`; // Return string
        }
        return "Proficiency not met at any tested grade level"; // Return string
    } else if (assessedGrade > 0) {
        return assessedGrade; // Return number
    } else {
        return "Could not determine (no graded questions)"; // Return string
    }
}


function saveQuizAttempt() {
    const now = new Date();
    const attempt = {
        date: now.toISOString(),
        username: currentUsername, // Add username to the saved attempt
        score: score,
        totalQuestions: questions.length,
        results: quizSessionResults, // The detailed results we've been collecting
    };

    let history = JSON.parse(localStorage.getItem('quizHistory_' + currentUsername)) || [];
    history.push(attempt);
    localStorage.setItem('quizHistory_' + currentUsername, JSON.stringify(history)); // Use username in key for saving too
    console.log("Quiz attempt saved for " + currentUsername + ":", attempt);
}

function loadQuizHistory() {
    if (!currentUsername) {
        console.log("No current user to load history for.");
        return [];
    }
    const history = JSON.parse(localStorage.getItem('quizHistory_' + currentUsername)) || [];
    console.log(`Loaded quiz history for ${currentUsername}:`, history);
    return history;
}

// Remove the redundant DOMContentLoaded listener here, as it's merged above.

function restartQuiz() {
    currentQuestionIndex = 0;
    // score = 0; // Already handled by startNewQuizSession
    // selectedAnswer = null; // Already handled by startNewQuizSession
    // scoreValueElement.textContent = score; // Already handled by startNewQuizSession

    // resultsAreaElement.classList.add('hidden'); // Already handled by startNewQuizSession
    // quizAreaElement.classList.remove('hidden'); // Already handled by startNewQuizSession

    // if (questions.length > 0) { // Question loading is now in startNewQuizSession
    //     displayQuestion();
    // } else {
    //     questionTextElement.textContent = "No questions loaded.";
    //     optionsContainerElement.innerHTML = '';
    //     nextButtonElement.classList.add('hidden');
    // }
    startNewQuizSession(); // Simply start a new session, which handles reset and question loading
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
        // Basic Arithmetic
        { id: 1, text: "What is 5 + 7?", options: ["10", "12", "14", "8"], correctAnswer: "12", competency: "Basic Arithmetic", gradeLevel: 1 },
        { id: 5, text: "What is 10 - 3?", options: ["6", "7", "8", "5"], correctAnswer: "7", competency: "Basic Arithmetic", gradeLevel: 1 },
        { id: 9, text: "What is 4 x 6?", options: ["20", "24", "28", "18"], correctAnswer: "24", competency: "Basic Arithmetic", gradeLevel: 2 },

        // Geography
        { id: 2, text: "Which is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: "Pacific", competency: "Geography", gradeLevel: 3 },
        { id: 6, text: "What is the capital of Japan?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], correctAnswer: "Tokyo", competency: "Geography", gradeLevel: 4 },

        // Basic Biology
        { id: 3, text: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctAnswer: "Carbon Dioxide", competency: "Basic Biology", gradeLevel: 2 },
        { id: 7, text: "How many legs does a spider have?", options: ["6", "8", "10", "4"], correctAnswer: "8", competency: "Basic Biology", gradeLevel: 1 },

        // Mathematics (more advanced)
        { id: 4, text: "What is the square root of 81?", options: ["7", "8", "9", "10"], correctAnswer: "9", competency: "Mathematics", gradeLevel: 5 },
        { id: 8, text: "What is 3 multiplied by 12?", options: ["30", "36", "24", "33"], correctAnswer: "36", competency: "Mathematics", gradeLevel: 4 },
        { id: 10, text: "Solve for x: 2x + 5 = 11", options: ["2", "3", "4", "5"], correctAnswer: "3", competency: "Mathematics", gradeLevel: 6 }
    ];
    console.log("Simulated questions fetched, now with gradeLevel and more diverse competencies.");
    return mockApiResponse;
    // If you want to test with the original questions array (which might be modified by the app):
    // return JSON.parse(JSON.stringify(questions)); // To return a deep copy
}

function displayReview() {
    if (quizSessionResults.length === 0) {
        alert("No quiz data to review. Please complete a quiz first.");
        return;
    }

    resultsAreaElement.classList.add('hidden');
    reviewAreaElement.classList.remove('hidden');
    reviewContentElement.innerHTML = ''; // Clear previous review content

    quizSessionResults.forEach((result, index) => {
        const questionItemDiv = document.createElement('div');
        questionItemDiv.classList.add('review-question-item');

        const questionTitle = document.createElement('h4');
        questionTitle.textContent = `Q${index + 1}: ${result.questionText}`;
        questionItemDiv.appendChild(questionTitle);

        const optionsDiv = document.createElement('div');
        optionsDiv.classList.add('review-options');

        result.options.forEach(optionText => {
            const optionPara = document.createElement('p');
            optionPara.textContent = optionText;

            if (optionText === result.userAnswer) {
                optionPara.classList.add(result.isCorrect ? 'user-answer-correct' : 'user-answer-incorrect');
            } else if (optionText === result.correctAnswer) {
                optionPara.classList.add('correct-answer-not-selected');
            } else {
                optionPara.classList.add('other-option');
            }
            optionsDiv.appendChild(optionPara);
        });
        questionItemDiv.appendChild(optionsDiv);

        if (!result.isCorrect) {
            const correctAnswerInfo = document.createElement('p');
            correctAnswerInfo.innerHTML = `<strong>Correct Answer:</strong> ${result.correctAnswer}`;
            if(result.userAnswer !== result.correctAnswer && result.userAnswer !== null){ // Only show if user selected something and it was wrong
                 // No specific class needed if already highlighted above, but could add one
            } else if (result.userAnswer === null) {
                 correctAnswerInfo.innerHTML = `<strong>Correct Answer:</strong> ${result.correctAnswer} (You did not select an answer)`;
            }
             questionItemDiv.appendChild(correctAnswerInfo); // This was missing
        }

        reviewContentElement.appendChild(questionItemDiv);
    });
}

function hideReview() {
    reviewAreaElement.classList.add('hidden');
    resultsAreaElement.classList.remove('hidden'); // Show results area again
}
