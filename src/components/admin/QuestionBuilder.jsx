import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, HelpCircle, Image as ImageIcon, Upload } from 'lucide-react';
import { storageService } from '../../services/storageService';

export const QuestionBuilder = ({ questions, onQuestionsChange }) => {
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    choices: [
      { id: 'A', text: '', image: null },
      { id: 'B', text: '', image: null },
      { id: 'C', text: '', image: null },
      { id: 'D', text: '', image: null },
    ],
    correct_answer: '',
    explanation: '',
    points: 10,
    image: null,
  });
  const [error, setError] = useState('');
  const [uploadingQImage, setUploadingQImage] = useState(false);

  const handleTypeChange = (type) => {
    if (type === 'true_false') {
      setNewQuestion({
        ...newQuestion,
        question_type: 'true_false',
        choices: [
          { id: 'A', text: 'True', image: null },
          { id: 'B', text: 'False', image: null },
        ],
        correct_answer: 'True',
      });
    } else {
      setNewQuestion({
        ...newQuestion,
        question_type: type,
        choices: [
          { id: 'A', text: '', image: null },
          { id: 'B', text: '', image: null },
          { id: 'C', text: '', image: null },
          { id: 'D', text: '', image: null },
        ],
        correct_answer: '',
      });
    }
  };

  const handleChoiceTextChange = (idx, value) => {
    const updated = [...newQuestion.choices];
    updated[idx] = { ...updated[idx], text: value };
    setNewQuestion({ ...newQuestion, choices: updated });
  };

  const handleChoiceImageUpload = async (idx, file) => {
    if (!file) return;
    try {
      const uploaded = await storageService.uploadImage(file, 'choices');
      const updated = [...newQuestion.choices];
      updated[idx] = { ...updated[idx], image: { url: uploaded.url, alt: file.name } };
      setNewQuestion({ ...newQuestion, choices: updated });
    } catch (err) {
      alert('Choice image upload failed: ' + err.message);
    }
  };

  const removeChoiceImage = (idx) => {
    const updated = [...newQuestion.choices];
    updated[idx] = { ...updated[idx], image: null };
    setNewQuestion({ ...newQuestion, choices: updated });
  };

  const addChoice = () => {
    const nextLetter = String.fromCharCode(65 + newQuestion.choices.length);
    setNewQuestion({
      ...newQuestion,
      choices: [...newQuestion.choices, { id: nextLetter, text: '', image: null }],
    });
  };

  const removeChoice = (idx) => {
    if (newQuestion.choices.length <= 2) return;
    const removed = newQuestion.choices[idx];
    const updated = newQuestion.choices
      .filter((_, i) => i !== idx)
      .map((c, i) => ({ ...c, id: String.fromCharCode(65 + i) }));

    let correct = newQuestion.correct_answer;
    if (correct === removed.text || correct === removed.id) {
      correct = '';
    }
    setNewQuestion({ ...newQuestion, choices: updated, correct_answer: correct });
  };

  const handleQuestionImageUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingQImage(true);
      const uploaded = await storageService.uploadImage(file, 'questions');
      setNewQuestion((prev) => ({
        ...prev,
        image: { url: uploaded.url, alt: file.name, caption: '' },
      }));
    } catch (err) {
      alert('Question image upload failed: ' + err.message);
    } finally {
      setUploadingQImage(false);
    }
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    setError('');

    if (!newQuestion.question_text.trim()) {
      setError('Please provide question prompt text.');
      return;
    }

    if (newQuestion.question_type !== 'true_false') {
      const validChoices = newQuestion.choices.filter((c) => c.text.trim() || c.image?.url);
      if (validChoices.length < 2) {
        setError('At least 2 non-empty choices (with text or image) are required.');
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
        id: `temp-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      },
    ]);

    // Reset form
    setNewQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      choices: [
        { id: 'A', text: '', image: null },
        { id: 'B', text: '', image: null },
        { id: 'C', text: '', image: null },
        { id: 'D', text: '', image: null },
      ],
      correct_answer: '',
      explanation: '',
      points: 10,
      image: null,
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
                    <span className="badge badge-secondary">{q.question_type}</span>
                    <span className="badge badge-success">{q.points} Points</span>
                    {q.image?.url && <span className="badge badge-primary"><ImageIcon size={12} /> Image Question</span>}
                  </div>
                  <div className="font-semibold text-sm" style={{ marginBottom: 'var(--spacing-2)' }}>{q.question_text}</div>

                  {q.image?.url && (
                    <div style={{ marginBottom: 'var(--spacing-2)' }}>
                      <img
                        src={q.image.url}
                        alt={q.image.alt || 'Question'}
                        style={{ maxHeight: 90, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

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
          <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="qtype"
                checked={newQuestion.question_type === 'picture_identification'}
                onChange={() => handleTypeChange('picture_identification')}
              />
              <span className="text-sm">Picture Identification</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Question Text *</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="e.g. Which animal or organ is represented in the photograph?"
            value={newQuestion.question_text}
            onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
          />
        </div>

        {/* Optional Question Image */}
        <div className="form-group" style={{ backgroundColor: 'var(--color-surface-hover)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={16} /> Optional Question Image / Illustration
            </label>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={14} /> {uploadingQImage ? 'Uploading...' : 'Upload Image'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleQuestionImageUpload(e.target.files?.[0])}
                disabled={uploadingQImage}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
            <input
              type="url"
              className="form-control"
              placeholder="Or enter image URL (https://...)"
              value={newQuestion.image?.url || ''}
              onChange={(e) =>
                setNewQuestion({
                  ...newQuestion,
                  image: e.target.value ? { url: e.target.value, alt: 'Question Image' } : null,
                })
              }
            />
          </div>

          {newQuestion.image?.url && (
            <div style={{ marginTop: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <img
                src={newQuestion.image.url}
                alt="Preview"
                style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setNewQuestion({ ...newQuestion, image: null })}
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        {/* Multiple Choice / Picture Identification Options */}
        {newQuestion.question_type !== 'true_false' ? (
          <div className="form-group">
            <label className="form-label">Answer Choices & Correct Answer Designation</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              {newQuestion.choices.map((choice, idx) => (
                <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <input
                      type="radio"
                      name="correct_choice"
                      title="Mark as correct answer"
                      checked={
                        newQuestion.correct_answer === choice.text ||
                        newQuestion.correct_answer === choice.id
                      }
                      onChange={() => setNewQuestion({ ...newQuestion, correct_answer: choice.text || choice.id })}
                    />
                    <strong style={{ minWidth: 20 }}>{choice.id}.</strong>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Choice text ${idx + 1}`}
                      value={choice.text}
                      onChange={(e) => handleChoiceTextChange(idx, e.target.value)}
                    />

                    <label className="btn btn-secondary btn-icon btn-sm" title="Upload choice image" style={{ cursor: 'pointer' }}>
                      <ImageIcon size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleChoiceImageUpload(idx, e.target.files?.[0])}
                      />
                    </label>

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

                  {choice.image?.url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginTop: 4, marginLeft: 28 }}>
                      <img
                        src={choice.image.url}
                        alt="Choice"
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-xs)' }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '1px 6px' }}
                        onClick={() => removeChoiceImage(idx)}
                      >
                        Remove Choice Image
                      </button>
                    </div>
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
