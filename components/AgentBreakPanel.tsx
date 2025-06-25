"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Coffee, UtensilsCrossed, Clock, Timer, Loader2 } from "lucide-react";
import {
  BreakType,
  startAgentBreak,
  endAgentBreak,
  getActiveBreak,
} from "@/lib/agent-breaks-service";

interface AgentBreakPanelProps {
  agentId: string;
}

export function AgentBreakPanel({ agentId }: AgentBreakPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [breakType, setBreakType] = useState<BreakType>("lunch");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeBreak, setActiveBreak] = useState<{
    id: string;
    type: BreakType;
    startTime: Date;
  } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Check if the agent has an active break
  const checkForActiveBreak = useCallback(async () => {
    try {
      const activeBreakData = await getActiveBreak(agentId);
      
      if (activeBreakData) {
        setActiveBreak({
          id: activeBreakData.id,
          type: activeBreakData.breakType,
          startTime: new Date(activeBreakData.startTime)
        });
        
        // Calculate initial elapsed time
        const now = new Date();
        const startTime = new Date(activeBreakData.startTime);
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      } else {
        setActiveBreak(null);
        setElapsedTime(0);
      }
    } catch (error) {
      console.error("Error checking for active break:", error);
    }
  }, [agentId]);

  // Check for active break on component mount
  useEffect(() => {
    checkForActiveBreak();
  }, [checkForActiveBreak]);

  // Timer for active break
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (activeBreak) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - activeBreak.startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeBreak]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };



  // Start a break
  const handleStartBreak = async () => {
    setIsLoading(true);
    try {
      const result = await startAgentBreak(agentId, breakType, notes || null);
      
      if (result.success) {
        toast.success(`${breakType.charAt(0).toUpperCase() + breakType.slice(1)} break started`);
        setIsDialogOpen(false);
        checkForActiveBreak();
      } else {
        toast.error(result.error || "Failed to start break");
      }
    } catch (error) {
      console.error("Error starting break:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // End a break
  const handleEndBreak = async () => {
    if (!activeBreak) return;
    
    setIsLoading(true);
    try {
      const result = await endAgentBreak(agentId);
      
      if (result.success) {
        const durationText = result.duration 
          ? `${result.duration} minute${result.duration !== 1 ? 's' : ''}` 
          : 'unknown duration';
        toast.success(`Break ended (${durationText})`);
        setActiveBreak(null);
        setElapsedTime(0);
      } else {
        toast.error(result.error || "Failed to end break");
      }
    } catch (error) {
      console.error("Error ending break:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Get icon for break type
  const getBreakIcon = (type: BreakType) => {
    switch (type) {
      case "lunch":
        return <UtensilsCrossed className="h-5 w-5" />;
      case "tea":
        return <Coffee className="h-5 w-5" />;
      case "bathroom":
        return <Clock className="h-5 w-5" />;
      default:
        return <Timer className="h-5 w-5" />;
    }
  };

  // Get color for break type
  const getBreakColor = (type: BreakType): string => {
    switch (type) {
      case "lunch":
        return "bg-orange-500 hover:bg-orange-600";
      case "tea":
        return "bg-green-500 hover:bg-green-600";
      case "bathroom":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-purple-500 hover:bg-purple-600";
    }
  };

  // Get text for break type
  const getBreakText = (type: BreakType): string => {
    switch (type) {
      case "lunch":
        return "Lunch Break";
      case "tea":
        return "Tea Break";
      case "bathroom":
        return "Bathroom Break";
      default:
        return "Other Break";
    }
  };

  return (
    <>
      {activeBreak ? (
        <Card className="border-red-500/20 bg-red-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getBreakIcon(activeBreak.type)}
              <span>On {getBreakText(activeBreak.type)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold mb-2">{formatTime(elapsedTime)}</div>
              <Button 
                onClick={handleEndBreak}
                disabled={isLoading}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                End Break
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
            >
              <Timer className="h-4 w-4" />
              Take a Break
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Take a Break</DialogTitle>
              <DialogDescription>
                Select the type of break you need to take. Your status will be updated accordingly.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="break-type" className="text-sm font-medium">
                  Break Type
                </label>
                <Select
                  value={breakType}
                  onValueChange={(value) => setBreakType(value as BreakType)}
                >
                  <SelectTrigger id="break-type">
                    <SelectValue placeholder="Select break type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lunch">Lunch Break (30-60 min)</SelectItem>
                    <SelectItem value="tea">Tea Break (10-15 min)</SelectItem>
                    <SelectItem value="bathroom">Bathroom Break (5-10 min)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes (Optional)
                </label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about your break"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleStartBreak}
                disabled={isLoading}
                className={getBreakColor(breakType)}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  getBreakIcon(breakType)
                )}
                Start {getBreakText(breakType)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
