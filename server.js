const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const opcionesCanal = {
  canal: ["NORMAL","ESTRECHO","ESTENOSIS_LEVE","ESTENOSIS_MODERADA","ESTENOSIS_SEVERA","AMPLIO"],
  cono: ["NORMAL","BAJO","ENGROSADO","ANCLADO","LESION"],
  nivelCono: ["D12-L1","L1","L1-L2","L2","L2-L3","L3"],
  localizacion: ["S1","S2","S3","S4","S1-S2","S2-S3","S3-S4","S1-S3","S2-S4"],
  lateralidad: ["DERECHA","IZQUIERDA","BILATERAL","CENTRAL"],
  severidad: ["LEVE","MODERADA","SEVERA"],
  nivelesTumor: ["D12-L1","L1","L1-L2","L2","L2-L3","L3","S1","S2","S3","S4"],
  localizacionTumor: ["INTRAMEDULAR","EXTRAMEDULAR_INTRADURAL","EXTRADURAL","CONO_MEDULAR","FILUM_TERMINALE","RAICES_COLA_CABALLO","SACRO"],
  tipoTumor: ["EPENDIMOMA","ASTROCITOMA","HEMANGIOBLASTOMA","SCHWANNOMA","MENINGIOMA","METASTASIS_EPIDURAL","LIPOMA_INTRADURAL","LESION_TUMORAL_INDETERMINADA"],
  realce: ["NO_ESPECIFICAR","HOMOGENEO","HETEROGENEO","PERIFERICO","NODULAR","SIN_REALCE"],
  edema: ["NO","LEVE","MODERADO","SEVERO"],
  efectoMasa: ["NO","LEVE","MODERADO","SEVERO"]
};

function limpiar(txt){
  return (txt || "")
    .replace(/\s+/g," ")
    .replace(/\s+,/g,",")
    .replace(/,\s*\./g,".")
    .replace(/\.\s*\./g,".")
    .trim();
}

function unir(lista){
  const l=(lista||[]).filter(Boolean);
  if(!l.length) return "";
  if(l.length===1) return l[0];
  return l.slice(0,-1).join(", ")+" y "+l[l.length-1];
}

function plural(lista){ return (lista||[]).length > 1; }

function nivelTxt(niveles, h={}){
  if(h.nivelInicio && h.nivelFinal){
    if(h.nivelInicio === h.nivelFinal) return h.nivelInicio;
    return `desde ${h.nivelInicio} hasta ${h.nivelFinal}`;
  }

  if(h.nivelInicio) return h.nivelInicio;

  const l=(Array.isArray(niveles)?niveles:[niveles]).filter(Boolean);
  if(!l.length) return "";
  return unir(l);
}

function medidasTxt(medidas){
  if(!medidas) return "";
  return `, con medidas aproximadas de ${medidas}`;
}

function canalBase(canal="NORMAL", severidad=""){
  if(canal==="ESTRECHO") return {
    descripcion:"Canal medular de calibre disminuido, con cono medular de morfología y señal conservadas.",
    diagnostico:"Canal medular estrecho."
  };
  if(canal==="ESTENOSIS_LEVE" || canal==="ESTENOSIS_MODERADA" || canal==="ESTENOSIS_SEVERA"){
    const g = canal==="ESTENOSIS_LEVE" ? "leve" : canal==="ESTENOSIS_MODERADA" ? "moderada" : "severa";
    return {
      descripcion:`Se aprecia disminución ${g} del calibre del canal medular lumbar, sin alteración evidente de la señal del cono medular.`,
      diagnostico:`Estenosis ${g} del canal medular lumbar.`
    };
  }
  if(canal==="AMPLIO") return {
    descripcion:"Canal medular de calibre amplio, sin signos de compresión del cono medular ni de las raíces de la cola de caballo.",
    diagnostico:"Canal medular amplio, sin signos compresivos."
  };
  return {
    descripcion:"Canal medular de dimensiones normales. El cono medular termina correctamente, sin alteración de su morfología ni de su señal.",
    diagnostico:""
  };
}

function topografiaTarlov(h){
  const inicio = h.nivelInicio || '';
  const fin = h.nivelFinal || '';

  const texto = `${inicio} ${fin}`;

  const tieneD = texto.includes('D');
  const tieneL = texto.includes('L');
  const tieneS = texto.includes('S');

  if(tieneL && tieneS) return 'en topografía lumbosacra';
  if(tieneS) return 'en topografía sacra';
  if(tieneL) return 'a nivel lumbar';
  if(tieneD) return 'a nivel dorsolumbar';

  return 'en el canal raquídeo';
}

