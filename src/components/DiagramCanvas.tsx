import { useState, useRef } from 'react'

interface Shape {
  id: string
  type: 'rect' | 'sticky'
  x: number
  y: number
  width: number
  height: number
  color: string
  text: string
}

interface Line {
  id: string
  from: string
  to: string
  style: 'solid' | 'dashed'
}

export default function DiagramCanvas() {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [canvasMenu, setCanvasMenu] = useState<{x:number, y:number}|null>(null)
  const [shapeMenu, setShapeMenu] = useState<{x:number, y:number, id:string}|null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [connectFrom, setConnectFrom] = useState<{id:string, style:'solid'|'dashed'}|null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const addShape = (type:'rect'|'sticky', x:number, y:number) => {
    const id = crypto.randomUUID()
    const newShape: Shape = {
      id,
      type,
      x,
      y,
      width: 120,
      height: 60,
      color: type === 'sticky' ? '#fff475' : '#ffffff',
      text: ''
    }
    setShapes(s => [...s, newShape])
  }

  const updateShape = (id:string, update:Partial<Shape>) => {
    setShapes(s => s.map(sh => sh.id===id ? {...sh, ...update} : sh))
  }

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShapeMenu(null)
    setCanvasMenu({x: e.clientX, y: e.clientY})
  }

  const handleShapeContextMenu = (e: React.MouseEvent, id:string) => {
    e.preventDefault()
    setCanvasMenu(null)
    setShapeMenu({x: e.clientX, y: e.clientY, id})
  }

  const startConnect = (id:string, style:'solid'|'dashed') => {
    setConnectFrom({id, style})
    setShapeMenu(null)
  }

  const finishConnect = (toId:string) => {
    if (connectFrom && connectFrom.id !== toId) {
      const id = crypto.randomUUID()
      setLines(l => [...l, {id, from: connectFrom.id, to: toId, style: connectFrom.style}])
    }
    setConnectFrom(null)
  }

  const handleCanvasClick = () => {
    setCanvasMenu(null)
    setShapeMenu(null)
  }

  return (
    <div
      ref={containerRef}
      onContextMenu={handleCanvasContextMenu}
      onClick={handleCanvasClick}
      className="relative w-full h-screen bg-neutral-100 select-none"
    >
      <svg className="absolute inset-0 pointer-events-none">
        {lines.map(line => {
          const from = shapes.find(s => s.id===line.from)
          const to = shapes.find(s => s.id===line.to)
          if (!from || !to) return null
          const x1 = from.x + from.width/2
          const y1 = from.y + from.height/2
          const x2 = to.x + to.width/2
          const y2 = to.y + to.height/2
          return (
            <line
              key={line.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="black"
              strokeWidth={2}
              strokeDasharray={line.style==='dashed' ? '4 2' : undefined}
            />
          )
        })}
      </svg>
      {shapes.map(shape => (
        <div
          key={shape.id}
          onContextMenu={e => handleShapeContextMenu(e, shape.id)}
          onDoubleClick={() => setEditingId(shape.id)}
          onClick={() => connectFrom && finishConnect(shape.id)}
          style={{
            position: 'absolute',
            left: shape.x,
            top: shape.y,
            width: shape.width,
            height: shape.height,
            background: shape.color,
            border: '1px solid #000',
            padding: 4,
            boxSizing: 'border-box',
            overflow: 'hidden',
            cursor: 'default'
          }}
        >
          <div
            contentEditable={editingId === shape.id}
            suppressContentEditableWarning
            onBlur={e => { updateShape(shape.id, {text: e.currentTarget.textContent || ''}); setEditingId(null) }}
            className="w-full h-full outline-none"
          >
            {shape.text}
          </div>
        </div>
      ))}

      {canvasMenu && (
        <div
          className="absolute bg-white border shadow z-10"
          style={{left: canvasMenu.x, top: canvasMenu.y}}
        >
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { addShape('rect', canvasMenu.x, canvasMenu.y); setCanvasMenu(null) }}>Add Rectangle</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { addShape('sticky', canvasMenu.x, canvasMenu.y); setCanvasMenu(null) }}>Add Sticky</div>
        </div>
      )}

      {shapeMenu && (
        <div
          className="absolute bg-white border shadow z-10"
          style={{left: shapeMenu.x, top: shapeMenu.y}}
        >
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { updateShape(shapeMenu.id, {width: shapes.find(s=>s.id===shapeMenu.id)?.width! * 1.2, height: shapes.find(s=>s.id===shapeMenu.id)?.height! * 1.2}); setShapeMenu(null) }}>Increase Size</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { updateShape(shapeMenu.id, {width: shapes.find(s=>s.id===shapeMenu.id)?.width! * 0.8, height: shapes.find(s=>s.id===shapeMenu.id)?.height! * 0.8}); setShapeMenu(null) }}>Decrease Size</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { updateShape(shapeMenu.id, {color: '#f87171'}); setShapeMenu(null) }}>Red</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { updateShape(shapeMenu.id, {color: '#60a5fa'}); setShapeMenu(null) }}>Blue</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { updateShape(shapeMenu.id, {color: '#4ade80'}); setShapeMenu(null) }}>Green</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => startConnect(shapeMenu.id, 'solid')}>Connect Solid</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => startConnect(shapeMenu.id, 'dashed')}>Connect Dashed</div>
        </div>
      )}
    </div>
  )
}

