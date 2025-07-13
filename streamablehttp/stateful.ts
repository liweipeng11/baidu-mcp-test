import express, { Request, Response } from "express"
import { randomUUID } from "node:crypto"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import cors from 'cors';
import ConnectionPool from "../utils/connectionPool.js";
import createMcpServer from "../sse/src/mcp/server.js";

// 初始化连接池
const connectionPool = new ConnectionPool(10, 300000); // 最大10个连接，5分钟空闲超时

const app = express()
app.use(express.json())
app.use(cors({
    origin: '*', // Configure appropriately for production, for example:
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));

// 会话ID与传输层映射表
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {}

// 处理客户端请求
app.post('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    let ak = req.query.ak as string || req.headers.ak as string;
    if (!ak) {
        res.status(400).send('请提供ak');
        return;
    }

    let transport: StreamableHTTPServerTransport

    if (sessionId && transports[sessionId]) {
        transport = transports[sessionId]
    } else if (!sessionId && isInitializeRequest(req.body)) {
        // 从连接池获取服务器实例
        const server = connectionPool.acquire(ak,createMcpServer);
        if (!server) {
            res.status(503).send('连接池已满，请稍后再试');
            return;
        }
        // 新建会话
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
                transports[sessionId] = transport
            }
        })

        // 清理会话
        transport.onclose = () => {
            if (transport.sessionId) delete transports[transport.sessionId];
            // 释放连接回池
            if (server) connectionPool.release(ak, server);
        }

        await server.connect(transport)
    } else {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: '错误请求：无效的会话ID'
            }
        });
        return;
    }
    await transport.handleRequest(req, res, req.body);
})

// 处理GET/DELETE请求
const handleSessionRequest = async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('无效或缺失的会话ID');
        return;
    }
    await transports[sessionId].handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);
app.delete('/mcp', handleSessionRequest);

const port = 8080;
app.listen(port, () => {
    console.log(`Mcp Server is running on port ${port}`);
});