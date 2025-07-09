import axios from 'axios'
import { GEOCODE_API } from '../config/api.js'
import {env} from '../config/env.js'

export interface GeocodeResult {
    lng:number,
    lat:number
}

export async function geoCode({address,city}:{address:string,city?:string}):Promise<GeocodeResult> {
    const params = {
        address,
        output: GEOCODE_API.output,
        ak: env.BAIDU_MAP_API_KEY,
        ...(city && {city})
    }
    const res = await axios.get(GEOCODE_API.baseUrl,{params})
    if (res.data.status !== 0) {
        throw new Error(`地理编码失败，状态码：${res.data.status}`)
    }
    return {
        lng: res.data.result.location.lng,
        lat: res.data.result.location.lat
    }
}