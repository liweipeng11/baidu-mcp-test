import axios from 'axios'
import { GEOCODE_API } from '../config/api.js'

export interface GeocodeResult {
    lng:number,
    lat:number
}

export async function geoCode({address,city,ak}:{address:string,city?:string,ak:string}):Promise<GeocodeResult> {
    const params = {
        address,
        output: GEOCODE_API.output,
        ak,
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