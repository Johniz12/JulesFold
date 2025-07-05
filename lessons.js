const LESSONS_DB = {
    "preschool": {
        "name": "PreSchool",
        "id": "preschool",
        "subjects": {
            "math": {"id": "math", "name": "Math", "lessons": [
                {"id": "ps_math_1", "title": "Counting 1-10", "content": "Learn to count from one to ten! (1, 2, 3...)"},
                {"id": "ps_math_2", "title": "Basic Shapes", "content": "Circles, Squares, Triangles - oh my!"}
            ]},
            "english": {"id": "english", "name": "English", "lessons": [
                {"id": "ps_eng_1", "title": "Alphabet A-Z", "content": "Sing the alphabet song and learn your letters."},
                {"id": "ps_eng_2", "title": "Simple Words", "content": "Learn words like 'cat', 'dog', 'sun'."}
            ]},
            "science": {"id": "science", "name": "Science", "lessons": [
                {"id": "ps_sci_1", "title": "Animals Around Us", "content": "Discover common animals and their sounds."},
                {"id": "ps_sci_2", "title": "Parts of a Plant", "content": "Roots, stem, leaves, and flowers."}
            ]}
        }
    },
    "gradeschool": {
        "name": "Grade School",
        "id": "gradeschool",
        "grades": {
            "grade1": {
                "id": "grade1", "name": "Grade 1",
                "subjects": {
                    "math": {"id": "math", "name": "Math", "lessons": [
                        {"id": "g1_math_1", "title": "Addition Basics (1-10)", "content": "Adding small numbers together."}
                    ]},
                    "english": {"id": "english", "name": "English", "lessons": [
                        {"id": "g1_eng_1", "title": "Reading Short Sentences", "content": "Practice reading simple sentences."}
                    ]},
                    "science": {"id": "science", "name": "Science", "lessons": [
                        {"id": "g1_sci_1", "title": "Living and Non-Living Things", "content": "What's the difference?"}
                    ]}
                }
            },
            "grade2": {"id": "grade2", "name": "Grade 2", "subjects": {
                "math": {"id": "math", "name": "Math", "lessons": [{"id": "g2_math_1", "title": "Subtraction up to 20", "content": "Learning to subtract."}]},
                "english": {"id": "english", "name": "English", "lessons": [{"id": "g2_eng_1", "title": "Nouns and Verbs", "content": "Understanding parts of speech."}]},
                "science": {"id": "science", "name": "Science", "lessons": [{"id": "g2_sci_1", "title": "The Water Cycle", "content": "Evaporation, Condensation, Precipitation."}]}
            }},
            "grade3": {"id": "grade3", "name": "Grade 3", "subjects": {"math": {"id": "math", "name": "Math", "lessons": []},"english": {"id": "english", "name": "English", "lessons": []},"science": {"id": "science", "name": "Science", "lessons": []}}},
            "grade4": {"id": "grade4", "name": "Grade 4", "subjects": {"math": {"id": "math", "name": "Math", "lessons": []},"english": {"id": "english", "name": "English", "lessons": []},"science": {"id": "science", "name": "Science", "lessons": []}}},
            "grade5": {"id": "grade5", "name": "Grade 5", "subjects": {"math": {"id": "math", "name": "Math", "lessons": []},"english": {"id": "english", "name": "English", "lessons": []},"science": {"id": "science", "name": "Science", "lessons": []}}},
            "grade6": {"id": "grade6", "name": "Grade 6", "subjects": {"math": {"id": "math", "name": "Math", "lessons": []},"english": {"id": "english", "name": "English", "lessons": []},"science": {"id": "science", "name": "Science", "lessons": []}}},
        }
    },
    "highschool": {
        "name": "High School",
        "id": "highschool",
        "grades": {
            "grade7": {"id": "grade7", "name": "Grade 7", "subjects": {"math": {"id": "math", "name": "Math", "lessons": []},"english": {"id": "english", "name": "English", "lessons": []},"science": {"id": "science", "name": "Science", "lessons": []}}},
            "grade8": {"id": "grade8", "name": "Grade 8", "subjects": {"math": {"id": "math", "name": "Math", "lessons": []},"english": {"id": "english", "name": "English", "lessons": []},"science": {"id": "science", "name": "Science", "lessons": []}}},
            "grade9": {"id": "grade9", "name": "Grade 9", "subjects": {"math": {"id": "math", "name": "Math", "lessons": []},"english": {"id": "english", "name": "English", "lessons": []},"science": {"id": "science", "name": "Science", "lessons": []}}},
            "grade10": {"id": "grade10", "name": "Grade 10", "subjects": {"math": {"id": "math", "name": "Math", "lessons": []},"english": {"id": "english", "name": "English", "lessons": []},"science": {"id": "science", "name": "Science", "lessons": []}}},
        }
    },
    "seniorhigh": {
        "name": "Senior High",
        "id": "seniorhigh",
        "grades": {
            "grade11": {"id": "grade11", "name": "Grade 11", "subjects": {"math": {"id": "math", "name": "Math", "lessons": []},"english": {"id": "english", "name": "English", "lessons": []},"science": {"id": "science", "name": "Science", "lessons": []}}},
            "grade12": {"id": "grade12", "name": "Grade 12", "subjects": {"math": {"id": "math", "name": "Math", "lessons": []},"english": {"id": "english", "name": "English", "lessons": []},"science": {"id": "science", "name": "Science", "lessons": []}}},
        }
    }
};

// Make it available if using modules in the future, though for now script.js will just use it globally.
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = LESSONS_DB;
// }
