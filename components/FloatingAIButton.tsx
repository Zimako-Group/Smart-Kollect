"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useFloatingButton } from '@/contexts/FloatingButtonContext';
import { cn } from '@/lib/utils';

interface FloatingAIButtonProps {
  onClick?: () => void;
  fixed?: boolean;
}

export function FloatingAIButton({ onClick, fixed = false }: FloatingAIButtonProps) {
  const { isVisible, position, isDragging, setPosition, setIsDragging } = useFloatingButton();
  const buttonRef = useRef<HTMLDivElement>(null);
  
  // Track drag state
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonStartPos = useRef({ x: 0, y: 0 });
  const clickStartTime = useRef(0);
  const isClickEvent = useRef(true);
  const hasMoved = useRef(false);

  // Handle mouse down event to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle left mouse button (button === 0)
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Reset flags
    isClickEvent.current = true;
    hasMoved.current = false;
    
    // Record the time when mouse down occurred
    clickStartTime.current = Date.now();
    
    setIsDragging(true);
    
    // Store the initial mouse position
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    // Store the initial button position
    buttonStartPos.current = { x: position.x, y: position.y };
    
    // Add event listeners for dragging
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Handle mouse move event during dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // If we've moved more than a few pixels, it's a drag, not a click
    const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
    
    if (deltaX > 5 || deltaY > 5) {
      isClickEvent.current = false;
      hasMoved.current = true;
    }
    
    // Calculate the new position based on the mouse movement
    const moveX = e.clientX - dragStartPos.current.x;
    const moveY = e.clientY - dragStartPos.current.y;
    
    // Update the button position
    setPosition({
      x: buttonStartPos.current.x + moveX,
      y: buttonStartPos.current.y + moveY,
    });
  }, [setPosition]);

  // Handle mouse up event to stop dragging
  const handleMouseUp = useCallback((e: MouseEvent) => {
    setIsDragging(false);
    
    // Remove event listeners
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    
    // If this was a click (not a drag) and we have an onClick handler, call it
    const isQuickClick = Date.now() - clickStartTime.current < 300;
    
    if (isClickEvent.current && !hasMoved.current && isQuickClick && onClick) {
      console.log("Triggering click event");
      // Use setTimeout to ensure the click event happens after the drag handling is complete
      setTimeout(() => {
        onClick();
      }, 10);
    }
  }, [setIsDragging, handleMouseMove, onClick]);

  // Handle direct click on the button
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick && !hasMoved.current) {
      onClick();
    }
  };

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (!isVisible) return null;

  // If fixed is true, return a non-draggable button
  if (fixed) {
    return (
      <div className="group">
        <Button
          variant="default"
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-2 py-2 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 h-auto"
          onClick={onClick}
        >
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">Zimako AI</span>
        </Button>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    );
  }

  // Original draggable floating button
  return (
    <div
      ref={buttonRef}
      className={cn(
        "fixed z-50 cursor-move select-none",
        isDragging ? "opacity-80" : "opacity-100"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="group">
        <Button
          variant="default"
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-2 h-auto"
          onClick={handleButtonClick}
        >
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">Zimako AI</span>
        </Button>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>
  );
}
