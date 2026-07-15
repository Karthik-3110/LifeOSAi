import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import Badge from '../ui/Badge.jsx'

function ResourceNode({ data, selected }) {
  return (
    <div className={`min-w-52 rounded-2xl border bg-bg-surface p-4 shadow-xl ${selected ? 'border-node-resource' : 'border-node-resource/40'}`}>
      <Handle type="target" position={Position.Top} className="!bg-node-resource" />
      <Badge color="resource">Resource</Badge>
      <p className="mt-3 font-display text-base font-semibold text-text-primary">{data.label}</p>
      <p className="mt-2 text-xs text-text-secondary">{data.meta}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-node-resource" />
    </div>
  )
}

export default memo(ResourceNode)
