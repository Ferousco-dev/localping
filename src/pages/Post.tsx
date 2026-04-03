import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { submitCommunityNews } from '../lib/news'

const categories = [
  'traffic',
  'accident',
  'event',
  'government',
  'school',
  'incident',
  'community',
  'service',
]

export default function Post() {
  const { user, loading } = useAuth()
  const [posting, setPosting] = useState(false)
  const [postKind, setPostKind] = useState<'update' | 'post'>('update')
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    content: '',
    image: '',
    location: user?.location || '',
    category: categories[0],
  })
  const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

  const handlePost = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || posting) return
    setPosting(true)
    const submitted = await submitCommunityNews({
      title: postForm.title,
      description: postForm.description,
      content: postForm.content,
      image: postForm.image,
      location: postForm.location,
      category: postForm.category,
      communityKind: postKind,
      user,
    })
    if (submitted) {
      setPostForm({
        title: '',
        description: '',
        content: '',
        image: '',
        location: user.location,
        category: categories[0],
      })
    }
    setPosting(false)
  }

  if (loading) {
    return (
      <section className="lp-page">
        <div className="lp-state">Loading...</div>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="lp-page">
        <div className="lp-state">
          <p>You need to be signed in to post.</p>
          <div className="lp-inline-actions">
            <Link to="/login" className="lp-button">
              Log in
            </Link>
            <Link to="/signup" className="lp-button secondary">
              Create account
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="lp-page lp-post">
      <div className="lp-post-hero">
        <h2>Post to Community</h2>
        <p>Share a quick head-up or a full community post.</p>
      </div>
      <form className="lp-form lp-post-form" onSubmit={handlePost}>
        <label>
          Post type
          <select value={postKind} onChange={(event) => setPostKind(event.target.value as 'update' | 'post')}>
            <option value="update">Update (brief)</option>
            <option value="post">Community post</option>
          </select>
        </label>
        <label>
          Headline
          <input
            value={postForm.title}
            onChange={(event) => setPostForm({ ...postForm, title: event.target.value })}
            required
          />
        </label>
        <label>
          Short summary
          <input
            value={postForm.description}
            onChange={(event) => setPostForm({ ...postForm, description: event.target.value })}
            required={postKind === 'update'}
          />
        </label>
        <label>
          Full story
          <textarea
            rows={5}
            value={postForm.content}
            onChange={(event) => setPostForm({ ...postForm, content: event.target.value })}
            required={postKind === 'post'}
          />
        </label>
        <label>
          Image URL
          <input
            value={postForm.image}
            onChange={(event) => setPostForm({ ...postForm, image: event.target.value })}
          />
        </label>
        <div className="lp-post-grid">
          <label>
            Location
            <input
              value={postForm.location}
              onChange={(event) => setPostForm({ ...postForm, location: event.target.value })}
            />
          </label>
          <label>
            Category
            <select
              value={postForm.category}
              onChange={(event) => setPostForm({ ...postForm, category: event.target.value })}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatLabel(category)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className="lp-button" type="submit" disabled={posting}>
          {posting ? 'Posting...' : user.autoPublish ? 'Publish now' : 'Submit for approval'}
        </button>
      </form>
    </section>
  )
}