function elegir(lista){
  return lista[Math.floor(Math.random()*lista.length)];
}

function textoLocTarlov(h){
  const loc = nivelTxt(h.niveles || h.localizacion, h);
  if(!loc) return "";

  if(loc.startsWith("desde ")) return loc;

  return `en ${loc}`;
}

function generarTarlov(h){
  const loc = nivelTxt(h.niveles || h.localizacion, h);
  const fraseLoc = textoLocTarlov(h);
  const topo = topografiaTarlov(h);
  const multi = h.tipo==="TARLOV_MULTIPLE";
  const lado = h.lateralidad ? ` de predominio ${h.lateralidad.toLowerCase()}` : "";
  const med = medidasTxt(h.medidas);

  if(multi){
    const descripciones = [
      `Se identifican quistes perineurales o de Tarlov ${topo} ${fraseLoc}${lado}, hiperintensos en T2 e hipointensos en T1, de bordes bien definidos${med}.`,
      `Se observan formaciones quísticas perineurales compatibles con quistes de Tarlov ${topo} ${fraseLoc}${lado}, de señal líquida, hiperintensas en T2 e hipointensas en T1${med}.`,
      `Apreciándose quistes perineurales de características compatibles con quistes de Tarlov ${topo} ${fraseLoc}${lado}, sin signos compresivos evidentes${med}.`,
      `Se reconocen imágenes quísticas perineurales ${topo} ${fraseLoc}${lado}, de bordes definidos y señal similar al líquido cefalorraquídeo, compatibles con quistes de Tarlov${med}.`
    ];

    const diagnosticos = [
      `Quistes perineurales o de Tarlov ${fraseLoc}.`,
      `Quistes de Tarlov ${fraseLoc}.`,
      `Quistes perineurales ${fraseLoc}.`
    ];

    return {
      descripcion: limpiar(elegir(descripciones)),
      diagnostico: limpiar(elegir(diagnosticos))
    };
  }

  const descripciones = [
    `Se identifica quiste perineural o de Tarlov ${topo} ${fraseLoc}${lado}, hiperintenso en T2 e hipointenso en T1, de bordes bien definidos${med}.`,
    `Se observa formación quística perineural compatible con quiste de Tarlov ${topo} ${fraseLoc}${lado}, de señal líquida, hiperintensa en T2 e hipointensa en T1${med}.`,
    `Apreciándose quiste perineural de características compatibles con quiste de Tarlov ${topo} ${fraseLoc}${lado}, sin signos compresivos evidentes${med}.`,
    `Se reconoce imagen quística perineural ${topo} ${fraseLoc}${lado}, de bordes definidos y señal similar al líquido cefalorraquídeo, compatible con quiste de Tarlov${med}.`
  ];

  const diagnosticos = [
    `Quiste perineural o de Tarlov ${fraseLoc}.`,
    `Quiste de Tarlov ${fraseLoc}.`,
    `Quiste perineural ${fraseLoc}.`
  ];

  return {
    descripcion: limpiar(elegir(descripciones)),
    diagnostico: limpiar(elegir(diagnosticos))
  };
}

function generarDisrafia(h){
  const loc = nivelTxt(h.niveles || h.localizacion) || "sacro";
  if(h.tipo==="MENINGOCELE"){
    return {
      descripcion: limpiar(`Se aprecia defecto de fusión de los elementos posteriores vertebrales a nivel ${loc}, asociado a protrusión de meninges y líquido cefalorraquídeo, sin identificar contenido neural evidente.`),
      diagnostico: limpiar(`Disrafia espinal oculta a nivel ${loc}, asociada a meningocele.`)
    };
  }
  if(h.tipo==="LIPOMA_FILUM"){
    return {
      descripcion: limpiar(`Se observa engrosamiento del filum terminale con señal hiperintensa en T1, compatible con infiltración grasa/lipoma del filum terminale.`),
      diagnostico:"Lipoma del filum terminale."
    };
  }
  return {
    descripcion: limpiar(`Se identifica defecto de fusión de los elementos posteriores vertebrales a nivel ${loc}, sin saco meníngeo evidente ni contenido neural protruyente.`),
    diagnostico: limpiar(`Disrafia espinal oculta a nivel ${loc}.`)
  };
}

