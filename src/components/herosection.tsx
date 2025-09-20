import React from "react";
import Tag from "./ui/tag";

const HeroSection = () => {
  return (
    <div className="max-w-7xl mx-auto 2xl:max-w-full overflow-hidden px-2 md:px-20 py-0 my-5 h-auto sm:h-auto grid grid-cols-1 2xl:grid-cols-[2fr_1fr] gap-8 text-black font-[aspekta] ">
      {/* First column (image + text) */}
      <div className="relative 2xl:col-start-1 h-[450px] lg:h-[700px] flex items-center justify-center md:justify-start">
        {/* Background image with fixed size */}
        <img
          src="/girl-phone-right.svg"
          alt="girl with phone"
          className="absolute hidden md:block right-0 top-0 w-[600px] lg:w-[900px] h-auto z-10"
        />

        {/* Foreground content */}
        <div className="relative z-10 flex flex-col justify-center items-center md:items-start text-center md:text-left mt-0">
          <div className="flex justify-center md:justify-start items-center mb-4">
            <Tag />
          </div>
          <p className=" text-8xl text-black"><span className='font-bold'>Med</span>Track</p>
          <p className="mt-4 text-lg text-gray-700 w-full md:w-[300px] max-w-md">
            Revolutionize chronic disease management with AI-powered health
            tracking.
          </p>

          <div className="mt-6 flex gap-4 justify-center md:justify-start">
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
      <div className="2xl:col-start-2 2xl:flex flex flex-col-reverse md:grid md:grid-cols-[1fr_1fr] lg:grid-cols-[2fr_1fr] 2xl:flex-col-reverse gap-6 overflow-x-hidden">
       {/* Meet Ayu card */}
        <div className="bg-gray-100 p-6 rounded-3xl shadow-md flex flex-col items-center text-center pt-[60px]">
          <h3 className="text-2xl font-bold mb-0 md:mb-4">Meet Ayu</h3>
          <img
            src="/ayu-image.svg"
            alt="Ayu bot"
            className="h-[328px] w-auto object-contain mb-0 md:mb-4"
          />
          <p className="text-lg text-left text-gray-600 max-w-md">
            Ayu is more than just a reminder—it’s a personalized digital
            companion that fosters emotional connection and sustained
            engagement.
          </p>
        </div>
      
        {/* Reminders block */}
        <div className="flex md:flex-col-reverse
        justify-center
         2xl:flex-row items-center gap-4">
          <div>
            <h3 className="font-bold text-2xl">Reminders</h3>
            <p className="text-lg text-gray-600">
              Use smart reminders, and your personal health companion Ayu.
            </p>
          </div>
          <img src="/clock.svg" alt="clock" className="h-[110px] w-[110px]" />
        </div>

       
      </div>
    </div>
  );
};

export default HeroSection;
