export default function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-img" />
            <div className="skeleton-header">
                <div className="skeleton-avatar" />
                <div className="skeleton-line short" />
            </div>
            <div className="skeleton-body">
                <div className="skeleton-line" />
                <div className="skeleton-line medium" />
                <div className="skeleton-line short" />
            </div>
            <div className="skeleton-footer">
                <div className="skeleton-line short" />
            </div>
        </div>
    )
}