function generarCono(h){
  const nivel = h.nivelCono || "L1-L2";
  if(h.tipo==="CONO_BAJO"){
    return {
      descripcion: limpiar(`El cono medular se proyecta bajo, alcanzando aproximadamente el nivel ${nivel}, sin alteración evidente de su señal.`),
      diagnostico: limpiar(`Cono medular bajo a nivel ${nivel}.`)
    };
  }
  if(h.tipo==="MEDULA_ANCLADA"){
    return {
      descripcion: limpiar(`El cono medular se observa bajo y discretamente engrosado, con aparente fijación posterior y continuidad con el filum terminale, hallazgos sugestivos de médula anclada.`),
      diagnostico:"Hallazgos sugestivos de médula anclada."
    };
  }
  if(h.tipo==="CONO_ENGROSADO"){
    return {
      descripcion: limpiar(`Cono medular de aspecto engrosado, sin clara lesión focal definida en las secuencias obtenidas.`),
      diagnostico:"Engrosamiento del cono medular."
    };
  }
  if(h.tipo==="LESION_CONO"){
    return {
      descripcion: limpiar(`Se identifica lesión focal de señal alterada dependiente del cono medular${h.medidas ? ", con medidas aproximadas de "+h.medidas : ""}, a correlacionar con estudio contrastado y contexto clínico.`),
      diagnostico:"Lesión focal del cono medular, a caracterizar."
    };
  }
  return {descripcion:"", diagnostico:""};
}

function generarSiringo(h){
  const nivel = nivelTxt(h.niveles) || "segmento evaluado";
  return {
    descripcion: limpiar(`Se aprecia cavidad lineal intramedular de señal líquida a nivel del ${nivel}, compatible con dilatación del canal ependimario/siringohidromielia${h.medidas ? ", midiendo aproximadamente "+h.medidas : ""}.`),
    diagnostico: limpiar(`Siringohidromielia a nivel del ${nivel}.`)
  };
}


function textoTipoTumor(tipo){
  const mapa={
    EPENDIMOMA:'ependimoma',
    ASTROCITOMA:'astrocitoma',
    HEMANGIOBLASTOMA:'hemangioblastoma',
    SCHWANNOMA:'schwannoma',
    MENINGIOMA:'meningioma',
    METASTASIS_EPIDURAL:'lesión metastásica epidural',
    LIPOMA_INTRADURAL:'lipoma intradural',
    LESION_TUMORAL_INDETERMINADA:'lesión tumoral de estirpe a determinar'
  };
  return mapa[tipo] || 'lesión tumoral de estirpe a determinar';
}

function textoLocalizacionTumor(loc){
  const mapa={
    INTRAMEDULAR:'intramedular',
    EXTRAMEDULAR_INTRADURAL:'extramedular intradural',
    EXTRADURAL:'extradural',
    CONO_MEDULAR:'dependiente del cono medular',
    FILUM_TERMINALE:'dependiente del filum terminale',
    RAICES_COLA_CABALLO:'en relación con las raíces de la cola de caballo',
    SACRO:'en topografía sacra'
  };
  return mapa[loc] || 'en el canal medular';
}

function textoRealce(realce){
  const mapa={
    HOMOGENEO:'con realce homogéneo tras la administración del medio de contraste',
    HETEROGENEO:'con realce heterogéneo tras la administración del medio de contraste',
    PERIFERICO:'con realce periférico tras la administración del medio de contraste',
    NODULAR:'con realce nodular tras la administración del medio de contraste',
    SIN_REALCE:'sin realce significativo tras la administración del medio de contraste'
  };
  return mapa[realce] || '';
}

function textoEdema(edema){
  if(!edema || edema==='NO') return 'sin edema medular evidente asociado';
  const g=edema.toLowerCase();
  return `con edema medular ${g} asociado`;
}

function textoEfectoMasa(efecto){
  if(!efecto || efecto==='NO') return 'sin efecto de masa significativo';
  const g=efecto.toLowerCase();
  return `condicionando efecto de masa ${g} sobre las estructuras neurales adyacentes`;
}

