export const properties = [
  { id:'A01', name:'Casa Olivo', lot:'01', area:142, land:180, price:3180000, score:87, change:6.0, x:12, y:12, tone:'olive', description:'Casa de dos niveles con patio interior y orientación sur.' },
  { id:'A02', name:'Casa Jacaranda', lot:'02', area:156, land:194, price:3460000, score:82, change:4.8, x:54, y:12, tone:'violet', description:'Estancia abierta, estudio y jardín lateral.' },
  { id:'B01', name:'Casa Encino', lot:'03', area:181, land:218, price:4210000, score:90, change:7.1, x:12, y:55, tone:'sand', description:'Tres recámaras, terraza y ventilación cruzada.' },
  { id:'B02', name:'Casa Fresno', lot:'04', area:133, land:172, price:2990000, score:78, change:3.6, x:54, y:55, tone:'blue', description:'Distribución compacta con terraza privada.' },
  { id:'C01', name:'Casa Laurel', lot:'05', area:167, land:202, price:3780000, score:85, change:5.4, x:33, y:34, tone:'rose', description:'Sala de doble altura y patio arbolado.' }
];
export const mxn = n => new Intl.NumberFormat('es-MX', {style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
