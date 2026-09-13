export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-radial-glow select-none">
      {/* Grano fino, discreto — aporta textura sin leerse como cuadrícula técnica */}
      <div className="absolute inset-0 bg-grain opacity-[0.05] mix-blend-overlay" />

      {/* Top subtle vignette */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-surface-base/90 pointer-events-none" />

      {/* Very subtle focal glow in the upper-right corner */}
      <div 
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cerulean-500/10 blur-[120px] pointer-events-none"
        aria-hidden="true" 
      />
      {/* Subtle bottom-left focal glow */}
      <div 
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-dark-teal-600/10 blur-[140px] pointer-events-none"
        aria-hidden="true" 
      />
    </div>
  );
}
export default AnimatedBackground;