function generarTumor(h){
  const nivel=nivelTxt(h.niveles || h.nivel || h.localizacion) || 'el segmento evaluado';
  const tipo=textoTipoTumor(h.subtipoTumor || h.tipoTumor || h.tipo);
  const loc=textoLocalizacionTumor(h.localizacionTumor || h.localizacion);
  const med=h.medidas ? `, con medidas aproximadas de ${h.medidas}` : '';
  const realce=textoRealce(h.realce);
  const edema=textoEdema(h.edema);
  const efecto=textoEfectoMasa(h.efectoMasa);
  const siringo=h.siringomielia==='SI' ? ', asociada a cavidad siringomiélica/siringohidromielia' : '';
  const dxLoc = (h.localizacionTumor || h.localizacion) ? ` ${loc}` : '';

  if((h.subtipoTumor||h.tipo)==='METASTASIS_EPIDURAL'){
    return {
      descripcion: limpiar(`Se identifica tejido de aspecto infiltrativo en localización epidural a nivel de ${nivel}${med}, ${realce || 'con comportamiento a caracterizar con contraste'}, ${efecto}, en relación con probable compromiso metastásico epidural.`),
      diagnostico: limpiar(`Probable lesión metastásica epidural a nivel de ${nivel}${efecto && efecto!=='sin efecto de masa significativo' ? ', con efecto compresivo asociado' : ''}.`)
    };
  }

  if((h.subtipoTumor||h.tipo)==='SCHWANNOMA'){
    return {
      descripcion: limpiar(`Se observa lesión nodular ${loc} a nivel de ${nivel}${med}, de bordes definidos, ${realce || 'con realce variable'}, sugestiva de tumor de vaina nerviosa/schwannoma. ${efecto}.`),
      diagnostico: limpiar(`Lesión ${loc} a nivel de ${nivel}, sugestiva de schwannoma.`)
    };
  }

  if((h.subtipoTumor||h.tipo)==='MENINGIOMA'){
    return {
      descripcion: limpiar(`Se identifica lesión nodular de base dural en localización ${loc} a nivel de ${nivel}${med}, ${realce || 'con realce usualmente intenso'}, ${efecto}, sugestiva de meningioma.`),
      diagnostico: limpiar(`Lesión extramedular intradural a nivel de ${nivel}, sugestiva de meningioma.`)
    };
  }

  if((h.subtipoTumor||h.tipo)==='LIPOMA_INTRADURAL'){
    return {
      descripcion: limpiar(`Se aprecia lesión de señal grasa en localización ${loc} a nivel de ${nivel}${med}, hiperintensa en T1, compatible con lipoma intradural.`),
      diagnostico: limpiar(`Lipoma intradural a nivel de ${nivel}.`)
    };
  }

  return {
    descripcion: limpiar(`Se identifica lesión de aspecto tumoral ${loc} a nivel de ${nivel}${med}. ${realce ? realce + ', ' : ''}${edema}, ${efecto}${siringo}. Hallazgos a correlacionar con estudio contrastado y valoración especializada.`),
    diagnostico: limpiar(`Lesión tumoral ${dxLoc} a nivel de ${nivel}, a valorar ${tipo}.`)
  };
}

function generarItem(h){
  switch(h.tipo){
    case "TARLOV_UNICO":
    case "TARLOV_MULTIPLE": return generarTarlov(h);
    case "DISRAFIA_OCULTA":
    case "MENINGOCELE":
    case "LIPOMA_FILUM": return generarDisrafia(h);
    case "CONO_BAJO":
    case "MEDULA_ANCLADA":
    case "CONO_ENGROSADO":
    case "LESION_CONO": return generarCono(h);
    case "SIRINGOMIELIA": return generarSiringo(h);
    case "TUMOR_INTRAMEDULAR":
    case "TUMOR_EXTRAMEDULAR_INTRADURAL":
    case "TUMOR_EXTRADURAL":
    case "EPENDIMOMA":
    case "ASTROCITOMA":
    case "HEMANGIOBLASTOMA":
    case "SCHWANNOMA":
    case "MENINGIOMA":
    case "METASTASIS_EPIDURAL":
    case "LIPOMA_INTRADURAL":
    case "LESION_TUMORAL_INDETERMINADA": return generarTumor(h);
    default: return {descripcion:"", diagnostico:""};
  }
}

