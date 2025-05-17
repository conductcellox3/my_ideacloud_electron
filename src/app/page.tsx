import dynamic from 'next/dynamic'

const DiagramCanvas = dynamic(() => import('../components/DiagramCanvas'), { ssr: false })

export default function Home() {
  return (
    <DiagramCanvas />
  )
}
