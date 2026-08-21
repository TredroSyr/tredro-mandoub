"use client";
import { useEffect, useState, useCallback } from "react";

export default function WarmupConnection() {
  const [results, setResults] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const addResult = (line: string) => {
    setResults((prev) => [...prev, line]);
  };

  const testServer = async (label: string, url: string) => {
    const start = Date.now();
    try {
      const res = await fetch(url);
      const duration = Date.now() - start;
      const text = await res.text();
      addResult(
        `${label}: ${duration}ms | status: ${res.status} | body: ${text.slice(0, 100)}`
      );
    } catch (e: any) {
      const duration = Date.now() - start;
      addResult(
        `${label} FAILED after ${duration}ms | name: ${e?.name} | message: ${e?.message}`
      );
    }
  };

  const runTests = useCallback(async () => {
    setRunning(true);
    setResults([]);

    await testServer("jsonplaceholder", "https://jsonplaceholder.typicode.com/posts/1");
    await testServer("your-server (tredro)", `${process.env.NEXT_PUBLIC_BASE_URL}/health`);
    await testServer("kadnya-backend", "https://back-auth.kadnya-dev.com/health");
    await testServer("other-render-2", "https://my-json-server.typicode.com/typicode/demo/posts");

    setRunning(false);
  }, []);

  useEffect(() => {
    runTests();
  }, [runTests]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "black",
        color: "white",
        padding: 8,
        zIndex: 9999,
        fontSize: 11,
        maxHeight: "60vh",
        overflowY: "auto",
        direction: "ltr",
        textAlign: "left",
      }}
    >
      <button
        onClick={runTests}
        disabled={running}
        style={{
          background: running ? "#555" : "#2563eb",
          color: "white",
          border: "none",
          padding: "6px 12px",
          borderRadius: 4,
          marginBottom: 8,
          fontSize: 12,
        }}
      >
        {running ? "جاري الاختبار..." : "🔄 Reload Test"}
      </button>

      {results.map((r, i) => (
        <div key={i} style={{ marginBottom: 4, wordBreak: "break-all" }}>
          {r}
        </div>
      ))}
    </div>
  );
}