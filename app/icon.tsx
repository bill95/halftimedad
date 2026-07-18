import {ImageResponse} from "next/og";
export const size={width:64,height:64};export const contentType="image/png";
export default function Icon(){return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",background:"#153c2f",color:"#d8ed78",fontSize:34,fontWeight:900}}>H</div>,size)}
