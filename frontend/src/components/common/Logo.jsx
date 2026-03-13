import React from 'react';

export default function Logo({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm rounded-lg",
    md: "w-10 h-10 text-base rounded-xl",
    lg: "w-14 h-14 text-xl rounded-2xl",
    xl: "w-16 h-16 text-2xl rounded-3xl"
  };

  return (
    <div className={`relative flex items-center justify-center bg-[#1a1a1a] dark:bg-white text-white dark:text-black font-black shadow-lg overflow-hidden group ${sizeClasses[size]} ${className}`}>
      {/* Glossy overlay effect for modern look */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <span className="tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>CB</span>
    </div>
  );
}