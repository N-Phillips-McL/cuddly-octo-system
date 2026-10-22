import { HostApp } from './host/HostApp'
import { PlayerApp } from './player/PlayerApp'

function App() {
  const isPlayer = new URLSearchParams(window.location.search).get('mode') === 'player'
  return isPlayer ? <PlayerApp /> : <HostApp />
}

export default App
