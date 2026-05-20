import * as React from "react";

const items = [
  { label: "Clients",        value: "100+" },
  { label: "Projets",        value: "50+"  },
  { label: "Avis 5 Étoiles", value: "42+"  },
];

export default function Stats() {
  return (
    <section className="relative w-full py-6">
      {/* Gradient separator lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto flex h-[180px] max-w-[1200px] items-center px-6">
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            <div className="group flex flex-1 cursor-default flex-col items-center justify-center gap-2">
              <span className="text-[18px] font-medium leading-[24px] tracking-wide text-[#EAB308] transition-colors duration-300 group-hover:text-yellow-300">
                {item.label}
              </span>
              <span className="inline-block text-[44px] font-bold leading-[52px] text-white transition-all duration-300 group-hover:scale-110 group-hover:text-[#EAB308]">
                {item.value}
              </span>
            </div>
            {i < items.length - 1 && (
              <div className="h-[90px] w-px shrink-0 bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
