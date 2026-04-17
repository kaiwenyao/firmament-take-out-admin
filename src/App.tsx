import { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useWebSocket } from "./hooks/useWebSocket";
import { toast } from "sonner";
import { setNavigate } from "@/utils/navigation";
// import { useMemo } from "react";

// Key change: Import resources via import instead of hardcoding paths
// Vite automatically handles final hash paths for these files
import previewSound from "@/assets/audio/preview.mp3";
import reminderSound from "@/assets/audio/reminder.mp3";

function App() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Initialize navigate function for use in non-component contexts
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  /**
   * Generate client ID (for WebSocket connection identifier)
   *
   * Why use function initialization (lazy initialization)?
   * 1. React mechanism: useState initializer function only executes once on component mount
   *    Subsequent re-renders (state updates, parent re-renders, etc.) will not execute this function again
   *
   * 2. Performance optimization:
   *    - Avoid reading localStorage on every re-render (I/O operation)
   *    - Avoid generating new random ID on every re-render (ensures ID consistency)
   *    - Reduce unnecessary computation overhead
   *
   * 3. Data consistency:
   *    - Ensure same client ID is used throughout component lifecycle
   *    - If using plain value initialization, different IDs may be generated on each re-render (wrong!)
   *
   * 4. Actual execution flow:
   *    - First render: execute function -> read localStorage -> not found, generate and save -> return ID
   *    - Subsequent renders: directly use saved state value, function not executed
   */
  const [sid] = useState<string>(() => {
    const STORAGE_KEY = "ws_client_id";
    let storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      storedId = `client_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;
      localStorage.setItem(STORAGE_KEY, storedId);
    }
    return storedId;
  });

  // 1. Use useRef to store audio object (standard way to store mutable objects, won't cause errors)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const reminderAudioRef = useRef<HTMLAudioElement | null>(null);

  // 2. Simple initialization (only executes once)
  useEffect(() => {
    // Only create audio objects if ref is empty to avoid duplication
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(previewSound);
    }
    if (!reminderAudioRef.current) {
      reminderAudioRef.current = new Audio(reminderSound);
    }
  }, []);

  // 3. Playback logic
  const playAudio = useCallback(async (type: "preview" | "reminder") => {
    // Get audio object from ref.current
    const audio =
      type === "preview" ? previewAudioRef.current : reminderAudioRef.current;

    // Safety check: return early if not initialized
    if (!audio) return;

    try {
      // Modifying currentTime won't cause errors since ref object allows mutation
      audio.currentTime = 0;
      await audio.play();
      console.log(`Audio played: ${type}`);
    } catch (err) {
      console.warn("Audio playback failed:", err);
      toast.error("Could not play notification sound. Click anywhere on the page to enable audio.");
    }
  }, []);

  // 4. Message handling
  const handleMessage = useCallback(
    (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log("WebSocket message:", data);

        if (data.type === 1) {
          toast.success("New order received");
          playAudio("preview");
        } else if (data.type === 2) {
          toast.warning("Order reminder: customer is asking for a faster delivery" + (data.content ? ` — ${data.content}` : ""));
          playAudio("reminder");
        }
      } catch (e) {
        console.error("Failed to parse WebSocket JSON", e);
      }
    },
    [playAudio]
  );

  // WebSocket connection
  useWebSocket({
    sid,
    onMessage: handleMessage,
  });
  
  return (
    <>
      <div className="flex flex-col h-screen w-full bg-gray-50">
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isCollapsed={isSidebarCollapsed} />
          <main className="flex-1 p-8 overflow-auto bg-gray-100/50">
            <div className="bg-white p-6 rounded-lg shadow-sm min-h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      {/* Ensure Toaster is configured correctly */}
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
