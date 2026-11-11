import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileUp,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  ClipboardList,
  BookOpen,
  ArrowRight,
  Download,
  Eye,
  Layers,
  HelpCircle,
  Image as ImageIcon
} from 'lucide-react';
import { courseService } from '../../services/courseService';
import { importService } from '../../services/importService';
import './AdminImportStudio.css';

export const AdminImportStudio = () => {
  const [importType, setImportType] = useState('exam'); // 'exam' | 'lesson_series' | 'csv_questions'
  const [courses, setCourses] = useState([]);
  const [targetCourseId, setTargetCourseId] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [csvInput, setCsvInput] = useState('');

  // Workflow State
  const [currentStep, setCurrentStep] = useState(1); // 1: Select -> 2: Validate -> 3: Preview -> 4: Summary
  const [validationResult, setValidationResult] = useState(null);
  const [parsedPayload, setParsedPayload] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const list = await courseService.getAllCourses();
        setCourses(list);
        if (list.length > 0) setTargetCourseId(list[0].id);
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    };
    fetchCourses();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (file.name.endsWith('.csv')) {
        setImportType('csv_questions');
        setCsvInput(content);
      } else {
        setJsonInput(content);
      }
    };
    reader.readAsText(file);
  };

  const loadTemplate = async (templateName) => {
    try {
      const res = await fetch(`/templates/${templateName}`);
      if (!res.ok) {
        throw new Error(`Failed to load template (status: ${res.status})`);
      }
      const text = await res.text();
      if (templateName.endsWith('.csv')) {
        setImportType('csv_questions');
        setCsvInput(text);
      } else {
        setJsonInput(text);
        if (templateName.includes('lesson')) {
          setImportType('lesson_series');
        } else {
          setImportType('exam');
        }
      }
      setError('');
    } catch (err) {
      setError('Failed to load sample template: ' + err.message);
    }
  };

  const handleValidate = () => {
    setError('');
    setValidationResult(null);
    setParsedPayload(null);

    let parsed = null;
    try {
      if (importType === 'csv_questions') {
        if (!csvInput.trim()) {
          setError('Please provide or upload CSV content.');
          return;
        }
        parsed = importService.parseCSV(csvInput);
      } else {
        if (!jsonInput.trim()) {
          setError('Please provide or upload JSON content.');
          return;
        }
        parsed = JSON.parse(jsonInput);
      }
    } catch (err) {
      setError('Syntax parsing failed: ' + err.message);
      return;
    }

    // Validate based on payload type
    let validation = null;
    if (parsed.type === 'lesson_series' || importType === 'lesson_series') {
      validation = importService.validateLessonSeries(parsed);
    } else {
      validation = importService.validateExam(parsed);
    }

    setValidationResult(validation);
    if (validation.valid) {
      setParsedPayload(parsed);
      setCurrentStep(3); // Jump to preview
    } else {
      setCurrentStep(2); // Show errors
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedPayload) return;
    try {
      setSubmitting(true);
      setError('');

      let result = null;
      if (parsedPayload.type === 'lesson_series') {
        result = await importService.commitLessonSeries(parsedPayload, targetCourseId || null);
      } else {
        result = await importService.commitExam(parsedPayload, targetCourseId || null);
      }

      setImportSummary({
        type: parsedPayload.type,
        ...result,
      });
      setCurrentStep(4); // Summary view
    } catch (err) {
      setError(err.message || 'Import operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetImport = () => {
    setCurrentStep(1);
    setValidationResult(null);
    setParsedPayload(null);
    setImportSummary(null);
    setJsonInput('');
    setCsvInput('');
    setError('');
  };

  return (
    <div className="page-container import-studio-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Content Import Studio</h1>
          <p className="text-muted text-sm">
            Batch import complete curriculum lesson series, visual examination banks, and question sets from standardized JSON or CSV.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadTemplate('exam-template.json')}
          >
            <Download size={14} /> Sample Visual Exam JSON
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadTemplate('lesson-series-template.json')}
          >
            <Download size={14} /> Sample Lesson Series JSON
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadTemplate('question-bank-template.csv')}
          >
            <Download size={14} /> Sample Questions CSV
          </button>
        </div>
      </div>

      {/* Stepper tracker */}
      <div className="import-stepper">
        <div className={`import-step ${currentStep >= 1 ? 'active' : ''}`}>1. Select & Input</div>
        <div className={`import-step ${currentStep >= 2 ? 'active' : ''}`}>2. Validation</div>
        <div className={`import-step ${currentStep >= 3 ? 'active' : ''}`}>3. Preview & Target</div>
        <div className={`import-step ${currentStep >= 4 ? 'active' : ''}`}>4. Final Summary</div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 'var(--spacing-6)' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {/* STEP 1: Select Content */}
      {currentStep <= 2 && (
        <div className="card">
          <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-4)' }}>
            <button
              type="button"
              className={`btn btn-sm ${importType === 'exam' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setImportType('exam')}
            >
              <ClipboardList size={16} /> Examination Import (JSON)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${importType === 'lesson_series' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setImportType('lesson_series')}
            >
              <BookOpen size={16} /> Lesson Series Import (JSON)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${importType === 'csv_questions' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setImportType('csv_questions')}
            >
              <FileText size={16} /> Question Bank (CSV)
            </button>
          </div>

          {/* File Upload Zone */}
          <div className="form-group">
            <label className="form-label">Upload Import File (.json or .csv)</label>
            <div className="import-dropzone">
              <Upload size={32} style={{ color: 'var(--color-text-subtle)', marginBottom: 'var(--spacing-2)' }} />
              <div className="font-semibold text-sm">Choose or drag a JSON or CSV file here</div>
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                style={{ marginTop: 'var(--spacing-2)', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          {/* Editor zone */}
          <div className="form-group">
            <label className="form-label">
              {importType === 'csv_questions' ? 'Or Paste CSV Content' : 'Or Paste JSON Content directly'}
            </label>
            <textarea
              className="form-textarea"
              rows={12}
              style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.85rem' }}
              placeholder={
                importType === 'csv_questions'
                  ? 'question,type,choices,correct_answer,explanation,points,image_url\n"What is 2+2?",multiple_choice,1|2|3|4,4,"Basic math",1,'
                  : '{\n  "format": "learnhub-content",\n  "version": 1,\n  "type": "exam", ...\n}'
              }
              value={importType === 'csv_questions' ? csvInput : jsonInput}
              onChange={(e) => {
                if (importType === 'csv_questions') {
                  setCsvInput(e.target.value);
                } else {
                  setJsonInput(e.target.value);
                }
              }}
            />
          </div>

          {/* Validation Errors Box if step 2 */}
          {validationResult && !validationResult.valid && (
            <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                <AlertCircle size={18} /> Found {validationResult.errors.length} validation errors:
              </div>
              <ul style={{ margin: '4px 0 0', paddingLeft: '1.25rem' }}>
                {validationResult.errors.map((errText, idx) => (
                  <li key={idx} style={{ fontSize: '0.8125rem' }}>{errText}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleValidate}
            >
              Validate & Preview Content <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview & Target Course Selection */}
      {currentStep === 3 && parsedPayload && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: 4 }}>
                  <CheckCircle size={12} /> Validated Standard Payload
                </span>
                <h3 style={{ margin: 0 }}>
                  {parsedPayload.type === 'lesson_series' ? 'Lesson Series Preview' : 'Examination Preview'}
                </h3>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentStep(1)}>
                Back to Edit
              </button>
            </div>

            {/* Target Course Selector */}
            <div className="form-group" style={{ backgroundColor: 'var(--color-secondary-light)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)' }}>
              <label className="form-label" htmlFor="targetCourseSelect">Target Course Association</label>
              <select
                id="targetCourseSelect"
                className="form-select"
                value={targetCourseId}
                onChange={(e) => setTargetCourseId(e.target.value)}
              >
                {parsedPayload.type === 'lesson_series' ? (
                  <option value="">-- Automatically Create New Course from Payload Metadata --</option>
                ) : (
                  <option value="">-- Unassigned (General Examination) --</option>
                )}
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>Existing: {c.title}</option>
                ))}
              </select>
            </div>

            {/* Content Preview Details */}
            {parsedPayload.type === 'lesson_series' ? (
              <div>
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                  <h4>Course: {parsedPayload.course?.title}</h4>
                  <p className="text-muted text-sm">{parsedPayload.course?.description}</p>
                </div>

                <h5>Syllabus Lessons ({parsedPayload.lessons?.length})</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  {parsedPayload.lessons?.map((l, i) => (
                    <div key={i} style={{ padding: 'var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>#{l.order || i + 1} {l.title}</strong>
                        <div className="text-muted text-xs">{l.description}</div>
                      </div>
                      <span className="badge badge-secondary">{l.content?.length || 0} characters</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 'var(--spacing-3)',
                  marginBottom: 'var(--spacing-4)',
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div><strong>Exam:</strong> {parsedPayload.exam?.title}</div>
                  <div><strong>Questions:</strong> {parsedPayload.exam?.questions?.length}</div>
                  <div><strong>Duration:</strong> {parsedPayload.exam?.duration_minutes}m</div>
                  <div><strong>Passing:</strong> {parsedPayload.exam?.passing_percentage}%</div>
                </div>

                <h5>Sample Questions ({parsedPayload.exam?.questions?.length} total)</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', maxHeight: 400, overflowY: 'auto' }}>
                  {parsedPayload.exam?.questions?.map((q, i) => (
                    <div key={i} style={{ padding: 'var(--spacing-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span className="badge badge-primary">Q{i + 1} ({q.points || 1} pt)</span>
                        <span className="badge badge-secondary">{q.type || 'multiple_choice'}</span>
                      </div>
                      <div className="font-semibold text-sm" style={{ margin: '4px 0' }}>{q.question || q.question_text}</div>

                      {q.image?.url && (
                        <div style={{ margin: '6px 0' }}>
                          <img
                            src={q.image.url}
                            alt={q.image.alt || 'Question illustration'}
                            style={{ maxHeight: 120, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}

                      <div className="text-muted text-xs">
                        <strong>Correct Answer:</strong> {q.correct_answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-6)', paddingTop: 'var(--spacing-4)', borderTop: '1px solid var(--color-border)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentStep(1)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmImport}
                disabled={submitting}
              >
                {submitting ? 'Importing to Database...' : 'Confirm & Commit Import to Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Import Summary */}
      {currentStep === 4 && importSummary && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--spacing-4)'
          }}>
            <CheckCircle size={36} />
          </div>

          <h2 style={{ marginBottom: 'var(--spacing-2)' }}>Content Successfully Imported!</h2>
          <p className="text-muted text-sm" style={{ maxWidth: 500, margin: '0 auto var(--spacing-6)' }}>
            All imported educational records have been verified, mapped, and persisted into the database.
          </p>

          <div style={{
            display: 'inline-grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--spacing-4)',
            maxWidth: 600,
            width: '100%',
            marginBottom: 'var(--spacing-8)',
            textAlign: 'left'
          }}>
            {importSummary.type === 'lesson_series' ? (
              <>
                <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                  <div className="text-muted text-xs font-semibold">Lessons Imported</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{importSummary.lessonsCount}</div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                  <div className="text-muted text-xs font-semibold">Target Course ID</div>
                  <div className="text-xs text-muted" style={{ wordBreak: 'break-all', marginTop: 4 }}>
                    {importSummary.courseId}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                  <div className="text-muted text-xs font-semibold">Questions Imported</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{importSummary.questionsCount}</div>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-4)' }}>
                  <div className="text-muted text-xs font-semibold">Exam Title</div>
                  <div className="font-semibold text-sm" style={{ marginTop: 4 }}>
                    {importSummary.examTitle}
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-4)' }}>
            <button className="btn btn-secondary" onClick={resetImport}>
              Import More Content
            </button>
            {importSummary.type === 'lesson_series' ? (
              <Link to="/admin/courses" className="btn btn-primary">
                View in Courses <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/admin/exams" className="btn btn-primary">
                View in Examinations <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
