"use client";
import { useEffect } from "react";

export default function ErudaLoader() {
  useEffect(() => {
    import("eruda").then((eruda) => eruda.default.init());
  }, []);

  return null;
}
