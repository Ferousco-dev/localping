import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addNews, addSource, broadcast, deleteNews, deleteSource, getUserCount } from '../lib/admin'
import { getNewsByLocation } from '../lib/news'
import { getSources } from '../lib/sources'
import type { NewsItem, Source } from '../lib/types'

export default function Admin() {
  const { isAdmin } = useAuth()
  const [userCount, setUserCount] = useState(0)
  const [sources, setSources] = useState<Source[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [sourceForm, setSourceForm] = useState({ name: '', description: '', url: '' })
  const [newsForm, setNewsForm] = useState({
    title: '',
    description: '',
    content: '',
    image: '',
    source: '',
    location: 'All',
  })
  const [broadcastText, setBroadcastText] = useState('')
  const navigate = useNavigate()
  const params = useParams()
  const activeTab = useMemo<'sources' | 'news' | 'broadcasts'>(() => {
    const tab = params.tab
    if (tab === 'news' || tab === 'broadcasts' || tab === 'sources') return tab
    return 'sources'
  }, [params.tab])

  useEffect(() => {
    if (!params.tab) navigate('/admin/sources', { replace: true })
  }, [params.tab, navigate])

  useEffect(() => {
    if (!isAdmin) return
    getUserCount().then((count) => setUserCount(count))
    getSources().then((items) => setSources(items))
    getNewsByLocation('Lagos, Nigeria').then((items) => setNews(items))
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <section className="lp-page">
        <div className="lp-state">Admin access only.</div>
      </section>
    )
  }

  const handleAddSource = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!sourceForm.name || !sourceForm.url) return
    const source = await addSource(sourceForm)
    if (source) setSources([source, ...sources])
    setSourceForm({ name: '', description: '', url: '' })
  }

  const handleDeleteSource = async (id: string) => {
    await deleteSource(id)
    setSources(sources.filter((source) => source.id !== id))
  }

  const handleAddNews = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newsForm.title || !newsForm.content) return
    const item = await addNews({
      title: newsForm.title,
      description: newsForm.description || 'Local update',
      content: newsForm.content,
      image:
        newsForm.image ||
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=640&q=80',
      source: newsForm.source || 'Local Ping Desk',
      location: newsForm.location || 'All',
    })
    if (item) setNews([item, ...news])
    setNewsForm({ title: '', description: '', content: '', image: '', source: '', location: 'All' })
  }

  const handleDeleteNews = async (id: string) => {
    await deleteNews(id)
    setNews(news.filter((item) => item.id !== id))
  }

  const handleBroadcast = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!broadcastText.trim()) return
    await broadcast(broadcastText)
    setBroadcastText('')
  }

  return (
    <section className="lp-page">
      <div className="lp-admin-hero">
        <div>
          <h2>Admin dashboard</h2>
          <p>Manage sources, headlines, and broadcasts.</p>
        </div>
        <div className="lp-admin-stats">
          <span>Total users</span>
          <strong>{userCount}</strong>
        </div>
      </div>

      <div className="lp-admin-tabs">
        <button
          className={activeTab === 'sources' ? 'lp-tab-button active' : 'lp-tab-button'}
          onClick={() => navigate('/admin/sources')}
        >
          Sources
        </button>
        <button
          className={activeTab === 'news' ? 'lp-tab-button active' : 'lp-tab-button'}
          onClick={() => navigate('/admin/news')}
        >
          News
        </button>
        <button
          className={activeTab === 'broadcasts' ? 'lp-tab-button active' : 'lp-tab-button'}
          onClick={() => navigate('/admin/broadcasts')}
        >
          Broadcasts
        </button>
      </div>

      <div className="lp-admin-grid">
        {activeTab === 'sources' && (
          <div className="lp-panel">
          <h3>Add news source</h3>
          <form className="lp-form" onSubmit={handleAddSource}>
            <label>
              Name
              <input
                value={sourceForm.name}
                onChange={(event) => setSourceForm({ ...sourceForm, name: event.target.value })}
                required
              />
            </label>
            <label>
              Description
              <input
                value={sourceForm.description}
                onChange={(event) => setSourceForm({ ...sourceForm, description: event.target.value })}
              />
            </label>
            <label>
              URL
              <input
                value={sourceForm.url}
                onChange={(event) => setSourceForm({ ...sourceForm, url: event.target.value })}
                required
              />
            </label>
            <button className="lp-button" type="submit">
              Add source
            </button>
          </form>
          <div className="lp-stack">
            {sources.map((source) => (
              <div key={source.id} className="lp-inline-row">
                <div>
                  <strong>{source.name}</strong>
                  <p>{source.description}</p>
                </div>
                <button className="lp-button ghost" onClick={() => handleDeleteSource(source.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="lp-panel">
          <h3>Add news item</h3>
          <form className="lp-form" onSubmit={handleAddNews}>
            <label>
              Title
              <input
                value={newsForm.title}
                onChange={(event) => setNewsForm({ ...newsForm, title: event.target.value })}
                required
              />
            </label>
            <label>
              Description
              <input
                value={newsForm.description}
                onChange={(event) => setNewsForm({ ...newsForm, description: event.target.value })}
              />
            </label>
            <label>
              Content
              <textarea
                rows={4}
                value={newsForm.content}
                onChange={(event) => setNewsForm({ ...newsForm, content: event.target.value })}
                required
              />
            </label>
            <label>
              Image URL
              <input
                value={newsForm.image}
                onChange={(event) => setNewsForm({ ...newsForm, image: event.target.value })}
              />
            </label>
            <label>
              Source label
              <input
                value={newsForm.source}
                onChange={(event) => setNewsForm({ ...newsForm, source: event.target.value })}
              />
            </label>
            <label>
              Location tag
              <input
                value={newsForm.location}
                onChange={(event) => setNewsForm({ ...newsForm, location: event.target.value })}
              />
            </label>
            <button className="lp-button" type="submit">
              Publish
            </button>
          </form>
          <div className="lp-stack">
            {news.map((item) => (
              <div key={item.id} className="lp-inline-row">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.source}</p>
                </div>
                <button className="lp-button ghost" onClick={() => handleDeleteNews(item.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
          </div>
        )}

        {activeTab === 'broadcasts' && (
          <div className="lp-panel">
          <h3>Broadcast message</h3>
          <form className="lp-form" onSubmit={handleBroadcast}>
            <label>
              Message
              <textarea
                rows={4}
                value={broadcastText}
                onChange={(event) => setBroadcastText(event.target.value)}
                required
              />
            </label>
            <button className="lp-button" type="submit">
              Send broadcast
            </button>
          </form>
          </div>
        )}
      </div>
    </section>
  )
}
