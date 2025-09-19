import React from "react";
import Tag from "./ui/tag";

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden px-20 py-0 my-5 h-[600px] sm:h-auto grid grid-cols-[2fr_1fr] gap-8 text-black font-[aspekta] ">
      {/* First column (image + text) */}
      <div className="relative col-start-1 h-[700px] flex items-center">
        {/* Background image with fixed size */}
        <img
          src="/girl-phone-right.svg"
          alt="girl with phone"
          className="absolute left-50 top-0 w-[900px] h-auto z-10"
        />

        {/* Foreground content */}
        <div className="relative z-10 flex flex-col justify-center items-start">
          <div className="flex justify-start items-center mb-4">
            <Tag />
          </div>
          <p className=" text-8xl text-black"><span className='font-bold'>Med</span>Track</p>
          <p className="mt-4 text-lg text-gray-700 w-[300px] max-w-md">
            Revolutionize chronic disease management with AI-powered health
            tracking.
          </p>

          <div className="mt-6 flex gap-4">
            <button className="px-6 py-2 rounded-full bg-teal-200 text-black font-medium hover:bg-teal-300">
              Login
            </button>
            <button className="px-6 py-2 rounded-full border border-gray-400 text-black font-medium hover:bg-gray-100">
              Explore
            </button>
          </div>
        </div>
      </div>

      {/* Second column (Reminders + Meet Ayu) */}
      <div className="col-start-2 flex flex-col gap-6 overflow-x-hidden">
        {/* Reminders block */}
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-bold text-2xl">Reminders</h3>
            <p className="text-lg text-gray-600">
              Use smart reminders, and your personal health companion Ayu.
            </p>
          </div>
          <img src="/clock.svg" alt="clock" className="h-[110px] w-[110px]" />
        </div>

        {/* Meet Ayu card */}
        <div className="bg-gray-100 p-6 rounded-3xl shadow-md flex flex-col items-center text-center pt-[60px]">
          <h3 className="text-2xl font-bold mb-4">Meet Ayu</h3>
          <img
            src="/ayu-image.svg"
            alt="Ayu bot"
            className="h-[328px] w-auto object-contain mb-4"
          />
          <p className="text-lg text-left text-gray-600 max-w-md">
            Ayu is more than just a reminder—it’s a personalized digital
            companion that fosters emotional connection and sustained
            engagement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
