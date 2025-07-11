import express, { Request, Response } from "express"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import server from "./src/mcp/server.js"

const app = express()
app.use(express.json())


// 处理客户端请求
app.post('/mcp', async (req: Request, res: Response) => {
    try {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined
        })
        res.on('close', () => {
            transport.close();
            server.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        res.status(500).json({
            jsonrpc: '2.0',
            error: {
                code: -32603,
                message: '内部服务器错误'
            }
        });
    }
})

// 处理不支持的HTTP方法
app.get('/mcp', async (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "方法不允许"
    }
  });
});

const port = 8080;
app.listen(port, () => {
    console.log(`Mcp Server is running on port ${port}`);
});