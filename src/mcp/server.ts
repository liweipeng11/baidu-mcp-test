import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod";
import { getWeather } from "../services/weather.js";
import { geoCode } from '../services/geocode.js'

const server = new McpServer({
    name: "baidumap-mcp",
    version: "1.0.0",
    description: "提供百度地图API的地理编码和天气查询功能"
})


server.tool(
    'getWeather',
    '根据经纬度获取天气',
    {
        lng: z.number().describe("经度"),
        lat: z.number().describe("纬度")
    },
    async ({ lng, lat }: { lng: number, lat: number }) => {
        const data = await getWeather({ lng, lat })
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(data)
            }]
        }
    }
)

server.tool(
    'geoCode',
    '根据地址获取地址编码',
    {
        address: z.string().describe("待解析的地址，如‘北京市海淀区中关村大街1号’"),
        city: z.string().optional().describe("地址所在城市（可选）")
    },
    async ({address,city} : {address:string,city?:string}) => {
            const data = await geoCode({address,city})
            return {
                content:[{
                    type: 'text',
                    text: JSON.stringify(data)
                }]
            }
        }
)

export default server

