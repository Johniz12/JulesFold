import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, HelpCircle } from 'lucide-react';

export const QuestionBuilder = ({ questions, onQuestionsChange }) => {
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    choices: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    points: 10,
  });
  const [error, setError] = useState('');

  const handleTypeChange = (type) => {
    if (type === 'true_false') {
      setNewQuestion({
        ...newQuestion,
        question_type: 'true_false',
        choices: ['True', 'False'],
        correct_answer: 'True',
      });
    } else {
      setNewQuestion({
        ...newQuestion,
        question_type: 'multiple_choice',
        choices: ['', '', '', ''],
        correct_answer: '',
      });
    }
  };

  const handleChoiceChange = (idx, value) => {
    const updated = [...newQuestion.choices];
    updated[idx] = value;
    setNewQuestion({ ...newQuestion, choices: updated });
  };

  const addChoice = () => {
    setNewQuestion({
      ...newQuestion,
      choices: [...newQuestion.choices, ''],
    });
  };

  const removeChoice = (idx) => {
    if (newQuestion.choices.length <= 2) return;
    const updated = newQuestion.choices.filter((_, i) => i !== idx);
    let correct = newQuestion.correct_answer;
    if (correct === newQuestion.choices[idx]) {
      correct = '';
    }
    setNewQuestion({ ...newQuestion, choices: updated, correct_answer: correct });
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    setError('');

    if (!newQuestion.question_text.trim()) {
      setError('Please provide question prompt text.');
      return;
    }

    if (newQuestion.question_type === 'multiple_choice') {
      const validChoices = newQuestion.choices.map((c) => c.trim()).filter(Boolean);
      if (validChoices.length < 2) {
        setError('At least 2 non-empty choices are required.');
        return;
      }
      if (!newQuestion.correct_answer.trim()) {
        setError('Please select or specify the correct answer choice.');
        return;
      }
    }

    onQuestionsChange([
      ...questions,
      {
        ...newQuestion,
        id: `temp-q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      },
    ]);

    // Reset form
    setNewQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      choices: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
      points: 10,
    });
  };

  const handleRemoveExistingQuestion = (idx) => {
    onQuestionsChange(questions.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <h4 style={{ marginBottom: 'var(--spacing-3)' }}>Examination Questions ({questions.length})</h4>

      {/* Existing questions list */}
      {questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-6)' }}>
          {questions.map((q, idx) => (
            <div key={q.id || idx} className="card" style={{ padding: 'var(--spacing-4)', backgroundColor: 'var(--color-secondary-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                    <span className="badge badge-primary">Q{idx + 1}</span>
                    <span className="badge badge-secondary">{q.question_type === 'true_false' ? 'True/False' : 'Multiple Choice'}</span>
                    <span className="badge badge-success">{q.points} Points</span>
                  </div>
                  <div className="font-semibold text-sm" style={{ marginBottom: 'var(--spacing-2)' }}>{q.question_text}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    <strong>Correct Answer:</strong> {q.correct_answer}
                  </div>
                  {q.explanation && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: 2 }}>
                      <em>Explanation: {q.explanation}</em>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-icon"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => handleRemoveExistingQuestion(idx)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new question card */}
      <div className="card" style={{ border: '1px dashed var(--color-border)' }}>
        <h5 style={{ marginBottom: 'var(--spacing-3)' }}>Add New Question</h5>

        {error && (
          <div className="alert alert-danger" style={{ padding: 'var(--spacing-2) var(--spacing-3)', fontSize: '0.8125rem' }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Question Type</label>
          <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="qtype"
                checked={newQuestion.question_type === 'multiple_choice'}
                onChange={() => handleTypeChange('multiple_choice')}
              />
              <span className="text-sm">Multiple Choice</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="qtype"
                checked={newQuestion.question_type === 'true_false'}
                onChange={() => handleTypeChange('true_false')}
              />
              <span className="text-sm">True or False</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Question Text *</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Type your exam question prompt..."
            value={newQuestion.question_text}
            onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
          />
        </div>

        {/* Multiple Choice Options */}
        {newQuestion.question_type === 'multiple_choice' ? (
          <div className="form-group">
            <label className="form-label">Answer Choices & Correct Answer Designation</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              {newQuestion.choices.map((choice, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  <input
                    type="radio"
                    name="correct_choice"
                    title="Mark this choice as the correct answer"
                    checked={newQuestion.correct_answer === choice && choice !== ''}
                    onChange={() => setNewQuestion({ ...newQuestion, correct_answer: choice })}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Option ${idx + 1}`}
                    value={choice}
                    onChange={(e) => handleChoiceChange(idx, e.target.value)}
                  />
                  {newQuestion.choices.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-icon btn-sm"
                      onClick={() => removeChoice(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 'var(--spacing-2)', alignSelf: 'flex-start' }}
              onClick={addChoice}
            >
              <Plus size={14} /> Add Another Choice
            </button>
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Correct Answer</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tf_correct"
                  checked={newQuestion.correct_answer === 'True'}
                  onChange={() => setNewQuestion({ ...newQuestion, correct_answer: 'True' })}
                />
                <span className="text-sm">True</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tf_correct"
                  checked={newQuestion.correct_answer === 'False'}
                  onChange={() => setNewQuestion({ ...newQuestion, correct_answer: 'False' })}
                />
                <span className="text-sm">False</span>
              </label>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-4)' }}>
          <div className="form-group">
            <label className="form-label">Point Value</label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={newQuestion.points}
              onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value, 10) || 1 })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Explanation (Revealed in review)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Why this answer is correct..."
              value={newQuestion.explanation}
              onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
            />
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 'var(--spacing-2)', alignSelf: 'flex-start' }}
          onClick={handleAddQuestion}
        >
          <Plus size={16} /> Save Question to Exam
        </button>
      </div>
    </div>
  );
};
