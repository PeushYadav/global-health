import React from "react";

const challenges = [
  {
    title: "Medication Adherence",
    desc: "Millions with chronic illnesses like diabetes, asthma, and hypertension struggle with consistent medication intake, leading to suboptimal outcomes.",
  },
  {
    title: "Manual Tracking Burden",
    desc: "Patients face error-prone, inconsistent manual tracking, making it difficult to maintain accurate health records.",
  },
  {
    title: "Limited Provider Insight",
    desc: "Healthcare providers often lack real-time insight into patient adherence, hindering timely interventions and personalized care.",
  },
  {
    title: "Reactive Healthcare",
    desc: "Without proactive tools, patients struggle to prevent related health issues, leading to increased hospitalizations and healthcare costs.",
  },
];

const Challenges: React.FC = () => {
  return (
    <div className="w-screen flex justify-center items-center my-10 text-black">
      <div className="relative w-[1750px] bg-gray-100 rounded-3xl shadow-xl p-10">
        {/* Title */}
        <h2 className="text-5xl font-normal text-center mb-12">
          The <span className="font-bold">Challenge</span> of Chronic Illness
        </h2>

        {/* Four Columns */}
<div className="flex flex-col lg:flex-row lg:divide-x lg:divide-gray-300 ">
  {challenges.map((item, index) => (
    <div key={index} className="px-6 mt-6 text-center flex flex-col justify-start">
      <h3 className="inline-block px-4 py-1 mb-2 lg:mb-4 text-lg font-medium border w-fit border-gray-400 rounded-full">
        {item.title}
      </h3>
      <p className="text-gray-700 text-sm text-left leading-relaxed">{item.desc}</p>
    </div>
  ))}
</div>


        {/* Decorative circles - top right */}
      
       

        
        </div>
      </div>

  );
};

export default Challenges;
