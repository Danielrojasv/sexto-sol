import { useGameStore } from '@/store/gameStore'
import { HomeView } from '@/ui/HomeView'
import { PlayView } from '@/ui/PlayView'

export default function App() {
  const inHome = useGameStore((s) => s.inHome)
  return inHome ? <HomeView /> : <PlayView />
}
