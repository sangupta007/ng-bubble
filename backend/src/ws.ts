import {IWSData} from "../interfaces";


export function sendData(ws:any, data:IWSData) {
  let parsedData = '';
  try {
    parsedData = JSON.stringify(data)
  }catch (e) {
    
  }
  ws.send(parsedData);
}