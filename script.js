const contentArea = document.getElementById('content-area');
const breadcrumbsNav = document.getElementById('breadcrumbs');

let currentPath = []; // To store navigation path: [{name, id, type, (parentId for grade/subject)}]

document.addEventListener('DOMContentLoaded', () => {
    console.log("Learning App script loaded. DOM fully parsed.");
    if (typeof LESSONS_DB === 'undefined') {
        console.error("LESSONS_DB is not loaded. Make sure lessons.js is included and correct.");
        contentArea.innerHTML = "<p style='color:red;'>Error: Lesson data not found. Please check console.</p>";
        return;
    }
    navigateToLevelSelection();
});

function updateBreadcrumbs() {
    breadcrumbsNav.innerHTML = ''; // Clear current breadcrumbs

    const homeLink = document.createElement('a');
    homeLink.href = '#';
    homeLink.textContent = 'Home';
    homeLink.onclick = (e) => {
        e.preventDefault();
        navigateToLevelSelection();
    };
    breadcrumbsNav.appendChild(homeLink);

    currentPath.forEach((crumb, index) => {
        breadcrumbsNav.appendChild(document.createTextNode(' > '));
        if (index === currentPath.length - 1) { // Last crumb is current view, not a link
            const span = document.createElement('span');
            span.textContent = crumb.name;
            breadcrumbsNav.appendChild(span);
        } else {
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = crumb.name;
            link.onclick = (e) => {
                e.preventDefault();
                // Restore path up to this point and navigate
                currentPath = currentPath.slice(0, index + 1);
                if (crumb.type === 'level') {
                    navigateToLevelContent(crumb.id);
                } else if (crumb.type === 'grade') {
                    // We need the parent levelId for grades
                    const parentLevelCrumb = currentPath.find(p => p.id === crumb.parentId && p.type === 'level');
                    if (parentLevelCrumb) {
                        navigateToSubjectSelection(parentLevelCrumb.id, crumb.id);
                    } else {
                        navigateToLevelSelection(); // Fallback
                    }
                }
                // Subject breadcrumb click would navigate to lesson list (handled later)
                else {
                    navigateToLevelSelection(); // Fallback for simplicity
                }
            };
            breadcrumbsNav.appendChild(link);
        }
    });
}

function clearContentArea() {
    contentArea.innerHTML = '';
}

function createButton(text, onClick, typeClass = '', dataset = {}) {
    const button = document.createElement('button');
    button.className = `button ${typeClass}`;
    button.textContent = text;
    button.onclick = onClick;
    for (const key in dataset) {
        button.dataset[key] = dataset[key];
    }
    return button;
}

function navigateToLevelSelection() {
    currentPath = [];
    updateBreadcrumbs();
    clearContentArea();

    const title = document.createElement('h2');
    title.textContent = 'Select an Education Level';
    contentArea.appendChild(title);

    const buttonGrid = document.createElement('div');
    buttonGrid.className = 'button-grid';

    for (const levelId in LESSONS_DB) {
        const level = LESSONS_DB[levelId];
        const button = createButton(level.name, () => navigateToLevelContent(levelId));
        buttonGrid.appendChild(button);
    }
    contentArea.appendChild(buttonGrid);
}

function navigateToLevelContent(levelId) {
    const level = LESSONS_DB[levelId];
    if (!level) {
        console.error(`Level with ID ${levelId} not found.`);
        navigateToLevelSelection(); // Go back to safety
        return;
    }

    // Update path only if we are moving forward or changing level directly
    // If currentPath already contains this level as the last item, don't re-add.
    if (!currentPath.length || currentPath[currentPath.length -1].id !== levelId) {
         // If navigating from home or a different level, reset path to just this level
        if (!currentPath.length || currentPath[0].id !== levelId) {
            currentPath = [{ name: level.name, id: levelId, type: 'level' }];
        }
        // if currentPath has items, but not this one, add it.
        // This logic might need refinement for deep linking / back button behavior
    }

    updateBreadcrumbs();

    if (levelId === 'preschool') {
        navigateToSubjectSelection(levelId, null); // No gradeId for preschool
    } else {
        navigateToGradeSelection(levelId);
    }
}

