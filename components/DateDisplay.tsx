// components/DateDisplay.tsx
"use client";

export function DateDisplay() {
  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  return <p className="text-muted-foreground">Welcome back! Today is {todayDate}</p>;
}