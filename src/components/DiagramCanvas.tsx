import React, { useState, useRef } from 'react'

interface Shape {
  id: string
  type: 'rect' | 'sticky' | 'ellipse' | 'diamond' | 'parallelogram'
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
  const [dragging, setDragging] = useState<{id:string, offsetX:number, offsetY:number}|null>(null)
  const [resizing, setResizing] = useState<{id:string, startX:number, startY:number, startW:number, startH:number}|null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [gridSize, setGridSize] = useState(50)
  const [scale, setScale] = useState(1)
  const [background, setBackground] = useState<'grid' | 'calendar' | 'swot'>('grid')
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1)
  const [calendarSpan, setCalendarSpan] = useState(1)
  const [daySpacing, setDaySpacing] = useState(100)
  const [weekSpacing, setWeekSpacing] = useState(80)

  const escapeXml = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const buildXml = () => {
    const shapeXml = shapes.map(s =>
      `<shape id="${s.id}" type="${s.type}" x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" color="${s.color}"><text>${escapeXml(s.text)}</text></shape>`
    ).join('');
    const lineXml = lines.map(l =>
      `<line id="${l.id}" from="${l.from}" to="${l.to}" style="${l.style}" />`
    ).join('');
    return `<diagram><shapes>${shapeXml}</shapes><lines>${lineXml}</lines></diagram>`;
  };

  const parseXml = (xml: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const shapeNodes = Array.from(doc.getElementsByTagName('shape'));
    const lineNodes = Array.from(doc.getElementsByTagName('line'));
    const newShapes: Shape[] = shapeNodes.map(n => ({
      id: n.getAttribute('id') || crypto.randomUUID(),
      type: n.getAttribute('type') as Shape['type'],
      x: parseFloat(n.getAttribute('x') || '0'),
      y: parseFloat(n.getAttribute('y') || '0'),
      width: parseFloat(n.getAttribute('width') || '0'),
      height: parseFloat(n.getAttribute('height') || '0'),
      color: n.getAttribute('color') || '#ffffff',
      text: n.getElementsByTagName('text')[0]?.textContent || ''
    }));
    const newLines: Line[] = lineNodes.map(n => ({
      id: n.getAttribute('id') || crypto.randomUUID(),
      from: n.getAttribute('from') || '',
      to: n.getAttribute('to') || '',
      style: (n.getAttribute('style') as Line['style']) || 'solid'
    }));
    setShapes(newShapes);
    setLines(newLines);
  };

  const saveDiagram = async () => {
    const xml = buildXml();
    await window.api.saveXML(xml);
  };

  const openDiagram = async () => {
    const result = await window.api.openXML();
    if (!result.canceled && result.data) parseXml(result.data);
  };

  const getPoint = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    }
  }

  const backgroundElements = () => {
    if (background === 'calendar') {
      const items: JSX.Element[] = []
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      let y = calendarYear
      let m = calendarMonth
      let top = 0
      for (let i = 0; i < calendarSpan; i++) {
        const firstDay = new Date(y, m - 1, 1).getDay()
        const days = new Date(y, m, 0).getDate()
        const weeks = Math.ceil((days + firstDay) / 7)
        const monthKey = `${y}-${m}`
        items.push(
          <div key={`label-${monthKey}`} style={{position:'absolute', left:0, top:top, fontSize:12, color:'#555'}}>{`${y}/${m}`}</div>
        )
        dayNames.forEach((name, idx) => {
          items.push(
            <div
              key={`h-${monthKey}-${idx}`}
              style={{position:'absolute', left:idx * daySpacing + 4, top:top + 16, fontSize:12, color:'#555'}}
            >
              {name}
            </div>
          )
        })
        for (let d = 1; d <= days; d++) {
          const dow = new Date(y, m - 1, d).getDay()
          const week = Math.floor((d + firstDay - 1) / 7)
          const left = dow * daySpacing
          const cellTop = top + 32 + week * weekSpacing
          items.push(
            <div
              key={`c-${monthKey}-${d}`}
              style={{
                position: 'absolute',
                left,
                top: cellTop,
                width: daySpacing,
                height: weekSpacing,
                border: '1px solid #ccc',
                boxSizing: 'border-box',
                fontSize: 12,
                padding: 2,
              }}
            >
              {d}
            </div>
          )
        }
        top += 32 + weeks * weekSpacing + weekSpacing
        m++
        if (m > 12) { m = 1; y++ }
      }
      return items
    }
    if (background === 'swot') {
      return [
        <div key="v" style={{position:'absolute', left:'50%', top:0, bottom:0, width:1, background:'#ccc'}} />,
        <div key="h" style={{position:'absolute', top:'50%', left:0, right:0, height:1, background:'#ccc'}} />,
        <div key="s" style={{position:'absolute', left:'25%', top:'25%', transform:'translate(-50%,-50%)', fontSize:16, fontWeight:'bold', color:'#555'}}>Strengths</div>,
        <div key="w" style={{position:'absolute', left:'75%', top:'25%', transform:'translate(-50%,-50%)', fontSize:16, fontWeight:'bold', color:'#555'}}>Weaknesses</div>,
        <div key="o" style={{position:'absolute', left:'25%', top:'75%', transform:'translate(-50%,-50%)', fontSize:16, fontWeight:'bold', color:'#555'}}>Opportunities</div>,
        <div key="t" style={{position:'absolute', left:'75%', top:'75%', transform:'translate(-50%,-50%)', fontSize:16, fontWeight:'bold', color:'#555'}}>Threats</div>,
      ]
    }
    return null
  }

  const addShape = (
    type: 'rect' | 'sticky' | 'ellipse' | 'diamond' | 'parallelogram',
    x: number,
    y: number
  ) => {
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
    const p = getPoint(e)
    setCanvasMenu({x: p.x, y: p.y})
  }

  const handleShapeContextMenu = (e: React.MouseEvent, id:string) => {
    e.preventDefault()
    e.stopPropagation()
    setCanvasMenu(null)
    const p = getPoint(e)
    setShapeMenu({x: p.x, y: p.y, id})
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

  const handleShapeMouseDown = (e: React.MouseEvent, shape: Shape) => {
    if (e.button !== 0) return
    if (editingId === shape.id || connectFrom) return
    e.preventDefault()
    const p = getPoint(e)
    setSelectedId(shape.id)
    setDragging({ id: shape.id, offsetX: p.x - shape.x, offsetY: p.y - shape.y })
  }

  const handleResizeMouseDown = (e: React.MouseEvent, shape: Shape) => {
    e.stopPropagation()
    e.preventDefault()
    const p = getPoint(e)
    setSelectedId(shape.id)
    setResizing({
      id: shape.id,
      startX: p.x,
      startY: p.y,
      startW: shape.width,
      startH: shape.height
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (resizing) {
      e.preventDefault()
      const p = getPoint(e)
      const dx = p.x - resizing.startX
      const dy = p.y - resizing.startY
      updateShape(resizing.id, {
        width: Math.max(20, resizing.startW + dx),
        height: Math.max(20, resizing.startH + dy)
      })
    } else if (dragging) {
      e.preventDefault()
      const p = getPoint(e)
      updateShape(dragging.id, { x: p.x - dragging.offsetX, y: p.y - dragging.offsetY })
    }
  }

  const handleMouseUp = () => {
    if (dragging) setDragging(null)
    if (resizing) setResizing(null)
  }

  const handleCanvasClick = () => {
    setCanvasMenu(null)
    setShapeMenu(null)
    setConnectFrom(null)
    setSelectedId(null)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = -e.deltaY * 0.001
      setScale(s => Math.min(4, Math.max(0.2, s + delta)))
    }
  }

  return (
    <div>
      <div className="p-2 flex gap-2 text-sm">
        <label>Background
          <select className="border p-1" value={background} onChange={e => setBackground(e.target.value as 'grid'|'calendar'|'swot')}>
            <option value="grid">Grid</option>
            <option value="calendar">Calendar</option>
            <option value="swot">SWOT</option>
          </select>
        </label>
        {background === 'grid' && (
          <label>Grid <input className="border p-1 w-16" type="number" value={gridSize} onChange={e => setGridSize(parseInt(e.target.value) || 1)} /></label>
        )}
        {background === 'calendar' && (
          <>
            <label>Year <input className="border p-1 w-20" type="number" value={calendarYear} onChange={e => setCalendarYear(parseInt(e.target.value) || calendarYear)} /></label>
            <label>Month <input className="border p-1 w-14" type="number" value={calendarMonth} onChange={e => setCalendarMonth(parseInt(e.target.value) || calendarMonth)} /></label>
            <label>Months <input className="border p-1 w-14" type="number" min={1} max={3} value={calendarSpan} onChange={e => setCalendarSpan(Math.min(3, Math.max(1, parseInt(e.target.value) || 1)))} /></label>
            <label>Day Spacing <input className="border p-1 w-14" type="number" value={daySpacing} onChange={e => setDaySpacing(parseInt(e.target.value) || 1)} /></label>
            <label>Week Spacing <input className="border p-1 w-14" type="number" value={weekSpacing} onChange={e => setWeekSpacing(parseInt(e.target.value) || 1)} /></label>
          </>
        )}
        <button className="border px-2" onClick={openDiagram}>Open</button>
        <button className="border px-2" onClick={saveDiagram}>Save</button>
      </div>
      <div
        ref={containerRef}
        onContextMenu={handleCanvasContextMenu}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="relative w-full h-screen overflow-auto select-none bg-neutral-100"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
          backgroundImage: background === 'grid'
            ? `linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)`
            : undefined,
          backgroundSize: `${gridSize}px ${gridSize}px`
        }}
      >
        {backgroundElements()}
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
      {shapes.map(shape => {
        const baseStyle: React.CSSProperties = {
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
          cursor: 'move',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }

        if (shape.type === 'ellipse') baseStyle.borderRadius = '50%'
        if (shape.type === 'diamond')
          baseStyle.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
        if (shape.type === 'parallelogram')
          baseStyle.clipPath = 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)'

        if (selectedId === shape.id) {
          baseStyle.boxShadow = '0 0 0 2px #3b82f6'
        }

        return (
          <div
            key={shape.id}
            onContextMenu={e => handleShapeContextMenu(e, shape.id)}
            onDoubleClick={() => setEditingId(shape.id)}
            onClick={() => { if (connectFrom) finishConnect(shape.id); setSelectedId(shape.id) }}
            onMouseDown={e => handleShapeMouseDown(e, shape)}
            style={baseStyle}
          >
          <div
            contentEditable={editingId === shape.id}
            suppressContentEditableWarning
            onBlur={e => { updateShape(shape.id, {text: e.currentTarget.textContent || ''}); setEditingId(null) }}
            className="w-full h-full outline-none"
          >
            {shape.text}
          </div>
          {selectedId === shape.id && (
            <div
              onMouseDown={e => handleResizeMouseDown(e, shape)}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                right: -4,
                bottom: -4,
                background: '#3b82f6',
                cursor: 'nwse-resize'
              }}
            />
          )}
          </div>
        )
      })}

      {canvasMenu && (
        <div
          className="absolute bg-white border shadow z-10"
          style={{left: canvasMenu.x, top: canvasMenu.y}}
        >
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { addShape('rect', canvasMenu.x, canvasMenu.y); setCanvasMenu(null) }}>Add Rectangle</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { addShape('ellipse', canvasMenu.x, canvasMenu.y); setCanvasMenu(null) }}>Add Ellipse</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { addShape('diamond', canvasMenu.x, canvasMenu.y); setCanvasMenu(null) }}>Add Diamond</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { addShape('parallelogram', canvasMenu.x, canvasMenu.y); setCanvasMenu(null) }}>Add Parallelogram</div>
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
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { updateShape(shapeMenu.id, {color: '#ffffff'}); setShapeMenu(null) }}>White</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { updateShape(shapeMenu.id, {color: '#fef9c3'}); setShapeMenu(null) }}>Yellow</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { updateShape(shapeMenu.id, {color: '#dbeafe'}); setShapeMenu(null) }}>Blue</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { updateShape(shapeMenu.id, {color: '#dcfce7'}); setShapeMenu(null) }}>Green</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { updateShape(shapeMenu.id, {color: '#fee2e2'}); setShapeMenu(null) }}>Red</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => { updateShape(shapeMenu.id, {color: '#f3e8ff'}); setShapeMenu(null) }}>Purple</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => startConnect(shapeMenu.id, 'solid')}>Connect Solid</div>
          <div className="p-1 hover:bg-neutral-200 cursor-pointer" onClick={() => startConnect(shapeMenu.id, 'dashed')}>Connect Dashed</div>
        </div>
      )}
      </div>
    </div>
  )
}

