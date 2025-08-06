"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ChangelogItem {
  version: string;
  date: string;
  title: string;
  changes: string[];
  status: "done" | "in-progress" | "upcoming";
  category: "major" | "feature" | "fix" | "planned";
  timeline?: string;
}

const changelogData: ChangelogItem[] = [
  {
    version: "v1.3.0",
    date: "Q3 2025",
    title: "AI Agent Integration",
    changes: [
      "Smart AI customer analysis",
      "Conversational debt collection assistant",
      "Automated payment negotiation",
      "Sentiment analysis for customer interactions"
    ],
    status: "in-progress",
    category: "feature",
    timeline: "90 DAYS"
  },
  {
    version: "v1.2.0",
    date: "July 2025",
    title: "Enhanced Reporting",
    changes: [
      "Advanced analytics dashboard",
      "Custom report generation",
      "Data export functionality",
      "Performance metrics visualization"
    ],
    status: "done",
    category: "feature",
    timeline: "60 DAYS"
  },
  {
    version: "v1.1.0",
    date: "June 2025",
    title: "Mobile Optimization",
    changes: [
      "Responsive design improvements",
      "Native mobile app features",
      "Offline functionality",
      "Push notifications"
    ],
    status: "done",
    category: "feature",
    timeline: "30 DAYS"
  },
  {
    version: "v1.0.0",
    date: "May 2025",
    title: "Beta Release",
    changes: [
      "Core system functionality",
      "User authentication and authorization",
      "Basic reporting capabilities",
      "Initial dashboard implementation"
    ],
    status: "done",
    category: "major",
    timeline: "15 DAYS"
  },
  {
    version: "v0.9.0",
    date: "May 2025",
    title: "Pre-release Testing",
    changes: [
      "System-wide quality assurance",
      "Performance optimization",
      "Security vulnerability assessment",
      "User acceptance testing"
    ],
    status: "done",
    category: "major",
    timeline: ""
  },
  {
    version: "v0.8.0",
    date: "April 2025",
    title: "Integration Phase",
    changes: [
      "Third-party API integrations",
      "Payment gateway implementation",
      "Email notification system",
      "Data synchronization services"
    ],
    status: "done",
    category: "feature",
    timeline: "45 DAYS"
  },
  {
    version: "v0.7.0",
    date: "March 2025",
    title: "UI/UX Refinement",
    changes: [
      "Interface design improvements",
      "Accessibility enhancements",
      "User flow optimization",
      "Design system implementation"
    ],
    status: "done",
    category: "feature",
    timeline: ""
  },
  {
    version: "v0.5.0",
    date: "February 2025",
    title: "Core Development",
    changes: [
      "Database architecture implementation",
      "Backend API development",
      "Frontend framework setup",
      "Initial feature development"
    ],
    status: "done",
    category: "major",
    timeline: "60 DAYS"
  },
  {
    version: "v0.3.0",
    date: "January 2025",
    title: "Prototype Development",
    changes: [
      "Wireframe creation",
      "Data model design",
      "Technology stack selection",
      "Development environment setup"
    ],
    status: "done",
    category: "feature",
    timeline: "30 DAYS"
  },
  {
    version: "v0.1.0",
    date: "December 2024",
    title: "Initial Planning",
    changes: [
      "Market research and analysis",
      "Requirement gathering",
      "Project scope definition",
      "Resource allocation planning"
    ],
    status: "done",
    category: "major",
    timeline: "45 DAYS"
  }
];

