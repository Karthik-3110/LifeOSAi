import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronRight, ClipboardList, Clock3, FileUp, GraduationCap, LoaderCircle, Plus, Sparkles, Target, Trash2, UploadCloud } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'

const acceptedExtensions = ['pdf', 'docx', 'png', 'jpg', 'jpeg']
const maxSize = 25 * 1024 * 1024

const fileType = (file) => {
  if (file.type) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase()
  return ({ pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' })[extension] || ''
}

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result).split(',').pop())
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const daysUntil = (value) => {
  if (!value) return null
  const date = new Date(value)
  const difference = Math.ceil((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) / 86400000)
  return Number.isFinite(difference) ? difference : null
}

const displayDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not set'

export default function SemesterCopilot() {
  const inputRef = useRef(null)
  const [semester, setSemester] = useState(null)
  const [documents, setDocuments] = useState([])
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [manual, setManual] = useState({ semester: '', subjects: [], assignments: [], projects: [], exams: [] })
  const [subject, setSubject] = useState({ name: '', credits: '', faculty: '', lectureDays: '', lectureTime: '', difficulty: 'medium' })
  const [deadline, setDeadline] = useState({ title: '', subject: '', date: '', kind: 'assignment' })

  useEffect(() => {
    api.listSemesters()
      .then((result) => setSemester(result.items?.[0] || null))
      .catch(() => undefined)
  }, [])

  const completion = useMemo(() => {
    if (!semester) return 0
    const items = [...(semester.assignments || []), ...(semester.projects || [])]
    return items.length ? Math.round(items.reduce((sum, item) => sum + (Number(item.progress) || 0), 0) / items.length) : 0
  }, [semester])

  const addFiles = (fileList) => {
    const next = Array.from(fileList || [])
    const invalid = next.find((file) => !acceptedExtensions.includes(file.name.split('.').pop()?.toLowerCase()) || file.size > maxSize)
    if (invalid) {
      setError(`${invalid.name} must be a PDF, DOCX, PNG, JPG, or JPEG under 25 MB.`)
      return
    }
    setError('')
    setDocuments((current) => [...current, ...next].slice(0, 6))
  }

  const addSubject = () => {
    if (!subject.name.trim()) return
    setManual((current) => ({
      ...current,
      subjects: [...current.subjects, { ...subject, credits: Number(subject.credits) || 0, lectureDays: subject.lectureDays.split(',').map((day) => day.trim()).filter(Boolean) }],
    }))
    setSubject({ name: '', credits: '', faculty: '', lectureDays: '', lectureTime: '', difficulty: 'medium' })
  }

  const addDeadline = () => {
    if (!deadline.title.trim()) return
    const key = `${deadline.kind}s`
    setManual((current) => ({ ...current, [key]: [...current[key], { title: deadline.title, subject: deadline.subject, date: deadline.date || null, priority: deadline.kind === 'project' ? 'high' : 'medium' }] }))
    setDeadline({ title: '', subject: '', date: '', kind: 'assignment' })
  }

  const generate = async () => {
    if (!manual.semester.trim() && !manual.subjects.length && !documents.length) {
      setError('Add a semester name, at least one subject, or an academic document first.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const payloadDocuments = await Promise.all(documents.map(async (file) => ({ name: file.name, type: fileType(file), base64: await toBase64(file) })))
      const result = await api.generateSemester({ manualEntry: manual, documents: payloadDocuments })
      setSemester(result.semester)
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setBusy(false)
    }
  }

  const updateAssignment = async (assignment, status) => {
    try {
      const updated = await api.updateSemesterAssignment(semester._id, assignment.id, { status })
      setSemester(updated)
    } catch (currentError) {
      setError(currentError.message)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-accent-signal/20 bg-gradient-to-br from-accent-signal/20 via-bg-surface to-bg-surface p-6 surface-shadow sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-accent-signal"><GraduationCap size={19} /> AI-powered academic planning</div>
            <h1 className="mt-3 font-display text-3xl font-bold text-text-primary sm:text-4xl">Semester Copilot</h1>
            <p className="mt-3 max-w-2xl text-text-secondary">Upload your semester details and let AI organize your entire semester.</p>
          </div>
          {semester && <div className="rounded-2xl border border-border-subtle bg-bg-base/70 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Active semester</p><p className="mt-1 font-display text-lg font-semibold text-text-primary">{semester.name}</p></div>}
        </div>
      </section>

      {error && <div className="mt-6 rounded-xl border border-node-deadline/30 bg-node-deadline/10 px-4 py-3 text-sm text-node-deadline">{error}</div>}

      {!semester && (
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="flex items-start gap-3"><div className="rounded-xl bg-accent-signal/15 p-3 text-accent-signal"><UploadCloud size={22} /></div><div><h2 className="font-display text-2xl font-semibold text-text-primary">Upload semester documents</h2><p className="mt-1 text-sm text-text-secondary">Timetables, exam schedules, syllabi, assignment sheets, and academic calendars.</p></div></div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }}
              className={`mt-6 flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition ${dragging ? 'border-accent-signal bg-accent-signal/10' : 'border-border-subtle bg-bg-base hover:border-accent-signal/60'}`}
            >
              <FileUp className="text-accent-signal" size={30} />
              <p className="mt-3 font-semibold text-text-primary">Drop files here or choose files</p>
              <p className="mt-2 text-xs text-text-muted">PDF, DOCX, PNG, JPG, JPEG · up to 25 MB each</p>
            </button>
            <input ref={inputRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg" multiple className="hidden" onChange={(event) => addFiles(event.target.files)} />
            {documents.length > 0 && <div className="mt-4 space-y-2">{documents.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-sm"><FileUp size={16} className="text-accent-signal" /><span className="min-w-0 flex-1 truncate text-text-primary">{file.name}</span><span className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</span><button onClick={() => setDocuments((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-text-muted hover:text-node-deadline" aria-label={`Remove ${file.name}`}><Trash2 size={15} /></button></div>)}</div>}
          </Card>

          <Card>
            <div className="flex items-start gap-3"><div className="rounded-xl bg-node-goal/15 p-3 text-node-goal"><ClipboardList size={22} /></div><div><h2 className="font-display text-2xl font-semibold text-text-primary">Manual entry</h2><p className="mt-1 text-sm text-text-secondary">No documents? Add the important details here.</p></div></div>
            <label className="mt-6 grid gap-2 text-sm font-semibold text-text-secondary">Semester<input value={manual.semester} onChange={(event) => setManual((current) => ({ ...current, semester: event.target.value }))} placeholder="e.g. B.Tech Semester 5 — Fall 2026" className="rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none focus:border-accent-signal" /></label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><input value={subject.name} onChange={(event) => setSubject((current) => ({ ...current, name: event.target.value }))} placeholder="Subject" className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal" /><input value={subject.credits} type="number" min="0" onChange={(event) => setSubject((current) => ({ ...current, credits: event.target.value }))} placeholder="Credits" className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal" /><input value={subject.faculty} onChange={(event) => setSubject((current) => ({ ...current, faculty: event.target.value }))} placeholder="Faculty" className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal" /><input value={subject.lectureDays} onChange={(event) => setSubject((current) => ({ ...current, lectureDays: event.target.value }))} placeholder="Lecture days (Mon, Wed)" className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal" /><input value={subject.lectureTime} onChange={(event) => setSubject((current) => ({ ...current, lectureTime: event.target.value }))} placeholder="Lecture time" className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal" /><select value={subject.difficulty} onChange={(event) => setSubject((current) => ({ ...current, difficulty: event.target.value }))} className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
            <Button variant="secondary" size="sm" className="mt-3" onClick={addSubject}><Plus size={15} /> Add subject</Button>
            <div className="mt-3 flex flex-wrap gap-2">{manual.subjects.map((item, index) => <Badge key={`${item.name}-${index}`} color="resource">{item.name}{item.credits ? ` · ${item.credits} cr` : ''}<button onClick={() => setManual((current) => ({ ...current, subjects: current.subjects.filter((_, itemIndex) => itemIndex !== index) }))} className="ml-1">×</button></Badge>)}</div>
            <div className="mt-5 border-t border-border-subtle pt-4"><p className="text-sm font-semibold text-text-secondary">Deadlines and important dates</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><input value={deadline.title} onChange={(event) => setDeadline((current) => ({ ...current, title: event.target.value }))} placeholder="Exam, assignment, or project" className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal" /><input value={deadline.subject} onChange={(event) => setDeadline((current) => ({ ...current, subject: event.target.value }))} placeholder="Subject" className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal" /><input value={deadline.date} type="date" onChange={(event) => setDeadline((current) => ({ ...current, date: event.target.value }))} className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal" /><select value={deadline.kind} onChange={(event) => setDeadline((current) => ({ ...current, kind: event.target.value }))} className="rounded-xl border border-border-subtle bg-bg-base px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-signal"><option value="assignment">Assignment</option><option value="project">Project</option><option value="exam">Exam</option></select></div><Button variant="secondary" size="sm" className="mt-3" onClick={addDeadline}><Plus size={15} /> Add date</Button></div>
          </Card>
          <div className="xl:col-span-2"><Button size="lg" onClick={generate} disabled={busy}><Sparkles size={18} /> {busy ? 'Analyzing semester documents…' : 'Generate Semester Plan'}</Button>{busy && <p className="mt-3 flex items-center gap-2 text-sm text-text-secondary"><LoaderCircle className="animate-spin text-accent-signal" size={16} /> Extracting details, balancing study time, and creating your planner.</p>}</div>
        </div>
      )}

      {semester && <SemesterDashboard semester={semester} completion={completion} onAssignmentUpdate={updateAssignment} />}
    </div>
  )
}

function SemesterDashboard({ semester, completion, onAssignmentUpdate }) {
  const exams = (semester.exams || []).filter((item) => daysUntil(item.date) !== null).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 4)
  const assignments = semester.assignments || []
  return <>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={GraduationCap} label="Subjects" value={semester.subjects?.length || 0} detail={`${(semester.subjects || []).reduce((sum, item) => sum + (Number(item.credits) || 0), 0)} credits`} /><Metric icon={ClipboardList} label="Assignments" value={assignments.length} detail={`${assignments.filter((item) => item.status === 'completed').length} completed`} /><Metric icon={Target} label="Study progress" value={`${completion}%`} detail="Across assignments and projects" /><Metric icon={CalendarDays} label="Upcoming exams" value={exams.length} detail="Auto-updated daily" /></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card><div className="flex items-center justify-between"><div><h2 className="font-display text-2xl font-semibold text-text-primary">Exam countdown</h2><p className="mt-1 text-sm text-text-secondary">Your highest-focus dates, always current.</p></div><Clock3 className="text-accent-signal" /></div><div className="mt-6 space-y-3">{exams.length ? exams.map((exam) => { const left = daysUntil(exam.date); return <div key={exam.id} className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-base p-4"><div><p className="font-semibold text-text-primary">{exam.title}</p><p className="mt-1 text-sm text-text-muted">{exam.subject || 'Exam'} · {displayDate(exam.date)}</p></div><p className={`font-display text-xl font-bold ${left <= 7 ? 'text-node-deadline' : 'text-accent-signal'}`}>{left < 0 ? 'Passed' : left === 0 ? 'Today' : `${left} days`}</p></div> }) : <p className="rounded-xl bg-bg-base p-4 text-sm text-text-secondary">No dated exams yet. Add exam dates to sharpen the plan.</p>}</div></Card>
      <Card><div className="flex items-center justify-between gap-4"><div><h2 className="font-display text-2xl font-semibold text-text-primary">Assignment tracker</h2><p className="mt-1 text-sm text-text-secondary">Complete items here and keep your semester record current.</p></div><Badge color="goal">{assignments.filter((item) => item.status === 'pending').length} pending</Badge></div><div className="mt-6 space-y-3">{assignments.length ? assignments.map((assignment) => <div key={assignment.id} className="rounded-xl border border-border-subtle bg-bg-base p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-text-primary">{assignment.title}</p><p className="mt-1 text-sm text-text-muted">{assignment.subject || 'General'} · Due {displayDate(assignment.date)}</p></div><button onClick={() => onAssignmentUpdate(assignment, assignment.status === 'completed' ? 'pending' : 'completed')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${assignment.status === 'completed' ? 'bg-node-resource/15 text-node-resource' : 'bg-accent-signal/15 text-accent-signal'}`}>{assignment.status === 'completed' ? 'Completed' : 'Mark complete'}</button></div><div className="mt-3 flex items-center gap-3"><div className="min-w-0 flex-1"><ProgressBar value={assignment.status === 'completed' ? 100 : assignment.progress || 0} /></div><span className="text-xs text-text-muted">{assignment.status}</span></div></div>) : <p className="rounded-xl bg-bg-base p-4 text-sm text-text-secondary">No assignments detected.</p>}</div></Card>
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-3"><Card className="xl:col-span-2"><div className="flex items-center justify-between"><div><h2 className="font-display text-2xl font-semibold text-text-primary">AI study calendar</h2><p className="mt-1 text-sm text-text-secondary">Generated study and revision blocks are already in Planner.</p></div><Link to="/planner" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-signal hover:text-accent-signal-hi">Open Planner <ChevronRight size={16} /></Link></div><div className="mt-6 grid gap-3 md:grid-cols-2">{(semester.studyPlan || []).slice(0, 8).map((item, index) => <div key={`${item.title}-${index}`} className="rounded-xl border border-border-subtle bg-bg-base p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-text-primary">{item.title}</p><Badge color="resource">{item.estimatedTime || 60} min</Badge></div><p className="mt-2 text-sm text-text-muted">{displayDate(item.date)} · {item.category || item.subject || 'Study'}</p></div>)}</div></Card><Card><h2 className="font-display text-2xl font-semibold text-text-primary">Connected workspace</h2><p className="mt-2 text-sm text-text-secondary">Goals, Planner tasks, and a knowledge graph were created with this plan.</p><div className="mt-6 space-y-3"><Link to="/planner" className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-base p-3 text-sm font-semibold text-text-primary hover:bg-bg-surface-hi">Planner <ChevronRight size={16} /></Link>{semester.brainDumpId && <Link to={`/canvas?brainDump=${semester.brainDumpId}`} className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-base p-3 text-sm font-semibold text-text-primary hover:bg-bg-surface-hi">Semester knowledge graph <ChevronRight size={16} /></Link>}<Link to="/dashboard" className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-base p-3 text-sm font-semibold text-text-primary hover:bg-bg-surface-hi">Dashboard <ChevronRight size={16} /></Link></div></Card></div>
  </>
}

function Metric({ icon: Icon, label, value, detail }) { return <Card className="p-5"><Icon className="text-accent-signal" size={20} /><p className="mt-4 text-sm font-medium text-text-secondary">{label}</p><p className="mt-1 font-display text-3xl font-bold text-text-primary">{value}</p><p className="mt-1 text-xs text-text-muted">{detail}</p></Card> }
