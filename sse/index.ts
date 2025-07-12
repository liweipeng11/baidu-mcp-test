import express, { Request, Response } from "express"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import createMcpServer from "./src/mcp/server.js"


const app = express()
const transports: { [sessionId: string]: SSEServerTransport } = {}
const mcpServers: { [ak: string]: ReturnType<typeof createMcpServer> } = {}
app.get("/sse", async (req: Request, res: Response) => {
    let ak = req.query.ak as string || req.headers.ak as string;
    if(!ak){
        res.status(400).send('请提供ak');
        return;
    }
    let server = mcpServers[ak];
    if(!server){
        server = createMcpServer(ak);
        mcpServers[ak] = server;
    }
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
        delete mcpServers[ak];
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
