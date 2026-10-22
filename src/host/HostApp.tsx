import { useState } from 'react'
import { Clapperboard, LogOut, MonitorPlay, Trophy } from 'lucide-react'
import { SiteHeader } from '../components/SiteHeader'
import { Notice } from '../components/Notice'
import { EVENT_CONFIG } from '../config/event-config'
import { buildJoinUrl } from '../config/join-url'
import { useHostSession } from '../hooks/use-host-session'
import { AudienceScreen } from './AudienceScreen'
import { FinaleScreen } from './FinaleScreen'
import { HostScreen } from './HostScreen'
import { HostSignIn } from './HostSignIn'
import { OpeningScreen } from './OpeningScreen'

type HostScreenName = 'home' | 'host' | 'audience' | 'finale'

export function HostApp() {
  const session = useHostSession()
  const [screen, setScreen] = useState<HostScreenName>('home')
  const joinUrl = buildJoinUrl(window.location)
  const year = session.view?.summary.eventYear || EVENT_CONFIG.year
  const status = session.reconnecting ? 'RECONNECTING' : session.signedIn ? 'HOST' : 'FINANCE TEAM'

  const nav =
    session.signedIn && screen !== 'home' ? (
      <nav className="mode-nav" aria-label="Host views">
        {(
          [
            ['host', 'Host', Clapperboard],
            ['audience', 'Big screen', MonitorPlay],
            ['finale', 'Finale', Trophy],
          ] as const
        ).map(([name, label, Icon]) => (
          <button
            className={screen === name ? 'mode-nav__item is-active' : 'mode-nav__item'}
            type="button"
            aria-pressed={screen === name}
            key={name}
            onClick={() => setScreen(name)}
          >
            <Icon aria-hidden="true" size={17} /> {label}
          </button>
        ))}
        <button className="mode-nav__item" type="button" onClick={() => void session.signOut()}>
          <LogOut aria-hidden="true" size={17} /> Sign out
        </button>
      </nav>
    ) : null

  let content
  if (!session.configured) {
    content = (
      <Notice kicker="SETUP" title="The quiz server is not configured.">
        <p className="stage-subtitle">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.</p>
      </Notice>
    )
  } else if (screen === 'home') {
    content = <OpeningScreen year={year} joinUrl={joinUrl} onHost={() => setScreen('host')} />
  } else if (session.checking) {
    content = <Notice kicker="HOST" title="Checking sign-in…" />
  } else if (!session.signedIn) {
    content = <HostSignIn busy={session.busy} error={session.error} onSignIn={session.signIn} />
  } else if (!session.view) {
    content = <Notice kicker="HOST" title={session.reconnecting ? 'Reconnecting…' : 'Loading the game…'} />
  } else if (screen === 'audience') {
    content = <AudienceScreen view={session.view} joinUrl={joinUrl} onBack={() => setScreen('host')} />
  } else if (screen === 'finale') {
    content = <FinaleScreen view={session.view} onBack={() => setScreen('host')} />
  } else {
    content = (
      <HostScreen
        view={session.view}
        joinUrl={joinUrl}
        busy={session.busy}
        error={session.error}
        onAct={session.act}
        onAudience={() => setScreen('audience')}
        onFinale={() => setScreen('finale')}
      />
    )
  }

  return (
    <div className={`app-frame app-frame--${screen}`}>
      <SiteHeader
        year={year}
        status={status}
        nav={nav}
        minimal={screen === 'audience'}
        onHome={() => setScreen('home')}
      />
      {content}
    </div>
  )
}