function generarCanal(payload){
  const canal = canalBase(payload.canal || "NORMAL", payload.severidad || "");
  const hallazgos = Array.isArray(payload.hallazgos) ? payload.hallazgos : [];
  const partesDesc = [];
  const partesDx = [];

  if(canal.descripcion) partesDesc.push(canal.descripcion);
  if(canal.diagnostico) partesDx.push(canal.diagnostico);

  hallazgos.forEach(h=>{
    const r = generarItem(h || {});
    if(r.descripcion) partesDesc.push(r.descripcion);
    if(r.diagnostico) partesDx.push(r.diagnostico);
  });

  return {
    descripcion: partesDesc.map(limpiar).filter(Boolean).join("\n"),
    diagnostico: partesDx.map(limpiar).filter(Boolean).join("\n"),
    opciones: opcionesCanal
  };
}

app.get("/", (req,res)=>res.json({ ok:true, motor:"canal-medular-irm", endpoints:["POST /generar-canal"] }));

app.post("/generar-canal", (req,res)=>{
  try{
    res.json(generarCanal(req.body || {}));
  }catch(err){
    res.status(500).json({ error:"Error generando canal medular", detalle:err.message });
  }
});

app.listen(PORT, ()=>console.log(`Motor canal medular activo en puerto ${PORT}`));

module.exports = { generarCanal };
  if(l.length===1) return l[0];
  return l.slice(0,-1).join(", ")+" y "+l[l.length-1];
}

function plural(lista){ return (lista||[]).length > 1; }

function nivelTxt(niveles, h={}){
  if(h.nivelInicio && h.nivelFinal){
    if(h.nivelInicio === h.nivelFinal) return h.nivelInicio;
    return `desde ${h.nivelInicio} hasta ${h.nivelFinal}`;
  }

  if(h.nivelInicio) return h.nivelInicio;

  const l=(Array.isArray(niveles)?niveles:[niveles]).filter(Boolean);
  if(!l.length) return "";
  return unir(l);
}

function medidasTxt(medidas){
  if(!medidas) return "";
  return `, con medidas aproximadas de ${medidas}`;
}

function canalBase(canal="NORMAL", severidad=""){
  if(canal==="ESTRECHO") return {
    descripcion:"Canal medular de calibre disminuido, con cono medular de morfología y señal conservadas.",
    diagnostico:"Canal medular estrecho."
  };
  if(canal==="ESTENOSIS_LEVE" || canal==="ESTENOSIS_MODERADA" || canal==="ESTENOSIS_SEVERA"){
    const g = canal==="ESTENOSIS_LEVE" ? "leve" : canal==="ESTENOSIS_MODERADA" ? "moderada" : "severa";
    return {
      descripcion:`Se aprecia disminución ${g} del calibre del canal medular lumbar, sin alteración evidente de la señal del cono medular.`,
      diagnostico:`Estenosis ${g} del canal medular lumbar.`
    };
  }
  if(canal==="AMPLIO") return {
    descripcion:"Canal medular de calibre amplio, sin signos de compresión del cono medular ni de las raíces de la cola de caballo.",
    diagnostico:"Canal medular amplio, sin signos compresivos."
  };
  return {
    descripcion:"Canal medular de dimensiones normales. El cono medular termina correctamente, sin alteración de su morfología ni de su señal.",
    diagnostico:""
  };
}

function topografiaTarlov(h){
  const inicio = h.nivelInicio || '';
  const fin = h.nivelFinal || '';

  const texto = `${inicio} ${fin}`;

  const tieneD = texto.includes('D');
  const tieneL = texto.includes('L');
  const tieneS = texto.includes('S');

  if(tieneL && tieneS) return 'en topografía lumbosacra';
  if(tieneS) return 'en topografía sacra';
  if(tieneL) return 'a nivel lumbar';
  if(tieneD) return 'a nivel dorsolumbar';

  return 'en el canal raquídeo';
}

function elegir(lista){
  return lista[Math.floor(Math.random()*lista.length)];
}

function textoLocTarlov(h){
  const loc = nivelTxt(h.niveles || h.localizacion, h);
  if(!loc) return "";

  if(loc.startsWith("desde ")) return loc;

  return `en ${loc}`;
}

