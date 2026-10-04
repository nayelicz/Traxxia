import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { properties } from '../src/data.js';

const port = Number(process.env.PORT || 8787);
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
const cache = new Map();
const send = (res, code, body) => { res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', 'Access-Control-Allow-Origin':allowedOrigin, 'Access-Control-Allow-Methods':'GET, OPTIONS', 'Cache-Control':'no-store' }); res.end(JSON.stringify(body)); };
const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n)));
async function evaluate(p){
  const timestamp = new Date().toISOString();
  const key = process.env.GEMINI_API_KEY;
  let result, mode = 'demo', sources = [{title:'Datos ficticios incluidos en el MVP'}];
  if(key){
    const prompt = `Analiza SOLO como ejercicio ilustrativo esta vivienda FICTICIA de un fraccionamiento sin ubicación real. No inventes avalúos, ventas comparables, precios locales, datos censales ni fuentes. Si no puedes verificar datos actuales y una ubicación, explica claramente esa limitación. Devuelve únicamente JSON con score entero 0..100, confidence entero 0..100, valuationMxn entero positivo y summary breve en español. Valor inicial hipotético: ${p.price} MXN; superficie: ${p.area} m2; terreno: ${p.land} m2. Identificador: ${p.id}. Si no hay datos suficientes, mantén el valor de referencia y limita confidence a 30.`;
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],tools:[{google_search:{}}],generationConfig:{temperature:0.1,responseMimeType:'application/json'}})});
    if(!response.ok)throw Error(`Gemini HTTP ${response.status}`);
    const payload=await response.json();
    const raw=payload.candidates?.[0]?.content?.parts?.map(part=>part.text||'').join('')||'';
    let parsed;try{parsed=JSON.parse(raw)}catch{throw Error('Gemini no devolvió JSON válido')}
    result={score:Math.round(clamp(parsed.score,0,100)),confidence:Math.round(clamp(parsed.confidence,0,30)),valuationMxn:Math.round(clamp(parsed.valuationMxn,p.price*.5,p.price*1.5)),summary:String(parsed.summary||'Datos insuficientes para estimar un valor de mercado.').slice(0,600)};
    sources=(payload.candidates?.[0]?.groundingMetadata?.groundingChunks||[]).map(c=>c.web).filter(Boolean).slice(0,8).map(w=>({title:w.title||'Fuente consultada',url:w.uri}));
    if(!sources.length)sources=[{title:'Sin fuentes verificables para esta propiedad ficticia'}];
    mode='live';
  }else result={score:p.score,confidence:0,valuationMxn:p.price,summary:'Ejemplo ilustrativo: el inmueble y sus indicadores son ficticios. Configura Gemini y una propiedad con ubicación y fuentes reales para analizar el mercado.'};
  const record={propertyId:p.id,...result,sources,timestamp,mode};
  return {...record,hash:createHash('sha256').update(JSON.stringify(record)).digest('hex')};
}
createServer(async(req,res)=>{
  if(req.method==='OPTIONS'){send(res,204,{});return}
  const match=req.method==='GET' && /^\/api\/analyze\/(A01|A02|B01|B02|C01)$/.exec(new URL(req.url,'http://localhost').pathname);
  if(!match){send(res,404,{error:'Ruta no disponible'});return}
  const p=properties.find(x=>x.id===match[1]);
  try{const old=cache.get(p.id);const record=old && Date.now()-old.at<300000 ? old.record : await evaluate(p);cache.set(p.id,{at:Date.now(),record});send(res,200,record)}catch(e){console.error('Analysis failed:',e.message);send(res,502,{error:'No se pudo completar el análisis. Comprueba la clave y la disponibilidad de Gemini.'})}
}).listen(port,()=>console.log(`Traccia API listening on ${port}`));
