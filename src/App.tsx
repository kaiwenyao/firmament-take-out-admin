import { useState, useRef, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useWebSocket } from "./hooks/useWebSocket";
import { toast } from "sonner";
import { setNavigate } from "@/utils/navigation";
// import { useMemo } from "react";

// ✅ 1. 关键修改：通过 import 引入资源，而不是写死字符串路径
// Vite 会自动处理这些文件的最终 hash 路径
import previewSound from "@/assets/audio/preview.mp3";
import reminderSound from "@/assets/audio/reminder.mp3";

function App() {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 初始化 navigate 函数，供非组件环境使用
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  /**
   * 生成客户端ID（用于 WebSocket 连接标识）
   *
   * 为什么使用函数初始化（惰性初始化）？
   * 1. React 机制：useState 的初始化函数只在组件首次挂载时执行一次
   *    后续的重渲染（state 更新、父组件重渲染等）不会再次执行这个函数
   *
   * 2. 性能优化：
   *    - 避免每次重渲染都读取 localStorage（I/O 操作）
   *    - 避免每次重渲染都生成新的随机 ID（保证 ID 一致性）
   *    - 减少不必要的计算开销
   *
   * 3. 数据一致性：
   *    - 确保整个组件生命周期内使用同一个客户端 ID
   *    - 如果使用普通值初始化，每次重渲染都可能生成不同的 ID（错误！）
   *
   * 4. 实际执行流程：
   *    - 首次渲染：执行函数 → 读取 localStorage → 不存在则生成并保存 → 返回 ID
   *    - 后续渲染：直接使用已保存的状态值，不再执行函数
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

  // ✅ 1. 使用 useRef 存放音频对象 (这是存放 Mutable 可变对象的标准方式，不会报错)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const reminderAudioRef = useRef<HTMLAudioElement | null>(null);

  // ✅ 2. 简单的初始化 (只执行一次)
  useEffect(() => {
    // 只有当 ref 为空时才创建，避免重复
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(previewSound);
    }
    if (!reminderAudioRef.current) {
      reminderAudioRef.current = new Audio(reminderSound);
    }
  }, []);

  // ✅ 3. 播放逻辑
  const playAudio = useCallback(async (type: "preview" | "reminder") => {
    // 从 ref.current 中取出音频对象
    const audio =
      type === "preview" ? previewAudioRef.current : reminderAudioRef.current;

    // 安全检查：如果万一没初始化好，直接返回
    if (!audio) return;

    try {
      // ✅ 这里修改 currentTime 不会报错，因为 ref 里的对象允许修改
      audio.currentTime = 0;
      await audio.play();
      console.log(`Audio played: ${type}`);
    } catch (err) {
      console.warn("Audio playback failed:", err);
      toast.error("Could not play notification sound. Click anywhere on the page to enable audio.");
    }
  }, []);

  // ✅ 4. 消息处理
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

  // WebSocket 连接
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
      {/* 确保 Toaster 配置正确 */}
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
