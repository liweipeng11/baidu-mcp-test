#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import server from "./src/mcp/server.js"



// 启动MCP服务器
async function startServer(){
    // 本地开发使用stdio传输
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.log("MCP服务已启动（stdio模式）")
}
startServer().catch(err=>{
    console.error("MCP服务器启动失败：",err)
    process.exit(1)
})