function navigateToGradeSelection(levelId) {
    const level = LESSONS_DB[levelId];
    if (!level || !level.grades) {
        console.error(`Grades not found for level ID ${levelId}.`);
        navigateToLevelSelection();
        return;
    }

    // Ensure currentPath is correctly set up to this level if not already
    if (currentPath.length === 0 || currentPath[currentPath.length -1].id !== levelId) {
       currentPath = [{ name: level.name, id: levelId, type: 'level' }];
    }
    updateBreadcrumbs();
    clearContentArea();

    const title = document.createElement('h2');
    title.textContent = `Select a Grade in ${level.name}`;
    contentArea.appendChild(title);

    const buttonGrid = document.createElement('div');
    buttonGrid.className = 'button-grid';

    for (const gradeId in level.grades) {
        const grade = level.grades[gradeId];
        const button = createButton(grade.name, () => navigateToSubjectSelection(levelId, gradeId), 'secondary');
        buttonGrid.appendChild(button);
    }
    contentArea.appendChild(buttonGrid);
}

// Handles subject selection for Preschool (gradeId is null) OR for a specific grade
function navigateToSubjectSelection(levelId, gradeId) {
    const level = LESSONS_DB[levelId];
    if (!level) {
        console.error(`Level with ID ${levelId} not found.`);
        navigateToLevelSelection();
        return;
    }

    let currentLevelOrGradeName;
    let subjects;

    if (gradeId) { // Navigating from a specific grade
        const grade = level.grades[gradeId];
        if (!grade || !grade.subjects) {
            console.error(`Subjects not found for grade ID ${gradeId} in level ${levelId}.`);
            navigateToLevelContent(levelId); // Go back to grade selection
            return;
        }
        currentLevelOrGradeName = grade.name;
        subjects = grade.subjects;
        // Update path if not already at this grade
        if (currentPath.length < 2 || currentPath[currentPath.length -1].id !== gradeId) {
             currentPath = [
                { name: level.name, id: levelId, type: 'level' },
                { name: grade.name, id: gradeId, type: 'grade', parentId: levelId }
            ];
        }
    } else if (levelId === 'preschool') { // Navigating from Preschool
        currentLevelOrGradeName = level.name;
        subjects = level.subjects;
         // Update path if not already at preschool level (or reset if coming from elsewhere)
        if (currentPath.length === 0 || currentPath[currentPath.length -1].id !== levelId) {
            currentPath = [{ name: level.name, id: levelId, type: 'level' }];
        }
    } else {
        console.error("Invalid call to navigateToSubjectSelection without gradeId for non-preschool level.");
        navigateToLevelSelection();
        return;
    }

    updateBreadcrumbs();
    clearContentArea();

    const title = document.createElement('h2');
    title.textContent = `Select a Subject in ${currentLevelOrGradeName}`;
    contentArea.appendChild(title);

    const buttonGrid = document.createElement('div');
    buttonGrid.className = 'button-grid';

    for (const subjectId in subjects) {
        const subject = subjects[subjectId];
        const button = createButton(subject.name, () => {
            // Next step: navigateToLessonList(levelId, gradeId, subjectId)
            navigateToLessonList(levelId, gradeId, subjectId, subject.name);
        }, 'tertiary');
        buttonGrid.appendChild(button);
    }
    contentArea.appendChild(buttonGrid);
}

function navigateToLessonList(levelId, gradeId, subjectId, subjectName) {
    const level = LESSONS_DB[levelId];
    if (!level) {
        console.error(`Level with ID ${levelId} not found.`);
        navigateToLevelSelection(); return;
    }

    let parentName;
    let lessonsData;

    if (gradeId) { // Specific grade
        const grade = level.grades[gradeId];
        if (!grade || !grade.subjects || !grade.subjects[subjectId]) {
            console.error(`Subject ${subjectId} not found for grade ${gradeId} in level ${levelId}.`);
            navigateToSubjectSelection(levelId, gradeId); return;
        }
        parentName = grade.name;
        lessonsData = grade.subjects[subjectId].lessons;
        // Update path
        currentPath = [
            { name: level.name, id: levelId, type: 'level' },
            { name: grade.name, id: gradeId, type: 'grade', parentId: levelId },
            { name: subjectName, id: subjectId, type: 'subject', parentId: gradeId }
        ];
    } else if (levelId === 'preschool') { // Preschool
        if (!level.subjects || !level.subjects[subjectId]) {
            console.error(`Subject ${subjectId} not found for ${level.name}.`);
            navigateToLevelContent(levelId); return;
        }
        parentName = level.name;
        lessonsData = level.subjects[subjectId].lessons;
        // Update path
        currentPath = [
            { name: level.name, id: levelId, type: 'level' },
            { name: subjectName, id: subjectId, type: 'subject', parentId: levelId } // For preschool, subject's parent is the level
        ];
    } else {
        console.error("Invalid state for navigateToLessonList.");
        navigateToLevelSelection(); return;
    }

    updateBreadcrumbs();
    clearContentArea();

    const title = document.createElement('h2');
    title.textContent = `Lessons in ${subjectName} - ${parentName}`;
    contentArea.appendChild(title);

    if (!lessonsData || lessonsData.length === 0) {
        const noLessonsMessage = document.createElement('p');
        noLessonsMessage.textContent = 'No lessons available for this subject yet.';
        contentArea.appendChild(noLessonsMessage);
        return;
    }

    const lessonListUl = document.createElement('ul');
    lessonListUl.className = 'lesson-list';

    lessonsData.forEach(lesson => {
        const listItem = document.createElement('li');
        listItem.textContent = lesson.title;
        listItem.dataset.lessonId = lesson.id;
        listItem.onclick = () => {
            navigateToLessonView(levelId, gradeId, subjectId, lesson.id, lesson.title);
        };
        lessonListUl.appendChild(listItem);
    });

    contentArea.appendChild(lessonListUl);
}

