import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Brain, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, Edit3, FileText, Flag, GitBranch, LayoutGrid, Redo2, RefreshCcw, Save, Search, Target, Trash2, Undo2, X } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import GoalNode from '../components/canvas/GoalNode.jsx'
import TaskNode from '../components/canvas/TaskNode.jsx'
import DeadlineNode from '../components/canvas/DeadlineNode.jsx'
import ResourceNode from '../components/canvas/ResourceNode.jsx'
import AssistantPanel from '../components/canvas/AssistantPanel.jsx'
import BillingPanel from '../components/settings/BillingPanel.jsx'
import { useAuth } from '../context/useAuth.js'
import { useAppData } from '../context/useAppData.js'
import { buildPlannerDays } from '../lib/planner.js'
import logoImage from '../assets/logo.png'

const palette = [
  { type: 'goal', label: 'Goal', icon: Target, meta: 'Strategic outcome' },
  { type: 'task', label: 'Task', icon: Flag, meta: 'Next action' },
  { type: 'deadline', label: 'Deadline', icon: CalendarClock, meta: 'Due date' },
  { type: 'resource', label: 'Resource', icon: FileText, meta: 'Context' },
]

const actionableNodeTypes = new Set(['goal', 'task', 'deadline'])

export default function Canvas() {
  const { setUser, user } = useAuth()
  const {
    cache,
    loading: dataLoading,
    ensureBrainDumps,
    ensureCanvas,
    ensureAnalytics,
    ensurePlannerWeek,
    setCanvasDraft,
    saveCanvas: saveCachedCanvas,
    createBrainDump,
    renameBrainDump: renameCachedBrainDump,
    deleteBrainDump: deleteCachedBrainDump,
    duplicateBrainDump: duplicateCachedBrainDump,
    restoreBrainDump: restoreCachedBrainDump,
  } = useAppData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [assistantOpen, setAssistantOpen] = useState(true)
  const [activeBrainDumpId, setActiveBrainDumpId] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [brainDumpOpen, setBrainDumpOpen] = useState(false)
  const [billingOpen, setBillingOpen] = useState(false)
  const [brainDumpInput, setBrainDumpInput] = useState('')
  const [brainDumpSearch, setBrainDumpSearch] = useState('')
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState('Saved')
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const nodeCounter = useRef(0)
  const loaded = useRef(false)
  const skipNextSave = useRef(false)
  const history = useRef([])
  const future = useRef([])
  const nodeTypes = useMemo(() => ({ goal: GoalNode, task: TaskNode, deadline: DeadlineNode, resource: ResourceNode }), [])

  const brainDumps = cache.brainDumps || []
  const filteredBrainDumps = brainDumps.filter((item) => item.title.toLowerCase().includes(brainDumpSearch.toLowerCase()))
  const activeBrainDump = brainDumps.find((item) => item._id === activeBrainDumpId)
  const loading = dataLoading.brainDumps || Boolean(activeBrainDumpId && dataLoading[`canvas:${activeBrainDumpId}`])
  const hasBrainDumpAccess = (user?.brainDumpCredits ?? 0) > 0
    || (user?.unlimitedBrainDumpsUntil && new Date(user.unlimitedBrainDumpsUntil) > new Date())
  const actionableNodes = useMemo(() => nodes.filter((node) => actionableNodeTypes.has(node.type)), [nodes])
  const completedNodes = actionableNodes.filter((node) => node.data?.completed).length
  const completionPercent = actionableNodes.length ? Math.round((completedNodes / actionableNodes.length) * 100) : 0
  const snapshot = useCallback(() => ({ nodes, edges }), [edges, nodes])

  const pushHistory = useCallback(() => {
    history.current = [...history.current.slice(-24), snapshot()]
    future.current = []
  }, [snapshot])

  const loadCanvas = useCallback(async (brainDumpId) => {
    if (!brainDumpId) {
      setNodes([])
      setEdges([])
      setActiveBrainDumpId('')
      loaded.current = true
      return
    }

    loaded.current = false
    setError('')
    try {
      const canvas = await ensureCanvas(brainDumpId)
      skipNextSave.current = true
      setNodes(canvas.nodes || [])
      setEdges(canvas.edges || [])
      setActiveBrainDumpId(brainDumpId)
      setSaveStatus('Saved')
      setSearchParams({ brainDump: brainDumpId })
      history.current = []
      future.current = []
      loaded.current = true
    } catch (currentError) {
      setError(currentError.message)
    }
  }, [ensureCanvas, setEdges, setNodes, setSearchParams])

  const loadBrainDumps = useCallback(async (preferredId = '') => {
    setError('')
    try {
      const items = await ensureBrainDumps()
      const nextId = preferredId && items.some((item) => item._id === preferredId) ? preferredId : items[0]?._id || ''
      await loadCanvas(nextId)
    } catch (currentError) {
      setError(currentError.message)
    }
  }, [ensureBrainDumps, loadCanvas])

  useEffect(() => {
    if (searchParams.get('buyCredits')) {
      setBillingOpen(true)
    }
    loadBrainDumps(searchParams.get('brainDump') || '')
    // Initial query param only; later selection is controlled by loadCanvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loaded.current || !activeBrainDumpId) return undefined
    if (skipNextSave.current) {
      skipNextSave.current = false
      return undefined
    }
    setSaveStatus('Saving...')
    setCanvasDraft(activeBrainDumpId, nodes, edges)
    const timeout = window.setTimeout(async () => {
      try {
        await saveCachedCanvas(activeBrainDumpId, nodes, edges)
        setSaveStatus('Saved')
      } catch (currentError) {
        setSaveStatus('Save failed')
        setError(currentError.message)
      }
    }, 700)

    return () => window.clearTimeout(timeout)
  }, [activeBrainDumpId, edges, nodes, saveCachedCanvas, setCanvasDraft])

  const onConnect = useCallback((params) => {
    if (!activeBrainDumpId) {
      setBrainDumpOpen(true)
      return
    }
    pushHistory()
    setEdges((currentEdges) => addEdge({ ...params, animated: true, style: { stroke: 'var(--accent-signal)' } }, currentEdges))
  }, [activeBrainDumpId, pushHistory, setEdges])

  const addNode = (type) => {
    if (!activeBrainDumpId) {
      setBrainDumpOpen(true)
      return
    }

    pushHistory()
    nodeCounter.current += 1
    const id = `${type}-draft-${nodeCounter.current}`
    setNodes((currentNodes) => [
      ...currentNodes,
      {
        id,
        type,
        position: { x: 120 + currentNodes.length * 38, y: 140 + currentNodes.length * 26 },
        data: { label: `New ${type}`, meta: 'Draft node' },
      },
    ])
  }

  const openBrainDump = () => {
    if (!hasBrainDumpAccess) {
      setBillingOpen(true)
      return
    }
    setBrainDumpOpen(true)
  }

  const runBrainDump = async (fallback = '') => {
    if (!hasBrainDumpAccess) {
      setBillingOpen(true)
      return
    }

    const input = (brainDumpInput || fallback).trim()
    if (!input) {
      setError('Enter a brain dump first.')
      setBrainDumpOpen(true)
      return
    }

    pushHistory()
    setAiLoading(true)
    setError('')
    try {
      const result = await createBrainDump(input)
      setUser((current) => current ? { ...current, ...result.credits } : current)
      setBrainDumpInput('')
      setBrainDumpOpen(false)
      if ((result.credits?.brainDumpCredits ?? 0) <= 0 && !result.credits?.unlimitedBrainDumpsUntil) {
        setBillingOpen(true)
      }
      await loadCanvas(result.brainDump._id)
    } catch (currentError) {
      if (currentError.code === 'CREDITS_EXHAUSTED') {
        setBillingOpen(true)
      }
      setError(currentError.message)
    } finally {
      setAiLoading(false)
    }
  }

  const generateRoadmap = () => {
    runBrainDump('Launch LifeOS v1 by March 28. Need to invite beta users, finish onboarding, review analytics, and freeze the launch checklist before release.')
  }

  const findConflicts = async () => {
    setAiLoading(true)
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.type === 'deadline'
          ? { ...node, data: { ...node.data, meta: `${node.data.meta} - conflict risk` } }
          : node,
      ),
    )
    try {
      await ensurePlannerWeek(buildPlannerDays())
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setAiLoading(false)
    }
  }

  const scoreReadiness = async () => {
    if (!activeBrainDumpId) {
      setBrainDumpOpen(true)
      return
    }

    pushHistory()
    setAiLoading(true)
    const id = 'resource-readiness'
    try {
      const analytics = await ensureAnalytics()
      setNodes((currentNodes) => {
        if (currentNodes.some((node) => node.id === id)) {
          return currentNodes.map((node) => (
            node.id === id
              ? { ...node, data: { ...node.data, label: `Readiness score: ${analytics.readinessScore}/100` } }
              : node
          ))
        }
        return [
          ...currentNodes,
          { id, type: 'resource', position: { x: 860, y: 270 }, data: { label: `Readiness score: ${analytics.readinessScore}/100`, meta: 'Based on current tasks and goals' } },
        ]
      })
      setEdges((currentEdges) => {
        const firstGoal = nodes.find((node) => node.type === 'goal')
        if (!firstGoal || currentEdges.some((edge) => edge.id === 'e-readiness')) return currentEdges
        return [...currentEdges, { id: 'e-readiness', source: firstGoal.id, target: id, animated: true, style: { stroke: 'var(--node-resource)' } }]
      })
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setAiLoading(false)
    }
  }

  const toggleNodeCompleted = useCallback((_, node) => {
    if (!actionableNodeTypes.has(node.type)) return

    pushHistory()
    setSelectedNodeId(node.id)
    setNodes((currentNodes) => currentNodes.map((currentNode) => {
      if (currentNode.id !== node.id) return currentNode
      const completed = !currentNode.data?.completed
      return {
        ...currentNode,
        data: {
          ...currentNode.data,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        },
      }
    }))
  }, [pushHistory, setNodes])

  const saveCanvasNow = async () => {
    if (!activeBrainDumpId) {
      setBrainDumpOpen(true)
      return
    }

    setSaveStatus('Saving...')
    setError('')
    try {
      await saveCachedCanvas(activeBrainDumpId, nodes, edges)
      setSaveStatus('Saved')
    } catch (currentError) {
      setSaveStatus('Save failed')
      setError(currentError.message)
    }
  }

  const editSelectedNode = () => {
    const selected = nodes.find((node) => node.id === selectedNodeId)
    if (!selected) {
      setError('Select a node to edit.')
      return
    }

    const label = window.prompt('Node title', selected.data?.label || '')
    if (label === null) return
    pushHistory()
    setNodes((currentNodes) => currentNodes.map((node) => (
      node.id === selectedNodeId ? { ...node, data: { ...node.data, label } } : node
    )))
  }

  const deleteSelectedNode = () => {
    if (!selectedNodeId) {
      setError('Select a node to delete.')
      return
    }

    pushHistory()
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNodeId))
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId))
    setSelectedNodeId(null)
  }

  const renameBrainDump = async (item) => {
    const title = window.prompt('Brain Dump name', item.title)
    if (!title?.trim()) return
    try {
      await renameCachedBrainDump(item._id, title.trim())
    } catch (currentError) {
      setError(currentError.message)
    }
  }

  const deleteBrainDump = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    try {
      const nextId = activeBrainDumpId === item._id
        ? brainDumps.find((brainDump) => brainDump._id !== item._id)?._id || ''
        : activeBrainDumpId
      await deleteCachedBrainDump(item._id)
      await loadCanvas(nextId)
    } catch (currentError) {
      setError(currentError.message)
    }
  }

  const duplicateBrainDump = async (item) => {
    try {
      const result = await duplicateCachedBrainDump(item._id)
      await loadCanvas(result.brainDump._id)
    } catch (currentError) {
      setError(currentError.message)
    }
  }

  const restoreBrainDump = async () => {
    if (!activeBrainDumpId) return
    try {
      const canvas = await restoreCachedBrainDump(activeBrainDumpId)
      skipNextSave.current = true
      setNodes(canvas.nodes || [])
      setEdges(canvas.edges || [])
      setSaveStatus('Restored')
    } catch (currentError) {
      setError(currentError.message)
    }
  }

  const autoLayout = () => {
    if (!nodes.length) return
    pushHistory()
    const grouped = nodes.reduce((acc, node) => {
      const key = node.type || 'resource'
      acc[key] = [...(acc[key] || []), node]
      return acc
    }, {})
    const order = ['goal', 'resource', 'task', 'deadline']
    setNodes(order.flatMap((type, column) => (grouped[type] || []).map((node, row) => ({
      ...node,
      position: { x: 120 + column * 340, y: 120 + row * 150 },
    }))))
  }

  const autoConnect = () => {
    if (nodes.length < 2) return
    pushHistory()
    const goals = nodes.filter((node) => node.type === 'goal')
    const source = goals[0] || nodes[0]
    const generated = nodes
      .filter((node) => node.id !== source.id)
      .map((node, index) => ({
        id: `auto-${source.id}-${node.id}-${index}`,
        source: source.id,
        target: node.id,
        label: node.type === 'deadline' ? 'deadline' : node.type === 'task' ? 'next action' : 'relates',
        animated: true,
        style: { stroke: 'var(--accent-signal)' },
      }))
    setEdges((currentEdges) => {
      const existing = new Set(currentEdges.map((edge) => `${edge.source}:${edge.target}`))
      return [...currentEdges, ...generated.filter((edge) => !existing.has(`${edge.source}:${edge.target}`))]
    })
  }

  const exportCanvas = () => {
    const payload = {
      brainDump: activeBrainDump,
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeBrainDump?.title || 'lifeos-canvas'}.json`.replace(/[^\w.-]+/g, '-')
    link.click()
    URL.revokeObjectURL(url)
  }

  const undo = () => {
    const previous = history.current.pop()
    if (!previous) return
    future.current.push(snapshot())
    setNodes(previous.nodes)
    setEdges(previous.edges)
  }

  const redo = () => {
    const next = future.current.pop()
    if (!next) return
    history.current.push(snapshot())
    setNodes(next.nodes)
    setEdges(next.edges)
  }

  return (
    <div className={`relative h-[calc(100vh-4rem)] overflow-hidden bg-bg-base lg:grid ${sidebarCollapsed ? 'lg:grid-cols-[72px_1fr]' : 'lg:grid-cols-[280px_1fr]'}`}>
      <aside className={`absolute left-4 top-4 z-30 max-h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface/95 shadow-2xl shadow-black/20 backdrop-blur-xl transition-all lg:static lg:z-auto lg:h-full lg:max-h-none lg:rounded-none lg:border-y-0 lg:border-l-0 ${sidebarCollapsed ? 'w-16 lg:w-auto' : 'w-[min(18rem,calc(100%-2rem))] lg:w-auto'}`}>
        <div className="border-b border-border-subtle p-4">
          <div className="flex items-center gap-2">
            {!sidebarCollapsed && <Button className="min-w-0 flex-1" onClick={openBrainDump} disabled={!hasBrainDumpAccess}><Brain size={17} /> Brain Dump</Button>}
            <button
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="rounded-full border border-border-subtle bg-bg-base p-2 text-text-secondary hover:bg-bg-surface-hi hover:text-text-primary"
              aria-label={sidebarCollapsed ? 'Expand Brain Dump sidebar' : 'Collapse Brain Dump sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          {!sidebarCollapsed && (
            <>
              <p className="mt-3 text-xs text-text-muted">Credits: {user?.brainDumpCredits ?? 0}</p>
              <label className="mt-3 flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-base px-3 py-2 text-text-secondary">
                <Search size={15} />
                <input
                  value={brainDumpSearch}
                  onChange={(event) => setBrainDumpSearch(event.target.value)}
                  placeholder="Search Brain Dumps"
                  className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
              </label>
              {!hasBrainDumpAccess && <Button className="mt-3 w-full" size="sm" onClick={() => setBillingOpen(true)}>Buy Credits</Button>}
            </>
          )}
        </div>
        {!sidebarCollapsed && <div className="max-h-[calc(100vh-15rem)] space-y-2 overflow-y-auto p-3 lg:max-h-[calc(100vh-10rem)]">
          {filteredBrainDumps.length === 0 && <p className="p-3 text-sm text-text-secondary">No matching Brain Dumps.</p>}
          {filteredBrainDumps.map((item) => (
            <div key={item._id} className={`rounded-xl border p-3 transition ${item._id === activeBrainDumpId ? 'border-accent-signal bg-accent-signal/10' : 'border-border-subtle bg-bg-base hover:bg-bg-surface-hi'}`}>
              <button onClick={() => loadCanvas(item._id)} className="w-full text-left">
                <p className="truncate text-sm font-semibold text-text-primary">{item.title}</p>
                <p className="mt-1 font-mono text-[11px] text-text-muted">{new Date(item.createdAt).toLocaleDateString()}</p>
              </button>
              <div className="mt-3 flex gap-1">
                <button onClick={() => renameBrainDump(item)} className="rounded-full p-2 text-text-muted hover:bg-bg-surface-hi hover:text-text-primary" aria-label="Rename"><Edit3 size={14} /></button>
                <button onClick={() => duplicateBrainDump(item)} className="rounded-full p-2 text-text-muted hover:bg-bg-surface-hi hover:text-text-primary" aria-label="Duplicate"><Copy size={14} /></button>
                <button onClick={() => deleteBrainDump(item)} className="rounded-full p-2 text-text-muted hover:bg-bg-surface-hi hover:text-node-deadline" aria-label="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>}
      </aside>

      <main className="relative h-full min-w-0">
        <div className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap gap-2 rounded-2xl border border-border-subtle bg-bg-surface/90 p-2 backdrop-blur-xl lg:left-5">
          {palette.map(({ type, label, icon: Icon }) => (
            <Button key={type} variant="secondary" size="sm" onClick={() => addNode(type)}>
              <Icon size={16} /> {label}
            </Button>
          ))}
          <Button variant="secondary" size="sm" onClick={saveCanvasNow} disabled={!activeBrainDumpId}><Save size={16} /> Save</Button>
          <Button variant="secondary" size="sm" onClick={editSelectedNode}><Edit3 size={16} /> Edit</Button>
          <Button variant="secondary" size="sm" onClick={deleteSelectedNode}><Trash2 size={16} /> Delete</Button>
          <Button variant="secondary" size="sm" onClick={undo}><Undo2 size={16} /> Undo</Button>
          <Button variant="secondary" size="sm" onClick={redo}><Redo2 size={16} /> Redo</Button>
          <Button variant="secondary" size="sm" onClick={autoLayout} disabled={!activeBrainDumpId}><LayoutGrid size={16} /> Auto Layout</Button>
          <Button variant="secondary" size="sm" onClick={autoConnect} disabled={!activeBrainDumpId}><GitBranch size={16} /> Auto Connect</Button>
          <Button variant="secondary" size="sm" onClick={exportCanvas} disabled={!activeBrainDumpId}><Download size={16} /> Export</Button>
          <Button variant="secondary" size="sm" onClick={restoreBrainDump} disabled={!activeBrainDumpId}><RefreshCcw size={16} /> Restore</Button>
          <span className="px-3 py-2 text-xs font-semibold text-text-muted">{loading ? 'Loading...' : saveStatus}</span>
          <div className="flex min-w-44 items-center gap-2 rounded-full border border-border-subtle bg-bg-base px-3 py-2 text-xs font-semibold text-text-secondary">
            <CheckCircle2 size={15} className={completionPercent === 100 && actionableNodes.length ? 'text-node-resource' : 'text-text-muted'} />
            <span>{completionPercent}% complete</span>
            <span className="text-text-muted">{completedNodes}/{actionableNodes.length}</span>
            <span className="h-1.5 min-w-12 flex-1 overflow-hidden rounded-full bg-bg-surface-hi">
              <span className="block h-full rounded-full bg-node-resource transition-all" style={{ width: `${completionPercent}%` }} />
            </span>
          </div>
          {activeBrainDump && <span className="hidden px-3 py-2 text-xs font-semibold text-text-secondary sm:inline">{activeBrainDump.title}</span>}
        </div>
        {error && <div className="absolute left-4 top-24 z-20 max-w-md rounded-xl border border-node-deadline/30 bg-bg-surface px-4 py-3 text-sm text-node-deadline lg:left-5">{error}</div>}

        {!assistantOpen && (
          <button
            className="absolute bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-signal text-text-primary shadow-2xl shadow-black/25 transition hover:scale-105 hover:bg-accent-signal-hi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-signal"
            onClick={() => setAssistantOpen(true)}
            aria-label="Open assistant"
            title="Open assistant"
          >
            <img src={logoImage} alt="" className="h-11 w-11 rounded-2xl object-cover" />
          </button>
        )}

        {assistantOpen && (
          <AssistantPanel
            onClose={() => setAssistantOpen(false)}
            error={error}
            input={brainDumpInput}
            loading={aiLoading}
            onBrainDump={openBrainDump}
            onGenerate={generateRoadmap}
            onConflicts={findConflicts}
            onInputChange={setBrainDumpInput}
            onScore={scoreReadiness}
          />
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onNodeDoubleClick={toggleNodeCompleted}
          onPaneClick={() => setSelectedNodeId(null)}
          onNodeDragStart={pushHistory}
          fitView
          className="bg-bg-base"
        >
          <Background color="var(--border-subtle)" gap={26} />
          <Controls className="!border !border-border-subtle !bg-bg-surface !shadow-2xl" />
          <MiniMap
            className="!rounded-2xl !border !border-border-subtle !bg-bg-surface"
            nodeColor={(node) => {
              if (node.type === 'goal') return 'var(--node-goal)'
              if (node.type === 'task') return 'var(--node-task)'
              if (node.type === 'deadline') return 'var(--node-deadline)'
              return 'var(--node-resource)'
            }}
          />
        </ReactFlow>
      </main>

      {brainDumpOpen && (
        <Modal title="What's on your mind?" onClose={() => setBrainDumpOpen(false)}>
          <textarea
            value={brainDumpInput}
            onChange={(event) => setBrainDumpInput(event.target.value)}
            placeholder="Write anything: assignments, exams, React interviews, DSA revision, habits, people, deadlines, projects..."
            className="mt-5 w-full rounded-xl border border-border-subtle bg-bg-base px-4 py-3 text-sm text-text-primary outline-none focus:border-accent-signal focus:ring-2 focus:ring-accent-signal/20"
            rows={8}
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setBrainDumpOpen(false)}>Cancel</Button>
            <Button onClick={() => runBrainDump()} disabled={aiLoading || !hasBrainDumpAccess}>{aiLoading ? 'Building...' : 'Build my second brain'}</Button>
          </div>
        </Modal>
      )}

      {billingOpen && (
        <Modal title="Buy Brain Dump Credits" onClose={() => setBillingOpen(false)}>
          <BillingPanel bare compact onPurchased={() => setBillingOpen(false)} />
        </Modal>
      )}

      <button className="sr-only" aria-label="Close assistant" onClick={() => setAssistantOpen(false)}>
        <X size={16} />
      </button>
    </div>
  )
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <Card className="w-full max-w-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-text-muted hover:bg-bg-surface-hi hover:text-text-primary" aria-label="Close">×</button>
        </div>
        {children}
      </Card>
    </div>
  )
}
