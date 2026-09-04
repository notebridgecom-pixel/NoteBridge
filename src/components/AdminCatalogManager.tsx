import React, { useState } from 'react';
import {
  AcademicCollege,
  AcademicCourse,
  AcademicBranch,
  AcademicSubject,
  AcademicCatalog,
} from '../types';
import {
  getAcademicCatalog,
  saveAcademicCatalog,
  addCollege,
  updateCollege,
  deleteCollege,
  addCourse,
  updateCourse,
  deleteCourse,
  addBranch,
  updateBranch,
  deleteBranch,
  addSubject,
  updateSubject,
  deleteSubject,
  addAcademicYear,
  resetCatalogToDefault,
} from '../utils/catalogStorage';
import {
  Building2,
  GraduationCap,
  Layers,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AdminCatalogManager: React.FC = () => {
  const [catalog, setCatalog] = useState<AcademicCatalog>(() => getAcademicCatalog());
  const [activeSubTab, setActiveSubTab] = useState<'colleges' | 'courses' | 'branches' | 'subjects' | 'years'>('colleges');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Form states
  const [editingCollegeId, setEditingCollegeId] = useState<string | null>(null);
  const [showAddCollege, setShowAddCollege] = useState(false);
  const [collegeForm, setCollegeForm] = useState<Partial<AcademicCollege>>({
    name: '',
    shortName: '',
    code: '',
    type: 'polytechnic',
    affiliatedUniversity: 'MSBTE',
    city: 'Mumbai',
    state: 'Maharashtra',
    isActive: true,
  });

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [courseForm, setCourseForm] = useState<Partial<AcademicCourse>>({
    name: '',
    code: '',
    stream: 'Diploma',
    durationYears: 3,
    totalSemesters: 6,
    isActive: true,
    collegeIds: [],
  });

  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchForm, setBranchForm] = useState<Partial<AcademicBranch>>({
    name: '',
    code: '',
    courseId: 'course-diploma',
    collegeIds: ['col-vpoly'],
    isActive: true,
  });

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState<Partial<AcademicSubject>>({
    name: '',
    code: '',
    semester: 3,
    collegeId: 'col-vpoly',
    courseId: 'course-diploma',
    branchId: 'branch-diploma-co',
    units: ['Unit 1: Fundamentals', 'Unit 2: Core Concepts', 'Unit 3: Applied Principles', 'Unit 4: Advanced Topics', 'Unit 5: Solved PYQs'],
    isActive: true,
  });
  const [unitsInput, setUnitsInput] = useState('');

  const [newYearInput, setNewYearInput] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const refreshCatalog = () => {
    setCatalog(getAcademicCatalog());
  };

  // --- College Actions ---
  const handleSaveCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeForm.name || !collegeForm.code) return;

    if (editingCollegeId) {
      updateCollege(editingCollegeId, collegeForm);
      showToast(`Updated college: ${collegeForm.name}`);
      setEditingCollegeId(null);
    } else {
      addCollege(collegeForm as any);
      showToast(`Added new college: ${collegeForm.name}`);
      setShowAddCollege(false);
    }
    setCollegeForm({
      name: '',
      shortName: '',
      code: '',
      type: 'polytechnic',
      affiliatedUniversity: 'MSBTE',
      city: 'Mumbai',
      state: 'Maharashtra',
      isActive: true,
    });
    refreshCatalog();
  };

  const handleToggleCollegeActive = (college: AcademicCollege) => {
    updateCollege(college.id, { isActive: !college.isActive });
    showToast(`${college.name} is now ${!college.isActive ? 'Active (Visible)' : 'Hidden'}`);
    refreshCatalog();
  };

  const handleDeleteCollege = (collegeId: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from the academic catalog?`)) {
      deleteCollege(collegeId);
      showToast(`Deleted college: ${name}`);
      refreshCatalog();
    }
  };

  // --- Course Actions ---
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.name || !courseForm.code) return;

    if (editingCourseId) {
      updateCourse(editingCourseId, courseForm);
      showToast(`Updated course: ${courseForm.name}`);
      setEditingCourseId(null);
    } else {
      addCourse(courseForm as any);
      showToast(`Added course: ${courseForm.name}`);
      setShowAddCourse(false);
    }
    setCourseForm({
      name: '',
      code: '',
      stream: 'Diploma',
      durationYears: 3,
      totalSemesters: 6,
      isActive: true,
      collegeIds: [],
    });
    refreshCatalog();
  };

  const handleToggleCourseActive = (course: AcademicCourse) => {
    updateCourse(course.id, { isActive: !course.isActive });
    showToast(`${course.name} is now ${!course.isActive ? 'Active' : 'Hidden'}`);
    refreshCatalog();
  };

  const handleDeleteCourse = (courseId: string, name: string) => {
    if (confirm(`Delete course "${name}"?`)) {
      deleteCourse(courseId);
      showToast(`Deleted course: ${name}`);
      refreshCatalog();
    }
  };

  // --- Branch Actions ---
  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.code) return;

    if (editingBranchId) {
      updateBranch(editingBranchId, branchForm);
      showToast(`Updated branch: ${branchForm.name}`);
      setEditingBranchId(null);
    } else {
      addBranch(branchForm as any);
      showToast(`Added branch: ${branchForm.name}`);
      setShowAddBranch(false);
    }
    setBranchForm({
      name: '',
      code: '',
      courseId: 'course-diploma',
      collegeIds: ['col-vpoly'],
      isActive: true,
    });
    refreshCatalog();
  };

  const handleToggleBranchActive = (branch: AcademicBranch) => {
    updateBranch(branch.id, { isActive: !branch.isActive });
    showToast(`${branch.name} is now ${!branch.isActive ? 'Active' : 'Hidden'}`);
    refreshCatalog();
  };

  const handleDeleteBranch = (branchId: string, name: string) => {
    if (confirm(`Delete branch "${name}"?`)) {
      deleteBranch(branchId);
      showToast(`Deleted branch: ${name}`);
      refreshCatalog();
    }
  };

  // --- Subject Actions ---
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name || !subjectForm.code) return;

    const unitsArray = unitsInput
      ? unitsInput.split('\n').map((u) => u.trim()).filter(Boolean)
      : subjectForm.units || ['Unit 1 to 5'];

    const payload = {
      ...subjectForm,
      units: unitsArray,
    };

    if (editingSubjectId) {
      updateSubject(editingSubjectId, payload);
      showToast(`Updated subject: ${subjectForm.name}`);
      setEditingSubjectId(null);
    } else {
      addSubject(payload as any);
      showToast(`Added subject: ${subjectForm.name}`);
      setShowAddSubject(false);
    }
    setSubjectForm({
      name: '',
      code: '',
      semester: 3,
      collegeId: 'col-vpoly',
      courseId: 'course-diploma',
      branchId: 'branch-diploma-co',
      units: ['Unit 1 to 5 (Full Syllabus)'],
      isActive: true,
    });
    setUnitsInput('');
    refreshCatalog();
  };

  const handleToggleSubjectActive = (subject: AcademicSubject) => {
    updateSubject(subject.id, { isActive: !subject.isActive });
    showToast(`${subject.name} is now ${!subject.isActive ? 'Active' : 'Hidden'}`);
    refreshCatalog();
  };

  const handleDeleteSubject = (subjectId: string, name: string) => {
    if (confirm(`Delete subject "${name}"?`)) {
      deleteSubject(subjectId);
      showToast(`Deleted subject: ${name}`);
      refreshCatalog();
    }
  };

  // --- Year Actions ---
  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearInput.trim()) return;
    addAcademicYear(newYearInput.trim());
    showToast(`Added academic year ${newYearInput.trim()}`);
    setNewYearInput('');
    refreshCatalog();
  };

  const handleResetDefaults = () => {
    if (confirm('Reset entire catalog to Vidyalankar Polytechnic & Vidyalankar Engineering College standards?')) {
      resetCatalogToDefault();
      showToast('Academic catalog reset to default structure');
      refreshCatalog();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
              Dynamic Database
            </span>
            <span className="text-xs text-slate-500">
              {catalog.colleges.length} Institutions • {catalog.courses.length} Streams • {catalog.branches.length} Branches • {catalog.subjects.length} Subjects
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Admin Academic Catalog Management
          </h2>
          <p className="text-xs text-slate-500">
            Control dynamic dropdown options across the site. Hierarchy: College → Course → Branch → Semester → Subject → Unit
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Vidyalankar Presets</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Subtabs navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('colleges')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'colleges'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Colleges & Institutions ({catalog.colleges.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('courses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'courses'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Courses / Degree Streams ({catalog.courses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'branches'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Branches / Departments ({catalog.branches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'subjects'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects & Units ({catalog.subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('years')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'years'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Academic Years ({catalog.academicYears.length})</span>
        </button>
      </div>

      {/* ==================== 1. COLLEGES TAB ==================== */}
      {activeSubTab === 'colleges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Colleges & Higher Institutions
            </h3>
            {!showAddCollege && !editingCollegeId && (
              <button
                onClick={() => {
                  setShowAddCollege(true);
                  setCollegeForm({
                    name: '',
                    shortName: '',
                    code: '',
                    type: 'engineering',
                    affiliatedUniversity: 'Mumbai University (MU)',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    isActive: true,
                  });
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add College</span>
              </button>
            )}
          </div>

          {/* Add / Edit College Form Modal / Inline Box */}
          {(showAddCollege || editingCollegeId) && (
            <form onSubmit={handleSaveCollege} className="bg-blue-50/60 border-2 border-blue-200 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  {editingCollegeId ? 'Edit College / Institution' : 'Add New College'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCollege(false);
                    setEditingCollegeId(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    College Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vidyalankar Polytechnic"
                    value={collegeForm.name || ''}
                    onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    College Code / Acronym *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VP / VIT"
                    value={collegeForm.code || ''}
                    onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Institution Type
                  </label>
                  <select
                    value={collegeForm.type || 'polytechnic'}
                    onChange={(e) => setCollegeForm({ ...collegeForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="polytechnic">Polytechnic / Diploma</option>
                    <option value="engineering">Engineering College</option>
                    <option value="degree_college">Degree / Science / Commerce College</option>
                    <option value="university">University</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Affiliated Board / University
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MSBTE or Mumbai University (MU)"
                    value={collegeForm.affiliatedUniversity || ''}
                    onChange={(e) => setCollegeForm({ ...collegeForm, affiliatedUniversity: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    City, State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wadala, Mumbai"
                    value={collegeForm.city || ''}
                    onChange={(e) => setCollegeForm({ ...collegeForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCollege(false);
                    setEditingCollegeId(null);
                  }}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save College
                </button>
              </div>
            </form>
          )}

          {/* Colleges List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {catalog.colleges.map((college) => (
              <div
                key={college.id}
                className={`p-4 rounded-2xl border transition bg-white flex flex-col justify-between space-y-3 ${
                  !college.isActive ? 'opacity-60 bg-slate-50 border-dashed border-slate-300' : 'border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {college.name}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[10px] font-bold">
                        {college.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Affiliation: <strong>{college.affiliatedUniversity}</strong> • {college.city || 'Mumbai'}
                    </p>
                    <span className="inline-block text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Type: {college.type}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    college.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {college.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => handleToggleCollegeActive(college)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                    title={college.isActive ? 'Hide College' : 'Show College'}
                  >
                    {college.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCollegeId(college.id);
                      setCollegeForm(college);
                    }}
                    className="p-1.5 hover:bg-slate-100 text-blue-600 rounded-lg transition"
                    title="Edit Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCollege(college.id, college.name)}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                    title="Delete College"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 2. COURSES TAB ==================== */}
      {activeSubTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Courses / Degree Streams (Diploma, BE/B.Tech, B.Com, MCA, MBA, etc.)
            </h3>
            {!showAddCourse && !editingCourseId && (
              <button
                onClick={() => {
                  setShowAddCourse(true);
                  setCourseForm({
                    name: '',
                    code: '',
                    stream: 'B.Sc',
                    durationYears: 3,
                    totalSemesters: 6,
                    isActive: true,
                    collegeIds: [],
                  });
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Stream</span>
              </button>
            )}
          </div>

          {/* Add / Edit Course */}
          {(showAddCourse || editingCourseId) && (
            <form onSubmit={handleSaveCourse} className="bg-blue-50/60 border-2 border-blue-200 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  {editingCourseId ? 'Edit Degree Stream' : 'Add New Degree Stream'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCourse(false);
                    setEditingCourseId(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BE / B.Tech or BCA"
                    value={courseForm.name || ''}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Stream Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering, Commerce, IT"
                    value={courseForm.stream || ''}
                    onChange={(e) => setCourseForm({ ...courseForm, stream: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Total Semesters
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={courseForm.totalSemesters || 6}
                    onChange={(e) => setCourseForm({ ...courseForm, totalSemesters: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCourse(false);
                    setEditingCourseId(null);
                  }}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Stream
                </button>
              </div>
            </form>
          )}

          {/* Courses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {catalog.courses.map((course) => (
              <div
                key={course.id}
                className={`p-4 rounded-2xl border bg-white flex flex-col justify-between space-y-2 ${
                  !course.isActive ? 'opacity-60 bg-slate-50' : 'border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs">{course.name}</h4>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                      course.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {course.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {course.durationYears} Years • {course.totalSemesters} Semesters • {course.stream}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleCourseActive(course)}
                    className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                    title={course.isActive ? 'Hide' : 'Show'}
                  >
                    {course.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCourseId(course.id);
                      setCourseForm(course);
                    }}
                    className="p-1 text-blue-600 hover:bg-slate-100 rounded"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id, course.name)}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 3. BRANCHES TAB ==================== */}
      {activeSubTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Branches & Academic Departments
            </h3>
            {!showAddBranch && !editingBranchId && (
              <button
                onClick={() => {
                  setShowAddBranch(true);
                  setBranchForm({
                    name: '',
                    code: '',
                    courseId: catalog.courses[0]?.id || 'course-diploma',
                    collegeIds: [catalog.colleges[0]?.id || 'col-vpoly'],
                    isActive: true,
                  });
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Branch</span>
              </button>
            )}
          </div>

          {/* Add / Edit Branch */}
          {(showAddBranch || editingBranchId) && (
            <form onSubmit={handleSaveBranch} className="bg-blue-50/60 border-2 border-blue-200 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  {editingBranchId ? 'Edit Branch' : 'Add New Branch'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBranch(false);
                    setEditingBranchId(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Artificial Intelligence and Data Science"
                    value={branchForm.name || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI-DS or CO"
                    value={branchForm.code || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Linked Course / Stream
                  </label>
                  <select
                    value={branchForm.courseId || 'course-diploma'}
                    onChange={(e) => setBranchForm({ ...branchForm, courseId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  >
                    {catalog.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBranch(false);
                    setEditingBranchId(null);
                  }}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Branch
                </button>
              </div>
            </form>
          )}

          {/* Branches List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {catalog.branches.map((branch) => {
              const linkedCourse = catalog.courses.find((c) => c.id === branch.courseId);
              return (
                <div
                  key={branch.id}
                  className={`p-4 rounded-2xl border bg-white flex flex-col justify-between space-y-2 ${
                    !branch.isActive ? 'opacity-60 bg-slate-50' : 'border-slate-200 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[180px]">
                        {branch.name}
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-bold rounded">
                        {branch.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Stream: {linkedCourse?.name || 'General'}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleToggleBranchActive(branch)}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                    >
                      {branch.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingBranchId(branch.id);
                        setBranchForm(branch);
                      }}
                      className="p-1 text-blue-600 hover:bg-slate-100 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch.id, branch.name)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== 4. SUBJECTS & UNITS TAB ==================== */}
      {activeSubTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Syllabus Subjects & Units / Modules
            </h3>
            {!showAddSubject && !editingSubjectId && (
              <button
                onClick={() => {
                  setShowAddSubject(true);
                  setSubjectForm({
                    name: '',
                    code: '',
                    semester: 3,
                    collegeId: catalog.colleges[0]?.id || 'col-vpoly',
                    courseId: catalog.courses[0]?.id || 'course-diploma',
                    branchId: catalog.branches[0]?.id || 'branch-diploma-co',
                    units: ['Unit 1 to 5 (Full Syllabus)'],
                    isActive: true,
                  });
                  setUnitsInput('Unit 1: Fundamentals\nUnit 2: Theory & Principles\nUnit 3: Applied Numericals\nUnit 4: Advanced Framework\nUnit 5: University Solved Papers');
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </button>
            )}
          </div>

          {/* Add / Edit Subject Form */}
          {(showAddSubject || editingSubjectId) && (
            <form onSubmit={handleSaveSubject} className="bg-blue-50/60 border-2 border-blue-200 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  {editingSubjectId ? 'Edit Subject & Units' : 'Add Subject to Catalog'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubject(false);
                    setEditingSubjectId(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures using C (DSU)"
                    value={subjectForm.name || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 22317 / CS301"
                    value={subjectForm.code || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    College / Board
                  </label>
                  <select
                    value={subjectForm.collegeId || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, collegeId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  >
                    {catalog.colleges.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={subjectForm.semester || 3}
                    onChange={(e) => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Branch
                  </label>
                  <select
                    value={subjectForm.branchId || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, branchId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  >
                    {catalog.branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Units Input (One per line) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Syllabus Units / Modules (one per line)
                </label>
                <textarea
                  rows={4}
                  placeholder={`Unit 1: Overview\nUnit 2: Linear Data Structures\nUnit 3: Non-Linear Trees\nUnit 4: Graphs & Sorting\nUnit 5: Solved PYQs`}
                  value={unitsInput}
                  onChange={(e) => setUnitsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubject(false);
                    setEditingSubjectId(null);
                  }}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Subject
                </button>
              </div>
            </form>
          )}

          {/* Subjects Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-3">Subject Name</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Sem</th>
                  <th className="p-3">Units Covered</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalog.subjects.map((subj) => (
                  <tr key={subj.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">{subj.name}</td>
                    <td className="p-3 font-mono text-slate-600">{subj.code}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold text-[11px]">
                        Sem {subj.semester}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">
                      {subj.units?.join(', ') || 'All Units'}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleToggleSubjectActive(subj)}
                        className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                        title={subj.isActive ? 'Hide' : 'Show'}
                      >
                        {subj.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingSubjectId(subj.id);
                          setSubjectForm(subj);
                          setUnitsInput(subj.units?.join('\n') || '');
                        }}
                        className="p-1 text-blue-600 hover:bg-slate-100 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subj.id, subj.name)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 5. ACADEMIC YEARS TAB ==================== */}
      {activeSubTab === 'years' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Academic Years
            </h3>
          </div>

          <form onSubmit={handleAddYear} className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="e.g. 2026-2027"
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Year</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {catalog.academicYears.map((yr) => (
              <span
                key={yr}
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-xs flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{yr}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
