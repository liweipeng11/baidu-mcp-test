#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {z} from "zod"
import axios from "axios"
import * as dotenv from "dotenv"

// 加载环境变量
dotenv.config()

// 验证环境变量
if(!process.env.BAIDU_MAP_API_KEY){
    throw new Error("百度地图API密钥未配置，请设置BAIDU_MAP_API_KEY环境变量")
}


interface GeoCodeParams {
    address: string;
    city?: string;
    output: string;
    ak: string
}

const server = new McpServer({
    name: "baidumap-mcp",
    version: "1.0.0",
    description: "提供百度地图API的地理编码和天气查询功能"
})

server.tool(
    "geoCode",
    "根据地址获取地址编码",
    {
        address: z.string().describe("待解析的地址，如‘北京市海淀区中关村大街1号’"),
        city: z.string().describe("地址所在城市（可选）")
    },
    async ({address,city}) => {
        const baseUrl = "https://api.map.baidu.com/geocoding/v3/"
        let params:GeoCodeParams = {
            address,
            output: "json",
            ak: process.env.BAIDU_MAP_API_KEY as string
        }
        if(city) params.city = city
        const res = await axios.get(baseUrl,{
            params
        })
        if (res.data.status !== 0) {
            throw new Error(`地理编码失败，状态码：${res.data.status}`)
        }
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    lng: res.data.result.location.lng,
                    lat: res.data.result.location.lat
                })
            }]
        }
    }
)

server.tool(
    "getWeather",
    "根据经纬度获取天气",
    {
        location: z.string().describe("经纬度坐标，格式为'经度,纬度'")
    },
    async ({location}) => {
        const url = "https://api.map.baidu.com/weather/v1/"
        let params = {
            location,
            data_type: "all",
            ak: process.env.BAIDU_MAP_API_KEY as string
        }
        const res = await axios.get(url,{
            params
        })
        if (res.data.status !== 0) {
            throw new Error(`天气查询失败，状态码：${JSON.stringify(res.data)}`)
        }

        return {
            content: [{
                type: "text",
                text: JSON.stringify(res.data.result)
            }]
        }
    }
)

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