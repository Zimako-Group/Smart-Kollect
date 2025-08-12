"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HumeVoiceConversationModal } from "./HumeVoiceConversationModal";

export function VoiceMicrophoneButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(true)}
                className="relative group"
              >
                <motion.div
                  animate={{
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <Mic className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  
                  {/* Pulse animation */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>

                {/* Voice indicator dot */}
                <motion.div
                  className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-card border shadow-lg">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Voice Assistant</p>
                <p className="text-xs text-muted-foreground">
                  Click to start a voice conversation
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <HumeVoiceConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
