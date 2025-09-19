// components/MedTrackHero.tsx
import React from "react";

type Props = { className?: string };

const bullets = [
  "Seamless medication tracking and smart reminders",
  "Effortless integration of wearable device data",
  "Engaging gamification to foster consistent habits",
  "Real-time patient adherence insights for healthcare providers",
];

export default function MedTrackHero({ className }: Props) {
  return (
    <section
      className={["w-full bg-white py-10 md:py-16", className ?? ""].join(" ")}
      aria-label="MedTrack solution overview"
    >
      {/* Side-by-side forever */}
      <div className="mx-auto flex max-w-[1600px] flex-nowrap items-center justify-between gap-8 px-4 sm:px-6">
        {/* Left: fixed-size card (size unchanged) */}
        <div className="shrink-0">
          <div className="rounded-3xl bg-gray-100 p-6 sm:p-8 md:p-10 shadow-xl w-[1050px] h-[715.783px] font-aspekta">
            {/* Center the content block; text remains left-aligned */}
            <div className="mx-auto flex h-full max-w-[980px] flex-col justify-center text-left">
              <h2 className="text-[68px] sm:text-[72px] lg:text-[78px] leading-[1.02] tracking-[-0.012em] font-normal text-black">
                Our Solution: <span className="font-bold">Med</span>
                <span className="">Track</span>
              </h2>

              <p className="mt-3 max-w-none text-[20px] sm:text-[21px] lg:text-[22px] leading-[1.35] text-neutral-700 py-5">
                An integrated web application featuring an AI-powered health companion designed to
                revolutionize chronic disease management.
              </p>

              <ul className="mt-6 space-y-4">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-2 inline-block h-2.5 w-2.5 flex-none rounded-full bg-emerald-300" />
                    <span className="text-[20px] sm:text-[21px] lg:text-[22px] leading-[1.45] text-neutral-800">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: phone image area (unchanged) */}
        <div className="min-w-[220px] flex-1 flex items-center justify-center">
          <img
            src="/phone-section.svg"
            alt="MedTrack mobile UI preview"
            className="h-auto w-full max-w-[380px] drop-shadow-[0_10px_28px_rgba(0,0,0,0.12)] select-none"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}
