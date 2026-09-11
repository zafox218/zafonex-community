import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="font-mono text-6xl text-neon animate-pulseline">404</p>
      <h1 className="glow-title text-2xl">This page drifted out of orbit</h1>
      <Link to="/" className="btn-primary mt-2">Back to home</Link>
    </div>
  );
}
