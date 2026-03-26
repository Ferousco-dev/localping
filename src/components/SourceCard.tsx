import type { Source } from '../lib/types'

export default function SourceCard({
  source,
  isFollowing,
  onToggle,
}: {
  source: Source
  isFollowing: boolean
  onToggle: (id: string) => void
}) {
  return (
    <div className="lp-source-card">
      <div>
        <h3>{source.name}</h3>
        <p>{source.description}</p>
        <a href={source.url} target="_blank" rel="noreferrer">
          Visit source
        </a>
      </div>
      <button
        className={isFollowing ? 'lp-button lp-follow-button active' : 'lp-button lp-follow-button'}
        onClick={() => onToggle(source.id)}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}
