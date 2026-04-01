export default function Splash() {
  return (
    <div className="lp-splash">
      <div className="lp-splash-orbs" aria-hidden="true">
        <span className="lp-splash-orb lp-splash-orb--one" />
        <span className="lp-splash-orb lp-splash-orb--two" />
        <span className="lp-splash-orb lp-splash-orb--three" />
      </div>
      <div className="lp-splash-card">
        <div className="lp-splash-logo-wrap">
          <img src="/localping.jpeg" alt="Local Ping" className="lp-splash-logo" />
          <span className="lp-splash-ring" aria-hidden="true" />
        </div>
        <div className="lp-splash-title">Local Ping</div>
        <p className="lp-splash-copy">Hyperlocal updates, tuned to your street.</p>
        <div className="lp-splash-loader" role="status" aria-live="polite">
          <div className="lp-splash-loader-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="lp-splash-loader-text">Warming up the newsroom...</span>
        </div>
      </div>
    </div>
  )
}
