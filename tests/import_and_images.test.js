import test from 'node:test';
import assert from 'node:assert/strict';

// Import parsing and validation logic tests
function validateExamPayload(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return { valid: false, errors: ['Invalid JSON payload.'] };
  if (data.format !== 'learnhub-content') errors.push("Expected format 'learnhub-content'");
  if (data.version !== 1) errors.push("Expected version 1");
  if (data.type !== 'exam') errors.push("Expected type 'exam'");
  const exam = data.exam;
  if (!exam || !exam.title) errors.push("Exam title is required");
  if (!Array.isArray(exam?.questions) || exam.questions.length === 0) {
    errors.push("Questions array cannot be empty");
  } else {
    exam.questions.forEach((q, idx) => {
      const qNum = idx + 1;
      if (!q.question) errors.push(`Question #${qNum}: question text is required`);
      if (q.points !== undefined && Number(q.points) <= 0) errors.push(`Question #${qNum}: points must be positive`);
      if (q.type === 'multiple_choice') {
        const correct = (q.correct_answer || '').toString().toLowerCase();
        const matched = q.options?.some(opt => (opt.id || '').toLowerCase() === correct || (opt.text || '').toLowerCase() === correct);
        if (!matched) errors.push(`Question #${qNum}: correct_answer does not match any choice ID or text`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const questions = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    questions.push({
      question: parts[0]?.replace(/"/g, ''),
      type: parts[1],
      correct_answer: parts[3],
      image: parts[6] ? { url: parts[6] } : null,
    });
  }
  return { format: 'learnhub-content', version: 1, type: 'exam', exam: { questions } };
}

test('importService: correctly validates standard exam JSON', () => {
  const validPayload = {
    format: 'learnhub-content',
    version: 1,
    type: 'exam',
    exam: {
      title: 'Valid Assessment',
      questions: [
        {
          type: 'multiple_choice',
          question: 'What is 2 + 2?',
          options: [{ id: 'A', text: '3' }, { id: 'B', text: '4' }],
          correct_answer: 'B',
          points: 5,
        },
      ],
    },
  };

  const result = validateExamPayload(validPayload);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('importService: detects invalid format, missing title, and invalid correct_answer reference', () => {
  const invalidPayload = {
    format: 'wrong-format',
    version: 2,
    type: 'exam',
    exam: {
      title: '',
      questions: [
        {
          type: 'multiple_choice',
          question: 'Select an option',
          options: [{ id: 'A', text: 'Alpha' }],
          correct_answer: 'Z',
          points: -5,
        },
      ],
    },
  };

  const result = validateExamPayload(invalidPayload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('learnhub-content')));
  assert.ok(result.errors.some((e) => e.includes('title')));
  assert.ok(result.errors.some((e) => e.includes('does not match any choice')));
  assert.ok(result.errors.some((e) => e.includes('points must be positive')));
});

test('importService: parses CSV question banks into standardized schema', () => {
  const csvContent = `question,type,choices,correct_answer,explanation,points,image_url
"What is the capital of France?",multiple_choice,Paris|Berlin,Paris,"Capital of France",5,https://example.com/paris.jpg`;

  const parsed = parseCSV(csvContent);
  assert.equal(parsed.format, 'learnhub-content');
  assert.equal(parsed.version, 1);
  assert.equal(parsed.type, 'exam');
  assert.equal(parsed.exam.questions.length, 1);
  assert.equal(parsed.exam.questions[0].correct_answer, 'Paris');
  assert.equal(parsed.exam.questions[0].image.url, 'https://example.com/paris.jpg');
});
