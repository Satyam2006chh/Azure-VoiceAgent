import React from 'react';

export const AudioVisualizer = ({
  isActive = false,
  barCount = 18,
  color = '#0078D4',
  height = 36,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        height: `${height}px`,
        padding: '0 8px',
      }}
      aria-label={isActive ? 'Audio playing' : 'Audio inactive'}
    >
      {Array.from({ length: barCount }).map((_, index) => {
        // Vary heights and animation delays for realistic waveform look
        const delay = (index * 0.08) % 0.8;
        const defaultHeight = isActive ? 8 + ((index % 5) * 4) : 4;
        const maxHeight = height - 4;

        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              width: '3px',
              height: isActive ? `${maxHeight}px` : `${defaultHeight}px`,
              borderRadius: '2px',
              backgroundColor: color,
              opacity: isActive ? 0.9 : 0.25,
              transformOrigin: 'bottom',
              animation: isActive
                ? `soundWave 0.8s ease-in-out ${delay}s infinite alternate`
                : 'none',
              transition: 'height 0.2s ease, opacity 0.2s ease',
            }}
          />
        );
      })}
    </div>
  );
};
