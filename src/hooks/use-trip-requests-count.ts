"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useTripRequestsCount() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = async () => {
    if (!session || session.user.role !== "DRIVER") {
      setCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/driver/trip-requests?status=PENDING");

      if (response.ok) {
        const data = await response.json();
        setCount(data.total || 0);
      } else {
        setCount(0);
      }
    } catch (error) {
      console.error("Error fetching trip requests count:", error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // تحديث العدد كل 10 ثواني للاستجابة السريعة
    const interval = setInterval(fetchCount, 10000);

    return () => clearInterval(interval);
  }, [session]);

  return { count, loading, refetch: fetchCount };
}
