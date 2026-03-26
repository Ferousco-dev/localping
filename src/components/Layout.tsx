import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'

const authPaths = ['/login', '/signup']

export default function Layout() {
  const location = useLocation()
  const isAuthPage = authPaths.includes(location.pathname)

  return (
    <div className="lp-app">
      <Header />
      <main className="lp-main">
        <Outlet />
      </main>
      {!isAuthPage && <BottomNav />}
    </div>
  )
}
