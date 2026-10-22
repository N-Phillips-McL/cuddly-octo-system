import { SiteHeader } from '../components/SiteHeader'
import { Notice } from '../components/Notice'
import { EVENT_CONFIG } from '../config/event-config'
import { SUPABASE_CONFIG } from '../config/supabase-config'
import { usePlayerSession } from '../hooks/use-player-session'
import { JoinScreen } from './JoinScreen'
import { PlayerScreen } from './PlayerScreen'

export function PlayerApp() {
  const session = usePlayerSession()
  const status = session.reconnecting ? 'RECONNECTING' : session.view ? 'CONNECTED' : 'PLAYER'

  let content
  if (!SUPABASE_CONFIG) {
    content = <Notice kicker="SETUP" title="The quiz server is not configured." />
  } else if (!session.hasToken) {
    content = <JoinScreen busy={session.busy} error={session.error} onJoin={session.join} />
  } else if (!session.view) {
    content = <Notice kicker="PLAYER" title={session.reconnecting ? 'Reconnecting…' : 'Connecting…'} />
  } else {
    content = (
      <PlayerScreen view={session.view} busy={session.busy} error={session.error}
        reconnecting={session.reconnecting} onAnswer={session.answer} onLeave={session.leave} />
    )
  }

  return (
    <div className="app-frame app-frame--player">
      <SiteHeader year={EVENT_CONFIG.year} status={status} />
      {content}
    </div>
  )
}
