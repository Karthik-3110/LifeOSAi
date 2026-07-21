import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, GraduationCap, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../context/useAppData.js'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'

const emptySubject = () => ({ name: '', examDate: '', internalExamDate: '', assignmentDeadline: '', projectDeadline: '', difficulty: 'medium', credits: '' })
const dateLabel = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not scheduled'
const itemField = (type) => type === 'exam' ? 'exams' : `${type}s`

export default function SemesterCopilot() {
  const { cache, createSemester, addSemesterItem, updateSemesterItem, deleteSemesterItem } = useAppData()
  const semester = useMemo(() => (cache.semesters || []).find((item) => item.status === 'active') || cache.semesters?.[0] || null, [cache.semesters])
  const [name, setName] = useState('')
  const [subjectCount, setSubjectCount] = useState(4)
  const [subjects, setSubjects] = useState(() => Array.from({ length: 4 }, emptySubject))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(null)

  const changeCount = (value) => {
    const count = Math.max(1, Math.min(12, Number(value) || 1))
    setSubjectCount(count)
    setSubjects((current) => Array.from({ length: count }, (_, index) => current[index] || emptySubject()))
  }
  const updateSubject = (index, field, value) => setSubjects((current) => current.map((subject, itemIndex) => itemIndex === index ? { ...subject, [field]: value } : subject))
  const submit = async (event) => {
    event.preventDefault()
    if (!name.trim() || subjects.some((subject) => !subject.name.trim())) { setError('Add a semester name and a name for every subject.'); return }
    setBusy(true); setError('')
    try {
      await createSemester({ manualEntry: { semester: name.trim(), subjects: subjects.map((subject) => ({ ...subject, credits: Number(subject.credits) || 0 })) } })
    } catch (currentError) { setError(currentError.message) } finally { setBusy(false) }
  }
  const saveItem = async (event) => {
    event.preventDefault()
    try {
      const { mode, type, item, ...payload } = editor
      if (mode === 'add') await addSemesterItem(semester._id, type, payload)
      else await updateSemesterItem(semester._id, type, item.id, payload)
      setEditor(null)
    } catch (currentError) { setError(currentError.message) }
  }
  const removeItem = async (type, item) => { try { await deleteSemesterItem(semester._id, type, item.id) } catch (currentError) { setError(currentError.message) } }

  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <section className="rounded-3xl border border-accent-signal/20 bg-gradient-to-br from-accent-signal/20 via-bg-surface to-bg-surface p-6 surface-shadow sm:p-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-sm font-semibold text-accent-signal"><GraduationCap size={19} /> Guided academic setup</div><h1 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">Semester Copilot</h1><p className="mt-3 max-w-2xl text-text-secondary">Set up your subjects and important dates. LifeOS creates actionable Planner work and a separate Study Timetable automatically.</p></div>{semester && <div className="rounded-2xl border border-border-subtle bg-bg-base/70 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Current semester</p><p className="mt-1 font-display text-lg font-semibold text-text-primary">{semester.name}</p></div>}</div>
    </section>
    {error && <p className="mt-5 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">{error}</p>}
    {!semester ? <form onSubmit={submit} className="mt-8 space-y-6"><Card><div className="grid gap-5 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-text-secondary">Semester name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. B.Tech Semester 5 — Fall 2026" className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none focus:border-accent-signal" /></label><label className="grid gap-2 text-sm font-semibold text-text-secondary">Number of subjects<input type="number" min="1" max="12" value={subjectCount} onChange={(event) => changeCount(event.target.value)} className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none focus:border-accent-signal" /></label></div></Card><div className="grid gap-5 xl:grid-cols-2">{subjects.map((subject, index) => <Card key={index}><div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold text-text-primary">Subject {index + 1}</h2><Badge color="resource">{subject.difficulty}</Badge></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Subject name" value={subject.name} onChange={(value) => updateSubject(index, 'name', value)} placeholder="e.g. Data Structures" /><Field label="Exam date" type="date" value={subject.examDate} onChange={(value) => updateSubject(index, 'examDate', value)} /><Field label="Internal exam (optional)" type="date" value={subject.internalExamDate} onChange={(value) => updateSubject(index, 'internalExamDate', value)} /><Field label="Assignment deadline (optional)" type="date" value={subject.assignmentDeadline} onChange={(value) => updateSubject(index, 'assignmentDeadline', value)} /><Field label="Project deadline (optional)" type="date" value={subject.projectDeadline} onChange={(value) => updateSubject(index, 'projectDeadline', value)} /><Field label="Credits (optional)" type="number" value={subject.credits} onChange={(value) => updateSubject(index, 'credits', value)} /><label className="grid gap-2 text-xs font-semibold text-text-secondary">Difficulty<select value={subject.difficulty} onChange={(event) => updateSubject(index, 'difficulty', event.target.value)} className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label></div></Card>)}</div><Button size="lg" type="submit" disabled={busy}><Sparkles size={18} /> {busy ? 'Creating your semester...' : 'Create semester plan'}</Button></form> : <SemesterOverview semester={semester} onAdd={(type) => setEditor({ mode: 'add', type, title: '', subject: semester.subjects?.[0]?.name || '', date: '' })} onEdit={(type, item) => setEditor({ mode: 'edit', type, item, title: item.title, subject: item.subject, date: item.date?.slice(0, 10) || '' })} onDelete={removeItem} />}
    {editor && <ItemEditor editor={editor} subjects={semester?.subjects || []} onClose={() => setEditor(null)} onChange={setEditor} onSave={saveItem} />}
  </div>
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) { return <label className="grid gap-2 text-xs font-semibold text-text-secondary">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal" /></label> }

function SemesterOverview({ semester, onAdd, onEdit, onDelete }) { const groups = [['exam', 'Exams'], ['assignment', 'Assignments'], ['project', 'Projects']]; return <div className="mt-8"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Subjects" value={semester.subjects?.length || 0} /><Metric label="Upcoming exams" value={(semester.exams || []).length} /><Metric label="Important deadlines" value={(semester.assignments?.length || 0) + (semester.projects?.length || 0)} /></div><Card className="mt-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-display text-2xl font-semibold text-text-primary">Your academic calendar</h2><p className="mt-1 text-sm text-text-secondary">Edit, reschedule, or remove anything. Changes update instantly.</p></div><Link to="/study-timetable" className="inline-flex items-center gap-2 text-sm font-semibold text-accent-signal"><CalendarDays size={17} /> Open Study Timetable</Link></div><div className="mt-6 grid gap-5 xl:grid-cols-3">{groups.map(([type, title]) => <div key={type} className="rounded-2xl border border-border-subtle bg-bg-base p-4"><div className="flex items-center justify-between"><h3 className="font-semibold text-text-primary">{title}</h3><button onClick={() => onAdd(type)} className="rounded-lg p-1.5 text-accent-signal hover:bg-accent-signal/10" aria-label={`Add ${type}`}><Plus size={17} /></button></div><div className="mt-3 space-y-2">{(semester[itemField(type)] || []).length === 0 ? <p className="py-3 text-sm text-text-muted">Nothing scheduled.</p> : (semester[itemField(type)] || []).sort((a, b) => new Date(a.date) - new Date(b.date)).map((item) => <div key={item.id} className="rounded-xl border border-border-subtle bg-bg-elevated p-3"><p className="font-medium text-text-primary">{item.title}</p><p className="mt-1 text-xs text-text-muted">{item.subject} · {dateLabel(item.date)}</p><div className="mt-2 flex justify-end gap-1"><button onClick={() => onEdit(type, item)} className="p-1 text-text-muted hover:text-accent-signal"><Pencil size={14} /></button><button onClick={() => onDelete(type, item)} className="p-1 text-text-muted hover:text-node-deadline"><Trash2 size={14} /></button></div></div>)}</div></div>)}</div></Card><Card className="mt-6"><div className="flex gap-3"><CheckCircle2 className="shrink-0 text-node-resource" /><div><h2 className="font-display text-xl font-semibold text-text-primary">Planner stays actionable</h2><p className="mt-1 text-sm text-text-secondary">Assignments, projects, exam preparation, revision tasks, and deadlines are added to Planner. Your repeating study blocks stay in Study Timetable.</p></div></div></Card></div> }
function Metric({ label, value }) { return <Card className="p-5"><p className="text-sm text-text-secondary">{label}</p><p className="mt-1 font-display text-3xl font-bold text-text-primary">{value}</p></Card> }
function ItemEditor({ editor, subjects, onClose, onChange, onSave }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={onSave} className="w-full max-w-md rounded-2xl border border-border-subtle bg-bg-surface p-6 shadow-xl"><h2 className="font-display text-xl font-semibold text-text-primary">{editor.mode === 'add' ? 'Add' : 'Edit'} {editor.type}</h2><div className="mt-5 space-y-4"><Field label="Title" value={editor.title} onChange={(title) => onChange({ ...editor, title })} /><label className="grid gap-2 text-xs font-semibold text-text-secondary">Subject<select value={editor.subject} onChange={(event) => onChange({ ...editor, subject: event.target.value })} className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal">{subjects.map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}</select></label><Field label="Date" type="date" value={editor.date} onChange={(date) => onChange({ ...editor, date })} /></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div></form></div> }
