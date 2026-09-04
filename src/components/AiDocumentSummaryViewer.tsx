import React, { useState, useEffect } from 'react';
import { AiDocumentSummaryResult, AiSummaryMode } from '../types';
import { downloadSummaryPdf, saveAiSummary } from '../utils/aiDocumentSummarizerService';
import { 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  BookOpen, 
  Zap, 
  Award, 
  Lightbulb, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  BookmarkCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Share2,
  RefreshCw,
  Clock,
  Layers,
  GraduationCap
} from 'lucide-react';

interface AiDocumentSummaryViewerProps {
  summary: AiDocumentSummaryResult;
  onRegenerate?: (mode: AiSummaryMode) => void;
  isRegenerating?: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const AiDocumentSummaryViewer: React.FC<AiDocumentSummaryViewerProps> = ({
  summary,
  onRegenerate,
  isRegenerating = false,
  onClose,
  showCloseButton = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'concepts' | 'formulas' | 'pyqs' | 'takeaways' | 'quiz'>('all');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Stop speaking when unmounted
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    let copyText = `📚 ${summary.title.toUpperCase()}\n`;
    copyText += `Subject: ${summary.subject || 'Academic'}\n\n`;
    copyText += `📌 EXECUTIVE SUMMARY:\n${summary.executiveSummary}\n\n`;

    if (summary.coreConcepts?.length) {
      copyText += `📖 CORE CONCEPTS:\n`;
      summary.coreConcepts.forEach((c, i) => {
        copyText += `${i + 1}. ${c.topic}\n   ${c.description}\n`;
        c.keyPoints?.forEach((kp) => {
          copyText += `   • ${kp}\n`;
        });
      });
      copyText += '\n';
    }

    if (summary.highYieldFormulasAndTheorems?.length) {
      copyText += `⚡ HIGH-YIELD FORMULAS & THEOREMS:\n`;
      summary.highYieldFormulasAndTheorems.forEach((f, i) => {
        copyText += `${i + 1}. ${f.name}: ${f.formulaOrStatement}\n   Note: ${f.explanation}\n`;
      });
      copyText += '\n';
    }

    if (summary.examProbableQuestions?.length) {
      copyText += `🎯 EXAM QUESTIONS (PYQs):\n`;
      summary.examProbableQuestions.forEach((q, i) => {
        copyText += `Q${i + 1} (${q.marks} Marks): ${q.question}\n`;
        q.answerBulletPoints?.forEach((a) => {
          copyText += `   → ${a}\n`;
        });
      });
      copyText += '\n';
    }

    if (summary.keyTakeaways?.length) {
      copyText += `💡 KEY TAKEAWAYS:\n`;
      summary.keyTakeaways.forEach((k) => {
        copyText += `• ${k}\n`;
      });
    }

    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    saveAiSummary(summary);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleTextToSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${summary.title}. Executive summary. ${summary.executiveSummary}. Core concepts: ` +
      summary.coreConcepts.map((c) => `${c.topic}. ${c.description}`).join('. ') +
      '. Key takeaways: ' + summary.keyTakeaways.join('. ');

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSelectQuizOption = (qId: string, optionIndex: number) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [qId]: optionIndex,
    }));
  };

  const quizScore = summary.quiz
    ? summary.quiz.reduce((score, q) => {
        return quizAnswers[q.id] === q.correctAnswerIndex ? score + 1 : score;
      }, 0)
    : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-[260px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Study Summary</span>
              </span>
              {summary.subject && (
                <span className="px-2.5 py-0.5 bg-white/10 text-white text-xs font-semibold rounded-full">
                  {summary.subject}
                </span>
              )}
              {summary.university && (
                <span className="px-2.5 py-0.5 bg-white/10 text-slate-300 text-xs rounded-full">
                  {summary.university}
                </span>
              )}
              {summary.isFallback && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-200 text-[11px] font-bold rounded-full border border-amber-400/30">
                  Heuristic Mode
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
              {summary.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span>Generated: {new Date(summary.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </span>
              {summary.wordCount ? (
                <span>• {summary.wordCount} words analyzed</span>
              ) : null}
              <span>• Powered by Google Gemini 3.7</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTextToSpeech}
              className={`p-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                isSpeaking
                  ? 'bg-amber-400 text-slate-950 shadow-md animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isSpeaking ? 'Stop Audio' : 'Listen to Summary (Audio Study)'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSpeaking ? 'Listening...' : 'Listen'}</span>
            </button>

            <button
              onClick={handleSave}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
              title="Save to My AI Summaries"
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSaved ? 'Saved!' : 'Save'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
              title="Copy Summary Text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => downloadSummaryPdf(summary)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-extrabold shadow-sm transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15">
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-200 uppercase tracking-wider mb-2">
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Executive Exam Summary (TL;DR)</span>
          </div>
          <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
            {summary.executiveSummary}
          </p>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            All Modules
          </button>

          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'concepts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Core Concepts ({summary.coreConcepts?.length || 0})</span>
          </button>

          {summary.highYieldFormulasAndTheorems && summary.highYieldFormulasAndTheorems.length > 0 && (
            <button
              onClick={() => setActiveTab('formulas')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'formulas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Formulas & Laws ({summary.highYieldFormulasAndTheorems.length})</span>
            </button>
          )}

          {summary.examProbableQuestions && summary.examProbableQuestions.length > 0 && (
            <button
              onClick={() => setActiveTab('pyqs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'pyqs'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-rose-500" />
              <span>Exam PYQs ({summary.examProbableQuestions.length})</span>
            </button>
          )}

          {summary.quiz && summary.quiz.length > 0 && (
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'quiz'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Self-Test Quiz ({summary.quiz.length})</span>
            </button>
          )}

          {summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
            <button
              onClick={() => setActiveTab('takeaways')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'takeaways'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Takeaways</span>
            </button>
          )}
        </div>

        {/* Study Mode Selector / Regenerate */}
        {onRegenerate && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold hidden md:inline">Mode:</span>
            <select
              value={summary.mode}
              disabled={isRegenerating}
              onChange={(e) => onRegenerate(e.target.value as AiSummaryMode)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="comprehensive">Comprehensive Study Guide</option>
              <option value="exam_revision">5-Min Exam Cheat-Sheet</option>
              <option value="formulas_theorems">Formulas & Theorems Only</option>
              <option value="pyq_viva">Exam PYQs & Viva Prep</option>
              <option value="quiz">Practice Quiz Generator</option>
            </select>
            {isRegenerating && (
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            )}
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="p-6 sm:p-8 space-y-8">
        {/* Core Concepts */}
        {(activeTab === 'all' || activeTab === 'concepts') && summary.coreConcepts && summary.coreConcepts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Core Concepts & Syllabus Breakdown</h3>
                <p className="text-xs text-slate-500">Key theoretical pillars and conceptual foundations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.coreConcepts.map((concept, index) => (
                <div 
                  key={index}
                  className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 transition"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {concept.topic}
                    </h4>
                  </div>

                  {concept.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {concept.description}
                    </p>
                  )}

                  {concept.keyPoints && concept.keyPoints.length > 0 && (
                    <ul className="space-y-1.5 pt-1 text-xs text-slate-700">
                      {concept.keyPoints.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Formulas & Theorems */}
        {(activeTab === 'all' || activeTab === 'formulas') && summary.highYieldFormulasAndTheorems && summary.highYieldFormulasAndTheorems.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">High-Yield Formulas, Theorems & Laws</h3>
                <p className="text-xs text-slate-500">Essential equations for numerical problems & university derivations</p>
              </div>
            </div>

            <div className="space-y-3">
              {summary.highYieldFormulasAndTheorems.map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                      {item.name}
                    </span>
                    <div className="p-3 bg-white rounded-xl border border-amber-200 font-mono text-sm font-extrabold text-slate-900 shadow-2xs">
                      {item.formulaOrStatement}
                    </div>
                    <p className="text-xs text-slate-600">
                      💡 <strong>Exam Note:</strong> {item.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Exam PYQs */}
        {(activeTab === 'all' || activeTab === 'pyqs') && summary.examProbableQuestions && summary.examProbableQuestions.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">High-Probability Exam Questions & Model Solutions</h3>
                <p className="text-xs text-slate-500">Frequently repeated semester exam questions (5M & 10M patterns)</p>
              </div>
            </div>

            <div className="space-y-4">
              {summary.examProbableQuestions.map((q, idx) => (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-black rounded-md shrink-0">
                        Q{idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {q.question}
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-extrabold rounded-full shrink-0">
                      {q.marks} Marks
                    </span>
                  </div>

                  {q.answerBulletPoints && q.answerBulletPoints.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Key Answer Steps & Diagram Outline:
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {q.answerBulletPoints.map((point, aIdx) => (
                          <li key={aIdx} className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">→</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interactive Self-Test Quiz */}
        {(activeTab === 'all' || activeTab === 'quiz') && summary.quiz && summary.quiz.length > 0 && (
          <section className="space-y-4 bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Interactive Self-Test Practice Quiz</h3>
                  <p className="text-xs text-slate-500">Test your retention of this study document</p>
                </div>
              </div>

              {Object.keys(quizAnswers).length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900">
                    Score: {quizScore} / {summary.quiz.length}
                  </span>
                  <button
                    onClick={() => setShowQuizResults(!showQuizResults)}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-bold transition"
                  >
                    {showQuizResults ? 'Hide Explanations' : 'Review Explanations'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2">
              {summary.quiz.map((q, idx) => {
                const selectedOption = quizAnswers[q.id];
                const isAnswered = selectedOption !== undefined;
                const isCorrect = selectedOption === q.correctAnswerIndex;

                return (
                  <div 
                    key={q.id || idx}
                    className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {q.question}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isThisSelected = selectedOption === oIdx;
                        const isThisCorrect = q.correctAnswerIndex === oIdx;

                        let optClasses = 'border-slate-200 hover:bg-slate-50 text-slate-700';

                        if (isAnswered) {
                          if (isThisCorrect) {
                            optClasses = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                          } else if (isThisSelected && !isCorrect) {
                            optClasses = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                          } else {
                            optClasses = 'opacity-60 border-slate-200 text-slate-500';
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectQuizOption(q.id, oIdx)}
                            className={`text-left p-3 rounded-xl border text-xs transition flex items-center justify-between gap-2 ${optClasses}`}
                          >
                            <span>{opt}</span>
                            {isAnswered && isThisCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {isAnswered && isThisSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {(showQuizResults || isAnswered) && (
                      <div className={`p-3 rounded-xl text-xs ${isCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-700'} border border-slate-200/60`}>
                        <p>
                          <strong>Explanation:</strong> {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Last-Minute Takeaways */}
        {(activeTab === 'all' || activeTab === 'takeaways') && summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Last-Minute Exam Revision Takeaways</h3>
                <p className="text-xs text-slate-500">Quick-fire revision points for the night before your exam</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.keyTakeaways.map((takeaway, idx) => (
                <div 
                  key={idx}
                  className="bg-emerald-50/40 border border-emerald-200/70 rounded-2xl p-4 flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {takeaway}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span>Need syllabus-aligned handwritten notes? Check NoteBridge verified seniors.</span>
        </div>
        <button
          onClick={() => downloadSummaryPdf(summary)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save PDF Study Pack</span>
        </button>
      </div>
    </div>
  );
};
