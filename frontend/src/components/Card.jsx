/**
 * components/Card.jsx — Reusable floating card wrapper
 */
export default function Card({ children, className = '', style = {}, flat = false }) {
    return (
        <div
            className={`card ${flat ? 'card-flat' : ''} ${className}`}
            style={style}
        >
            {children}
        </div>
    );
}
