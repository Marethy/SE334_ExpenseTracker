"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const WelcomeMsg = () => {
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-2 mb-4">
        <h2 className="text-2xl lg:text-4xl text-white font-medium">
          Welcome Back 👋🏻
        </h2>
        <p className="text-sm lg:text-base text-[#89b6fd]">
          This is your Financial Overview Report
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-4">
      <h2 className="text-2xl lg:text-4xl text-white font-medium">
        Welcome Back{isLoaded && user?.firstName ? `, ${user.firstName}` : ""}{" "}
        👋🏻
      </h2>
      <p className="text-sm lg:text-base text-[#89b6fd]">
        This is your Financial Overview Report
      </p>
    </div>
  );
};

export default WelcomeMsg;
