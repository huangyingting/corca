import React from 'react';
import Link from 'next/link';

export function CortexLogo({
  href = '/',
  subtitle,
  size = 'md',
}: {
  href?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const boxSize =
    size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  const textSize =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <img
        src="/cortex-symbol-rect.svg"
        alt="CorTeX"
        className={`${boxSize} rounded-[5px] shadow-sm transition-transform group-hover:scale-[1.03]`}
      />
      <span className="inline-flex items-baseline gap-1.5">
        <span className={`font-semibold tracking-tight text-[#1c1c1a] ${textSize}`}>
          CorTeX
        </span>
        {subtitle ? (
          <span className="text-xs font-medium text-[#575751] border-l border-[#d6d6cc] pl-2">
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
