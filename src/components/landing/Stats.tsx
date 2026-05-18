export default function Stats() {
  return (
    <section
      className="relative w-full"
      style={{ borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div className="mx-auto flex h-[214px] max-w-[1440px] items-center">
        {/* Clients */}
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <span className="text-[23px] leading-[28px] text-[#EAB308]">Clients</span>
          <span className="text-[46px] font-bold leading-[55px] text-white">100+</span>
        </div>

        {/* Divider */}
        <div className="h-[134px] w-[2px] shrink-0 bg-white/10" />

        {/* Projects */}
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <span className="text-[23px] leading-[28px] text-[#EAB308]">Projects</span>
          <span className="text-[46px] font-bold leading-[55px] text-white">50+</span>
        </div>

        {/* Divider */}
        <div className="h-[134px] w-[2px] shrink-0 bg-white/10" />

        {/* 5-Star Reviews */}
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <span className="text-[23px] leading-[28px] text-[#EAB308]">5-Star Reviews</span>
          <span className="text-[46px] font-bold leading-[55px] text-white">42+</span>
        </div>
      </div>
    </section>
  );
}
