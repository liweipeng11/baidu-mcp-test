// 连接池管理类
class ConnectionPool {
  private pool: { [ak: string]: { server: any, lastUsed: number }[] } = {};
  private maxConnections: number;
  private idleTimeout: number;

  constructor(maxConnections: number = 10, idleTimeout: number = 300000) {
    this.maxConnections = maxConnections; // 最大连接数
    this.idleTimeout = idleTimeout; // 空闲超时时间(ms)
    this.startCleanupTimer();
  }

  // 获取连接
  acquire(ak: string, serverCreator: (ak: string) => any): any | null {
    if (!this.pool[ak]) this.pool[ak] = [];
    const now = Date.now();

    // 清除超时连接
    this.pool[ak] = this.pool[ak].filter(entry => {
      if (now - entry.lastUsed < this.idleTimeout) return true;
      // 可以在这里添加服务器实例的销毁逻辑
      return false;
    });

    // 计算当前总连接数
    const totalConnections = Object.values(this.pool).reduce(
      (sum, entries) => sum + entries.length, 0
    );

    // 创建新连接(如果未达总上限)
    if (totalConnections < this.maxConnections) {
      const server = serverCreator(ak);
      this.pool[ak].push({ server, lastUsed: now });
      return server;
    }

    return null; // 连接池已满
  }

  // 释放连接
  release(ak: string, server: any) {
    if (!this.pool[ak]) return;
    const entry = this.pool[ak].find(e => e.server === server);
    if (entry) entry.lastUsed = Date.now();
  }

  // 启动空闲连接清理定时器
  private startCleanupTimer() {
    setInterval(() => {
      const now = Date.now();
      for (const ak in this.pool) {
        this.pool[ak] = this.pool[ak].filter(entry => 
          now - entry.lastUsed < this.idleTimeout
        );
      }
    }, this.idleTimeout / 2);
  }
}

export default ConnectionPool;