function navigateToLessonView(levelId, gradeId, subjectId, lessonId, lessonTitle) {
    const level = LESSONS_DB[levelId];
    if (!level) { console.error(`Level ${levelId} not found.`); navigateToLevelSelection(); return; }

    let subjectData;
    let parentForPath; // This will be either gradeId or levelId (for preschool) for path parentId

    if (gradeId) { // Specific grade
        const grade = level.grades[gradeId];
        if (!grade || !grade.subjects || !grade.subjects[subjectId]) {
            console.error(`Subject ${subjectId} not found for grade ${gradeId} in level ${levelId}.`);
            navigateToLessonList(levelId, gradeId, subjectId, LESSONS_DB[levelId].grades[gradeId].subjects[subjectId]?.name || "Subject"); return;
        }
        subjectData = grade.subjects[subjectId];
        parentForPath = gradeId;
         currentPath = [ // Rebuild path up to the lesson
            { name: level.name, id: levelId, type: 'level' },
            { name: grade.name, id: gradeId, type: 'grade', parentId: levelId },
            { name: subjectData.name, id: subjectId, type: 'subject', parentId: gradeId },
            { name: lessonTitle, id: lessonId, type: 'lesson', parentId: subjectId }
        ];
    } else if (levelId === 'preschool') { // Preschool
        if (!level.subjects || !level.subjects[subjectId]) {
            console.error(`Subject ${subjectId} not found for ${level.name}.`);
            navigateToLessonList(levelId, null, subjectId, LESSONS_DB[levelId].subjects[subjectId]?.name || "Subject"); return;
        }
        subjectData = level.subjects[subjectId];
        parentForPath = levelId;
        currentPath = [ // Rebuild path up to the lesson
            { name: level.name, id: levelId, type: 'level' },
            { name: subjectData.name, id: subjectId, type: 'subject', parentId: levelId },
            { name: lessonTitle, id: lessonId, type: 'lesson', parentId: subjectId }
        ];
    } else {
        console.error("Invalid state for navigateToLessonView."); navigateToLevelSelection(); return;
    }

    const lesson = subjectData.lessons.find(l => l.id === lessonId);
    if (!lesson) {
        console.error(`Lesson ${lessonId} not found in subject ${subjectId}.`);
        // Go back to lesson list of the current subject
        navigateToLessonList(levelId, gradeId, subjectId, subjectData.name);
        return;
    }

    updateBreadcrumbs();
    clearContentArea();

    // Back to lessons button
    const backButton = createButton(
        `Back to ${subjectData.name} Lessons`,
        () => navigateToLessonList(levelId, gradeId, subjectId, subjectData.name),
        'back-button' // Add a specific class for styling if needed
    );
    contentArea.appendChild(backButton);

    const lessonTitleElement = document.createElement('h3'); // Using h3 for lesson title
    lessonTitleElement.textContent = lesson.title;

    const lessonContentView = document.createElement('div');
    lessonContentView.className = 'lesson-content-view';
    lessonContentView.innerHTML = `<p>${lesson.content || "No content available for this lesson."}</p>`; // Basic display

    contentArea.appendChild(lessonTitleElement);
    contentArea.appendChild(lessonContentView);
}

// Initial call is now in DOMContentLoaded
