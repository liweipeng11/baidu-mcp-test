import express, { Request, Response } from "express"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import ConnectionPool from "../utils/connectionPool.js";
import createMcpServer from "../sse/src/mcp/server.js";

const app = express()
const transports: { [sessionId: string]: SSEServerTransport } = {}
// 初始化连接池
const connectionPool = new ConnectionPool(10, 300000); // 最大10个连接，5分钟空闲超时
app.get("/sse", async (req: Request, res: Response) => {
    let ak = req.query.ak as string || req.headers.ak as string;
    if(!ak){
        res.status(400).send('请提供ak');
        return;
    }
    // 从连接池获取服务器实例
    const server = connectionPool.acquire(ak,createMcpServer);
    if (!server) {
        res.status(503).send('连接池已满，请稍后再试');
        return;
    }
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
        // 释放连接回池
        connectionPool.release(ak, server);
        delete transports[transport.sessionId];
    });
    await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];
    if (transport) {
        await transport.handlePostMessage(req, res);
    } else {
        res.status(400).send('No transport found for sessionId');
    }
});

const port = 8080;
app.listen(port, () => {
    console.log(`Mcp Server is running on port ${port}`);
});
