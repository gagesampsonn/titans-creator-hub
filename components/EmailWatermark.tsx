import React from 'react';

interface EmailWatermarkProps {
  email: string;
  className?: string;
}

/**
 * Email watermark overlay component
 * Displays the user's email as a semi-transparent watermark
 * to discourage screen sharing/recording of course content
 */
export const EmailWatermark: React.FC<EmailWatermarkProps> = ({ email, className = '' }) => {
  // Generate multiple positions for the watermark
  const positions = [
    { top: '15%', left: '10%', rotate: '-12deg' },
    { top: '40%', right: '5%', rotate: '8deg' },
    { bottom: '20%', left: '15%', rotate: '-5deg' },
    { top: '65%', left: '50%', rotate: '10deg' },
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {positions.map((pos, idx) => (
        <div
          key={idx}
          className="absolute text-white/[0.08] font-mono text-sm select-none"
          style={{
            ...pos,
            transform: `rotate(${pos.rotate})`,
            textShadow: '0 0 10px rgba(0,0,0,0.3)',
          }}
        >
          {email}
        </div>
      ))}
      
      {/* Central prominent watermark */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.06] font-mono text-lg select-none whitespace-nowrap"
        style={{
          transform: 'translate(-50%, -50%) rotate(-15deg)',
          textShadow: '0 0 20px rgba(0,0,0,0.2)',
        }}
      >
        Licensed to: {email}
      </div>
    </div>
  );
};

export default EmailWatermark;