export default function Changelog() {
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    setIsLoaded(true);
    
    // Find the index of the latest done item
    const latestDoneIndex = changelogData.findIndex(
      (item) => item.status === "done"
    );
    
    if (latestDoneIndex !== -1) {
      setActiveItemIndex(latestDoneIndex);
      
      // Scroll to the latest done item
      setTimeout(() => {
        const element = document.getElementById(`changelog-item-${latestDoneIndex}`);
        if (element) {
          const yOffset = -100;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 500);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-emerald-500";
      case "in-progress":
        return "bg-amber-500";
      case "upcoming":
        return "bg-indigo-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "done":
        return "text-emerald-500";
      case "in-progress":
        return "text-amber-500";
      case "upcoming":
        return "text-indigo-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "done":
        return "DONE";
      case "in-progress":
        return "IN PROGRESS";
      case "upcoming":
        return "UPCOMING";
      default:
        return "PLANNED";
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "major":
        return "bg-red-500 bg-opacity-20 text-red-400";
      case "feature":
        return "bg-blue-500 bg-opacity-20 text-blue-400";
      case "fix":
        return "bg-yellow-500 bg-opacity-20 text-yellow-400";
      case "planned":
        return "bg-purple-500 bg-opacity-20 text-purple-400";
      default:
        return "bg-gray-500 bg-opacity-20 text-gray-400";
    }
  };

  const filteredData = filter === "all" 
    ? changelogData 
    : changelogData.filter(item => item.status === filter);

  return (
    <div className="w-full space-y-6">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-pink-600">Development Roadmap</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Track our progress on the Debt Collection Management System
          </p>
          
          <div className="mt-8 inline-flex bg-gray-800 p-1 rounded-lg">
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === "all" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter("in-progress")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === "in-progress" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
            >
              In Progress
            </button>
            <button 
              onClick={() => setFilter("done")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === "done" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Completed
            </button>
            <button 
              onClick={() => setFilter("upcoming")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === "upcoming" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Upcoming
            </button>
          </div>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Vertical Timeline Line */}
          <div className="absolute left-24 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 via-pink-500 to-purple-600 rounded-full z-0"></div>

          {/* Changelog Items */}
          <div className="space-y-20 relative z-10">
            <AnimatePresence>
              {filteredData.map((item, index) => {
                const isActive = index === activeItemIndex;
                const isPast = item.status === "done";
                const isCurrent = item.status === "in-progress";
                const isFuture = item.status === "upcoming";

                return (
                  <motion.div
                    key={item.version}
                    id={`changelog-item-${index}`}
                    className="relative"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: Math.min(index * 0.1, 1),
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                  >
                    {/* Timeline Badge - Left Side Positioning */}
                    {item.timeline && (
                      <motion.div
                        className="absolute left-0 top-0 z-20"
                        initial={{ opacity: 0, x: -30 }}
                        animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                      >
                        <div className="flex items-center h-10">
                          <motion.div
                            className="bg-indigo-900/80 backdrop-blur-sm text-xs font-bold px-3 py-2 rounded-md border border-indigo-700/50 shadow-lg flex items-center relative"
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></div>
                              <div className="text-indigo-200 font-mono tracking-wider">{item.timeline}</div>
                            </div>
                            {/* Arrow pointing to timeline */}
                            <div className="absolute right-[-8px] top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-indigo-900/80"></div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Timeline Dot with Glow Effect */}
                    <motion.div
                      className={`absolute left-24 w-10 h-10 rounded-full border-4 border-gray-900 z-20 transform -translate-x-1/2 flex items-center justify-center shadow-lg ${
                        isPast 
                          ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30" 
                          : isCurrent 
                            ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30" 
                            : "bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-indigo-500/30"
                      }`}
                      initial={{ scale: 0 }}
                      animate={isLoaded ? { scale: 1 } : {}}
                      whileHover={{ scale: 1.2 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                    >
                      {/* Inner glow effect */}
                      <div className="absolute inset-0 rounded-full bg-white opacity-20"></div>
                      
                      {isPast && (
                        <svg className="w-5 h-5 text-white drop-shadow-md relative z-10" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {isCurrent && (
                        <svg className="w-5 h-5 text-white drop-shadow-md relative z-10" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      )}
                      {isFuture && (
                        <svg className="w-5 h-5 text-white drop-shadow-md relative z-10" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </motion.div>

                    {/* Connecting Line to Content */}
                    <div className="absolute left-24 top-[20px] h-0.5 bg-gradient-to-r from-transparent via-gray-600 to-gray-700 w-[72px] transform translate-x-0 z-10"></div>

                    {/* Flag for Current Position */}
                    {isActive && (
                      <motion.div 
                        className="absolute left-24 transform -translate-x-full -translate-y-1/2 z-30"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ 
                          duration: 0.5,
                          delay: 0.5,
                          type: "spring",
                          stiffness: 100
                        }}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-[42px] bg-gradient-to-r from-amber-500 to-pink-600 flex items-center justify-center shadow-lg rounded-l-sm">
                            <span className="text-white font-bold text-xs tracking-wider">NOW</span>
                          </div>
                          <div className="w-0 h-0 border-t-[21px] border-b-[21px] border-l-[12px] border-t-transparent border-b-transparent border-l-pink-600"></div>
                        </div>
                      </motion.div>
                    )}

                    {/* Content Card */}
                    <motion.div 
                      className={`ml-40 bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden shadow-xl ${
                        isActive ? "ring-2 ring-offset-4 ring-offset-gray-900 ring-amber-500" : ""
                      }`}
                      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`h-1.5 w-full ${getStatusColor(item.status)}`}></div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="flex gap-2 mb-2">
                              <div className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(item.status)} bg-opacity-20 ${getStatusTextColor(item.status)}`}>
                                {getStatusLabel(item.status)}
                              </div>
                              <div className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${getCategoryBadge(item.category)}`}>
                                {item.category.toUpperCase()}
                              </div>
                            </div>
                            <h3 className="text-2xl font-bold">{item.title}</h3>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-gray-300 text-sm font-medium bg-gray-700 bg-opacity-50 px-3 py-1 rounded-full">{item.date}</span>
                            <span className="text-gray-400 text-xs mt-2 font-mono">{item.version}</span>
                          </div>
                        </div>
                        <ul className="space-y-3 mt-4">
                          {item.changes.map((change, idx) => (
                            <motion.li 
                              key={idx} 
                              className="flex items-start"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 * idx }}
                            >
                              <span className={`${getStatusColor(item.status)} rounded-full h-2.5 w-2.5 mt-1.5 mr-3 flex-shrink-0`}></span>
                              <span className="text-gray-300">{change}</span>
                            </motion.li>
                          ))}
                        </ul>

                        {/* Beta badge for v1.0.0 */}
                        {item.version === "v1.0.0" && (
                          <div className="mt-6">
                            <span className="inline-flex items-center bg-amber-500 bg-opacity-10 text-amber-400 text-xs px-3 py-1 rounded-full border border-amber-500 border-opacity-20">
                              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
                              BETA RELEASE
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}