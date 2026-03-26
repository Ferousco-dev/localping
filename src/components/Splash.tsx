export default function Splash() {
  return (
    <div className="lp-splash">
      <div className="lp-splash-card">
        <img src="/localping.jpeg" alt="Local Ping" className="lp-splash-logo" />
        <div className="lp-splash-dots" aria-label="Loading">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  )
}
