"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface FloatingButtonPosition {
  x: number;
  y: number;
}

interface FloatingButtonState {
  isVisible: boolean;
  position: FloatingButtonPosition;
  isDragging: boolean;
  setIsVisible: (isVisible: boolean) => void;
  setPosition: (position: FloatingButtonPosition) => void;
  setIsDragging: (isDragging: boolean) => void;
}

const defaultPosition = { x: 20, y: 20 };

const FloatingButtonContext = createContext<FloatingButtonState>({
  isVisible: true,
  position: defaultPosition,
  isDragging: false,
  setIsVisible: () => {},
  setPosition: () => {},
  setIsDragging: () => {},
});

export const useFloatingButton = () => useContext(FloatingButtonContext);

export const FloatingButtonProvider = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState<FloatingButtonPosition>(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);

  // Load position from localStorage on client side
  useEffect(() => {
    const savedPosition = localStorage.getItem('zimakoAIButtonPosition');
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition));
      } catch (e) {
        console.error('Failed to parse saved position:', e);
      }
    }
  }, []);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (position.x !== defaultPosition.x || position.y !== defaultPosition.y) {
      localStorage.setItem('zimakoAIButtonPosition', JSON.stringify(position));
    }
  }, [position]);

  return (
    <FloatingButtonContext.Provider
      value={{
        isVisible,
        position,
        isDragging,
        setIsVisible,
        setPosition,
        setIsDragging,
      }}
    >
      {children}
    </FloatingButtonContext.Provider>
  );
};
