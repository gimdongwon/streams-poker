// DB/네트워크 지연 시 UI가 무한 대기하지 않도록 타임아웃이 있는 fetch.
// 타임아웃 시 AbortError가 던져지므로 호출부의 try/catch에서 graceful 처리된다.
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
};
