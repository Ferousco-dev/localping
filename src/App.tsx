import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Splash from './components/Splash'
import { AuthProvider } from './context/AuthContext'
import Admin from './pages/Admin'
import Bookmarks from './pages/Bookmarks'
import Following from './pages/Following'
import Home from './pages/Home'
import Likes from './pages/Likes'
import Login from './pages/Login'
import NewsDetail from './pages/NewsDetail'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Signup from './pages/Signup'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const hasSeen = window.sessionStorage.getItem('localping_splash_seen')
    if (hasSeen) {
      setShowSplash(false)
      return
    }
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem('localping_splash_seen', 'true')
      setShowSplash(false)
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <AuthProvider>
      {showSplash ? (
        <Splash />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="news/:id" element={<NewsDetail />} />
              <Route path="following" element={<Following />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="likes" element={<Likes />} />
              <Route path="bookmarks" element={<Bookmarks />} />
              <Route path="admin">
                <Route index element={<Admin />} />
                <Route path=":tab" element={<Admin />} />
              </Route>
              <Route path="search" element={<Search />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </AuthProvider>
  )
}

export default App
