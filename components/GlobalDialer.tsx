"use client";

import { useEffect } from "react";
import FloatingDialer from "@/components/FloatingDialer";
import { useAppSelector, useAppDispatch } from "@/lib/redux/store";
import { closeDialer } from "@/lib/redux/features/dialer/dialerSlice";

export function GlobalDialer() {
  const dispatch = useAppDispatch();
  const { isOpen, callInfo } = useAppSelector((state) => state.dialer);

  // Handle closing the dialer
  const handleClose = () => {
    dispatch(closeDialer());
  };

  // Only show the dialer if it's open and has call info
  if (!isOpen || !callInfo) return null;

  return (
    <FloatingDialer 
      isOpen={isOpen}
      onClose={handleClose}
      phoneNumber={callInfo.phoneNumber}
      customerName={callInfo.customerName || ''}
    />
  );
}
