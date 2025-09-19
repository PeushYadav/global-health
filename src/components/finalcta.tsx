// components/FinalCta.tsx
import React from "react";

type Props = { className?: string };

export default function FinalCta({ className }: Props) {
  return (
    <section
      className={["w-full bg-white py-12 md:py-16 lg:py-20", className ?? ""].join(" ")}
      aria-label="Final call to action"
    >
      <div className="mx-auto max-w-[1750px] px-4 sm:px-6">
        {/* CTA panel */}
        <div className="rounded-[28px] bg-gray-100 px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14 shadow-xl">
          <div className="mx-auto max-w-4xl text-center font-aspekta">
            <h2 className="text-[34px] sm:text-[44px] lg:text-[56px] leading-[1.1] tracking-[-0.01em] text-black">
              Ready to <span className="font-bold">Transform</span> Your Health Journey?
            </h2>

            <p className="mt-3 text-[14px] sm:text-[15px] lg:text-[16px] leading-[1.5] text-neutral-700">
              Join thousands of patients and healthcare providers who are already experiencing better health outcomes with MedTrack.
            </p>

            <div className="mt-6 flex items-center justify-center gap-4">
              <a
                href="#login"
                className="rounded-full bg-emerald-200/70 text-emerald-900 hover:bg-emerald-200 active:bg-emerald-300 transition-colors px-5 py-2 text-sm font-aspekta"
              >
                Login
              </a>
              <a
                href="#explore"
                className="rounded-full border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 transition-colors px-5 py-2 text-sm font-aspekta"
              >
                Explore
              </a>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <footer className="mt-6 text-center font-aspekta">
          <p className="text-[12px] text-neutral-600">
            © 2025 MedTrack - Healthcare Impact Platform. Developed by students of AIT.
          </p>
          <p className="mt-1 text-[12px] text-neutral-600">
            Empowering better health through technology.
          </p>
        </footer>
      </div>
    </section>
  );
}