function generarTarlov(h){
  const loc = nivelTxt(h.niveles || h.localizacion, h);
  const fraseLoc = textoLocTarlov(h);
  const topo = topografiaTarlov(h);
  const multi = h.tipo==="TARLOV_MULTIPLE" || plural(h.niveles);
  const lado = h.lateralidad ? ` de predominio ${h.lateralidad.toLowerCase()}` : "";
  const med = medidasTxt(h.medidas);

  if(multi){
    const descripciones = [
      `Se identifican quistes perineurales o de Tarlov ${topo} ${fraseLoc}${lado}, hiperintensos en T2 e hipointensos en T1, de bordes bien definidos${med}.`,
      `Se observan formaciones quísticas perineurales compatibles con quistes de Tarlov ${topo} ${fraseLoc}${lado}, de señal líquida, hiperintensas en T2 e hipointensas en T1${med}.`,
      `Apreciándose quistes perineurales de características compatibles con quistes de Tarlov ${topo} ${fraseLoc}${lado}, sin signos compresivos evidentes${med}.`,
      `Se reconocen imágenes quísticas perineurales ${topo} ${fraseLoc}${lado}, de bordes definidos y señal similar al líquido cefalorraquídeo, compatibles con quistes de Tarlov${med}.`
    ];

    const diagnosticos = [
      `Quistes perineurales o de Tarlov ${fraseLoc}.`,
      `Quistes de Tarlov ${fraseLoc}.`,
      `Quistes perineurales ${fraseLoc}.`
    ];

    return {
      descripcion: limpiar(elegir(descripciones)),
      diagnostico: limpiar(elegir(diagnosticos))
    };
  }

  const descripciones = [
    `Se identifica quiste perineural o de Tarlov ${topo} ${fraseLoc}${lado}, hiperintenso en T2 e hipointenso en T1, de bordes bien definidos${med}.`,
    `Se observa formación quística perineural compatible con quiste de Tarlov ${topo} ${fraseLoc}${lado}, de señal líquida, hiperintensa en T2 e hipointensa en T1${med}.`,
    `Apreciándose quiste perineural de características compatibles con quiste de Tarlov ${topo} ${fraseLoc}${lado}, sin signos compresivos evidentes${med}.`,
    `Se reconoce imagen quística perineural ${topo} ${fraseLoc}${lado}, de bordes definidos y señal similar al líquido cefalorraquídeo, compatible con quiste de Tarlov${med}.`
  ];

  const diagnosticos = [
    `Quiste perineural o de Tarlov ${fraseLoc}.`,
    `Quiste de Tarlov ${fraseLoc}.`,
    `Quiste perineural ${fraseLoc}.`
  ];

  return {
    descripcion: limpiar(elegir(descripciones)),
    diagnostico: limpiar(elegir(diagnosticos))
  };
}

function generarDisrafia(h){
  const loc = nivelTxt(h.niveles || h.localizacion) || "sacro";
  if(h.tipo==="MENINGOCELE"){
    return {
      descripcion: limpiar(`Se aprecia defecto de fusión de los elementos posteriores vertebrales a nivel ${loc}, asociado a protrusión de meninges y líquido cefalorraquídeo, sin identificar contenido neural evidente.`),
      diagnostico: limpiar(`Disrafia espinal oculta a nivel ${loc}, asociada a meningocele.`)
    };
  }
  if(h.tipo==="LIPOMA_FILUM"){
    return {
      descripcion: limpiar(`Se observa engrosamiento del filum terminale con señal hiperintensa en T1, compatible con infiltración grasa/lipoma del filum terminale.`),
      diagnostico:"Lipoma del filum terminale."
    };
  }
  return {
    descripcion: limpiar(`Se identifica defecto de fusión de los elementos posteriores vertebrales a nivel ${loc}, sin saco meníngeo evidente ni contenido neural protruyente.`),
    diagnostico: limpiar(`Disrafia espinal oculta a nivel ${loc}.`)
  };
}

function generarCono(h){
  const nivel = h.nivelCono || "L1-L2";
  if(h.tipo==="CONO_BAJO"){
    return {
      descripcion: limpiar(`El cono medular se proyecta bajo, alcanzando aproximadamente el nivel ${nivel}, sin alteración evidente de su señal.`),
      diagnostico: limpiar(`Cono medular bajo a nivel ${nivel}.`)
    };
  }
  if(h.tipo==="MEDULA_ANCLADA"){
    return {
      descripcion: limpiar(`El cono medular se observa bajo y discretamente engrosado, con aparente fijación posterior y continuidad con el filum terminale, hallazgos sugestivos de médula anclada.`),
      diagnostico:"Hallazgos sugestivos de médula anclada."
    };
  }
  if(h.tipo==="CONO_ENGROSADO"){
    return {
      descripcion: limpiar(`Cono medular de aspecto engrosado, sin clara lesión focal definida en las secuencias obtenidas.`),
      diagnostico:"Engrosamiento del cono medular."
    };
  }
  if(h.tipo==="LESION_CONO"){
    return {
      descripcion: limpiar(`Se identifica lesión focal de señal alterada dependiente del cono medular${h.medidas ? ", con medidas aproximadas de "+h.medidas : ""}, a correlacionar con estudio contrastado y contexto clínico.`),
      diagnostico:"Lesión focal del cono medular, a caracterizar."
    };
  }
  return {descripcion:"", diagnostico:""};
}

