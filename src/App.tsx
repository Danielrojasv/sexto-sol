import { useGameStore } from './store/gameStore'
import { CardCatalog } from './ui/CardCatalog'
import { HomeView } from './ui/HomeView'
import { PlayView } from './ui/PlayView'

export function App() {
  const view = useGameStore((s) => s.view)
  const setView = useGameStore((s) => s.setView)

  if (view === 'cards') {
    return (
      <div>
        <button
          onClick={() => setView('home')}
          className="fixed top-4 right-4 z-10 px-3 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          ← Home
        </button>
        <CardCatalog />
      </div>
    )
  }

  if (view === 'play') return <PlayView />

  // 'home' or 'gameover' (gameover handled in PR-H3)
  return <HomeView />
}
