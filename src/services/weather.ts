import axios from 'axios'
import { WEATHER_API } from '../config/api.js'
import { env } from '../config/env.js'

export async function getWeather({lng,lat}:{lng:number,lat:number}){
    if(lng < -180 || lng > 180) throw new Error('经度超出范围')
    if(lat < -90 || lat > 90) throw new Error('纬度超出范围')
    const params = {
        location: `${lng},${lat}`,
        data_type: WEATHER_API.dataType,
        ak: env.BAIDU_MAP_API_KEY
    }

    const res = await axios.get(WEATHER_API.baseUrl,{params})

    if(res.data.status !== 0) throw new Error(`天气查询失败，状态码：${res.data.status}`)

    return res.data.result
}