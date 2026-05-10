"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const year = new Date().getFullYear();
    router.replace(`/calendar/${year}`);
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
      Loading…
    </div>
  );
}
