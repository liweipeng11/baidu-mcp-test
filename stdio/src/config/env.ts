import * as dotenv from "dotenv"
import {z} from "zod"

dotenv.config()

const envSchema = z.object({
    BAIDU_MAP_API_KEY: z.string()
})

export const env = envSchema.parse(process.env)