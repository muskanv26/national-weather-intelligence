import React from 'react';

export const Section = ({ id, title, icon = null, meta, children, className = '' }) => {
  return (
    <section id={id} className={`scroll-mt-16 border-t border-hair pt-8 ${className}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="inline-flex items-center gap-2 text-[15px] font-normal tracking-tight text-ink">
          {icon ? <span className="text-mute">{icon}</span> : null}
          {title}
        </h2>
        {meta ? <div className="font-mono text-xs text-mute">{meta}</div> : null}
      </div>
      {children}
    </section>
  );
};

export default Section;