function generarSiringo(h){
  const nivel = nivelTxt(h.niveles) || "segmento evaluado";
  return {
    descripcion: limpiar(`Se aprecia cavidad lineal intramedular de señal líquida a nivel del ${nivel}, compatible con dilatación del canal ependimario/siringohidromielia${h.medidas ? ", midiendo aproximadamente "+h.medidas : ""}.`),
    diagnostico: limpiar(`Siringohidromielia a nivel del ${nivel}.`)
  };
}


function textoTipoTumor(tipo){
  const mapa={
    EPENDIMOMA:'ependimoma',
    ASTROCITOMA:'astrocitoma',
    HEMANGIOBLASTOMA:'hemangioblastoma',
    SCHWANNOMA:'schwannoma',
    MENINGIOMA:'meningioma',
    METASTASIS_EPIDURAL:'lesión metastásica epidural',
    LIPOMA_INTRADURAL:'lipoma intradural',
    LESION_TUMORAL_INDETERMINADA:'lesión tumoral de estirpe a determinar'
  };
  return mapa[tipo] || 'lesión tumoral de estirpe a determinar';
}

function textoLocalizacionTumor(loc){
  const mapa={
    INTRAMEDULAR:'intramedular',
    EXTRAMEDULAR_INTRADURAL:'extramedular intradural',
    EXTRADURAL:'extradural',
    CONO_MEDULAR:'dependiente del cono medular',
    FILUM_TERMINALE:'dependiente del filum terminale',
    RAICES_COLA_CABALLO:'en relación con las raíces de la cola de caballo',
    SACRO:'en topografía sacra'
  };
  return mapa[loc] || 'en el canal medular';
}

function textoRealce(realce){
  const mapa={
    HOMOGENEO:'con realce homogéneo tras la administración del medio de contraste',
    HETEROGENEO:'con realce heterogéneo tras la administración del medio de contraste',
    PERIFERICO:'con realce periférico tras la administración del medio de contraste',
    NODULAR:'con realce nodular tras la administración del medio de contraste',
    SIN_REALCE:'sin realce significativo tras la administración del medio de contraste'
  };
  return mapa[realce] || '';
}

function textoEdema(edema){
  if(!edema || edema==='NO') return 'sin edema medular evidente asociado';
  const g=edema.toLowerCase();
  return `con edema medular ${g} asociado`;
}

function textoEfectoMasa(efecto){
  if(!efecto || efecto==='NO') return 'sin efecto de masa significativo';
  const g=efecto.toLowerCase();
  return `condicionando efecto de masa ${g} sobre las estructuras neurales adyacentes`;
}

