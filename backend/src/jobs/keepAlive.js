export function startKeepAliveJob() {

  const intervalMs = 5 * 60 * 1000; 
  
  const url = process.env.RENDER_EXTERNAL_URL 
    ? `${process.env.RENDER_EXTERNAL_URL}/api/health` 
    : `http://localhost:${process.env.PORT || 3000}/api/health`;

  console.log(`[KeepAlive] Job started, pinging ${url} every ${intervalMs / 60000} minutes`);

  setInterval(() => {
    fetch(url)
      .then(res => {
        if (!res.ok) {
          console.warn(`[KeepAlive] Ping failed with status: ${res.status}`);
        }
      })
      .catch(err => {
        console.warn(`[KeepAlive] Ping failed:`, err.message);
      });
  }, intervalMs);
}