function generarTumor(h){
  const nivel=nivelTxt(h.niveles || h.nivel || h.localizacion) || 'el segmento evaluado';
  const tipo=textoTipoTumor(h.subtipoTumor || h.tipoTumor || h.tipo);
  const loc=textoLocalizacionTumor(h.localizacionTumor || h.localizacion);
  const med=h.medidas ? `, con medidas aproximadas de ${h.medidas}` : '';
  const realce=textoRealce(h.realce);
  const edema=textoEdema(h.edema);
  const efecto=textoEfectoMasa(h.efectoMasa);
  const siringo=h.siringomielia==='SI' ? ', asociada a cavidad siringomiélica/siringohidromielia' : '';
  const dxLoc = (h.localizacionTumor || h.localizacion) ? ` ${loc}` : '';

  if((h.subtipoTumor||h.tipo)==='METASTASIS_EPIDURAL'){
    return {
      descripcion: limpiar(`Se identifica tejido de aspecto infiltrativo en localización epidural a nivel de ${nivel}${med}, ${realce || 'con comportamiento a caracterizar con contraste'}, ${efecto}, en relación con probable compromiso metastásico epidural.`),
      diagnostico: limpiar(`Probable lesión metastásica epidural a nivel de ${nivel}${efecto && efecto!=='sin efecto de masa significativo' ? ', con efecto compresivo asociado' : ''}.`)
    };
  }

  if((h.subtipoTumor||h.tipo)==='SCHWANNOMA'){
    return {
      descripcion: limpiar(`Se observa lesión nodular ${loc} a nivel de ${nivel}${med}, de bordes definidos, ${realce || 'con realce variable'}, sugestiva de tumor de vaina nerviosa/schwannoma. ${efecto}.`),
      diagnostico: limpiar(`Lesión ${loc} a nivel de ${nivel}, sugestiva de schwannoma.`)
    };
  }

  if((h.subtipoTumor||h.tipo)==='MENINGIOMA'){
    return {
      descripcion: limpiar(`Se identifica lesión nodular de base dural en localización ${loc} a nivel de ${nivel}${med}, ${realce || 'con realce usualmente intenso'}, ${efecto}, sugestiva de meningioma.`),
      diagnostico: limpiar(`Lesión extramedular intradural a nivel de ${nivel}, sugestiva de meningioma.`)
    };
  }

  if((h.subtipoTumor||h.tipo)==='LIPOMA_INTRADURAL'){
    return {
      descripcion: limpiar(`Se aprecia lesión de señal grasa en localización ${loc} a nivel de ${nivel}${med}, hiperintensa en T1, compatible con lipoma intradural.`),
      diagnostico: limpiar(`Lipoma intradural a nivel de ${nivel}.`)
    };
  }

  return {
    descripcion: limpiar(`Se identifica lesión de aspecto tumoral ${loc} a nivel de ${nivel}${med}. ${realce ? realce + ', ' : ''}${edema}, ${efecto}${siringo}. Hallazgos a correlacionar con estudio contrastado y valoración especializada.`),
    diagnostico: limpiar(`Lesión tumoral ${dxLoc} a nivel de ${nivel}, a valorar ${tipo}.`)
  };
}

function generarItem(h){
  switch(h.tipo){
    case "TARLOV_UNICO":
    case "TARLOV_MULTIPLE": return generarTarlov(h);
    case "DISRAFIA_OCULTA":
    case "MENINGOCELE":
    case "LIPOMA_FILUM": return generarDisrafia(h);
    case "CONO_BAJO":
    case "MEDULA_ANCLADA":
    case "CONO_ENGROSADO":
    case "LESION_CONO": return generarCono(h);
    case "SIRINGOMIELIA": return generarSiringo(h);
    case "TUMOR_INTRAMEDULAR":
    case "TUMOR_EXTRAMEDULAR_INTRADURAL":
    case "TUMOR_EXTRADURAL":
    case "EPENDIMOMA":
    case "ASTROCITOMA":
    case "HEMANGIOBLASTOMA":
    case "SCHWANNOMA":
    case "MENINGIOMA":
    case "METASTASIS_EPIDURAL":
    case "LIPOMA_INTRADURAL":
    case "LESION_TUMORAL_INDETERMINADA": return generarTumor(h);
    default: return {descripcion:"", diagnostico:""};
  }
}

function generarCanal(payload){
  const canal = canalBase(payload.canal || "NORMAL", payload.severidad || "");
  const hallazgos = Array.isArray(payload.hallazgos) ? payload.hallazgos : [];
  const partesDesc = [];
  const partesDx = [];

  if(canal.descripcion) partesDesc.push(canal.descripcion);
  if(canal.diagnostico) partesDx.push(canal.diagnostico);

  hallazgos.forEach(h=>{
    const r = generarItem(h || {});
    if(r.descripcion) partesDesc.push(r.descripcion);
    if(r.diagnostico) partesDx.push(r.diagnostico);
  });

  return {
    descripcion: partesDesc.map(limpiar).filter(Boolean).join("\n"),
    diagnostico: partesDx.map(limpiar).filter(Boolean).join("\n"),
    opciones: opcionesCanal
  };
}

app.get("/", (req,res)=>res.json({ ok:true, motor:"canal-medular-irm", endpoints:["POST /generar-canal"] }));

app.post("/generar-canal", (req,res)=>{
  try{
    res.json(generarCanal(req.body || {}));
  }catch(err){
    res.status(500).json({ error:"Error generando canal medular", detalle:err.message });
  }
});

app.listen(PORT, ()=>console.log(`Motor canal medular activo en puerto ${PORT}`));

module.exports = { generarCanal };
