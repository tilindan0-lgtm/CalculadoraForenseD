function $(id) { return document.getElementById(id); }

function toNum(id) {
  const v = parseFloat($(id).value);
  if (Number.isNaN(v)) throw new Error(`El campo ${id} está vacío o no es número.`);
  return v;
}

function calcularHoraDeMuerte(horaHallazgo, tiempoDesdeMuerte) {
  const [hora, minutos] = horaHallazgo.split(":").map(Number);
  let totalMinutos = hora * 60 + minutos - tiempoDesdeMuerte;

  // Ajustamos si el tiempo es negativo (es decir, si ocurrió antes de la hora de hallazgo)
  if (totalMinutos < 0) {
    totalMinutos += 24 * 60; // Ajustamos por el día anterior
  }

  // Calculamos la hora exacta de la muerte (en formato HH:mm)
  const horaMuerte = Math.floor(totalMinutos / 60);
  const minutoMuerte = Math.round(totalMinutos % 60);  // Redondeamos los minutos

  // Convertir a formato AM/PM
  const amPm = horaMuerte >= 12 ? 'PM' : 'AM';
  let horaFormato12 = horaMuerte % 12;
  if (horaFormato12 === 0) horaFormato12 = 12; // Para que muestre 12 en lugar de 0

  return { horaMuerte, minutoMuerte, horaFormato12, minutoMuerte, amPm };
}

function calcularNewton(Ta, T0, t1, T1, t2, T2, horaHallazgo) {
  if (Math.abs(T1 - Ta) < 1e-12) throw new Error("T1 no puede ser igual a Ta.");
  if (Math.abs(T2 - Ta) < 1e-12) throw new Error("T2 no puede ser igual a Ta.");
  if (Math.abs(T0 - Ta) < 1e-12) throw new Error("T0 no puede ser igual a Ta.");
  if (Math.abs(t2 - t1) < 1e-12) throw new Error("t2 debe ser diferente a t1.");

  const dt = (t2 - t1);

  // C = T1 - Ta (usando el ajuste de tiempo para que t1 sea el origen)
  const C = (T1 - Ta);

  // k = -(1/dt) ln((T2 - Ta)/C)
  const ratio = (T2 - Ta) / C;
  if (ratio <= 0) throw new Error("Datos inconsistentes para calcular k.");
  const lnRatio = Math.log(ratio);
  const k = -(1 / dt) * lnRatio;
  if (k <= 0) throw new Error("k salió <= 0. Revisa los datos.");

  // t0 = - ln((T0 - Ta)/C) / k
  const ratio0 = (T0 - Ta) / C;
  if (ratio0 <= 0) throw new Error("Datos inconsistentes para calcular t0.");
  const lnRatio0 = Math.log(ratio0);
  const t0 = -(lnRatio0 / k);
  const tiempoDesdeMuerte = Math.abs(t0);

  // Calcular la hora de muerte a partir de la hora del hallazgo
  const { horaFormato12, minutoMuerte, amPm } = calcularHoraDeMuerte(horaHallazgo, tiempoDesdeMuerte);

  const procedimiento =
`1) Ecuación diferencial:
   dT/dt = -k(T - Ta)

2) Separación e integración:
   ∫ dT/(T - Ta) = ∫ -k dt
   ln|T - Ta| = -k t + C
   T - Ta = C e^(-k t)
   T(t) = Ta + C e^(-k t)

3) Condición en t1:
   T1 = Ta + C e^0
   C = T1 - Ta = ${T1} - ${Ta} = ${C}

4) Condición en t2:
   T2 - Ta = C e^(-k·(t2 - t1))
   e^(-k·${dt}) = (T2 - Ta)/C = ${ratio}
   -k·${dt} = ln(${ratio}) = ${lnRatio}
   k = -ln(${ratio})/${dt} = ${k}

5) Temperatura al morir (T0):
   T0 - Ta = C e^(-k·t0)
   e^(-k·t0) = (T0 - Ta)/C = ${ratio0}
   -k·t0 = ln(${ratio0}) = ${lnRatio0}
   t0 = -ln(${ratio0})/k = ${t0}

Tiempo desde la muerte hasta t1:
|t0| = ${tiempoDesdeMuerte} min

Hora estimada de muerte: ${horaFormato12}:${minutoMuerte < 10 ? '0' + minutoMuerte : minutoMuerte} ${amPm}`;

  return { k, t0, tiempoDesdeMuerte, procedimiento, horaFormato12, minutoMuerte, amPm };
}

function formato(n, dec = 2) {
  return Number(n).toFixed(dec); // Redondear a 2 decimales
}

$("btnCalcular").addEventListener("click", () => {
  try {
    const Ta = toNum("Ta");
    const T0 = toNum("T0");
    const t1 = toNum("t1");
    const T1 = toNum("T1");
    const t2 = toNum("t2");
    const T2 = toNum("T2");
    const horaHallazgo = $("horaHallazgo").value;

    const r = calcularNewton(Ta, T0, t1, T1, t2, T2, horaHallazgo);

    $("kOut").textContent = formato(r.k, 6);
    $("tMuerteOut").textContent = formato(r.tiempoDesdeMuerte, 2);
    $("t0Out").textContent = formato(r.t0, 2);
    
    // Mostrar la hora de muerte en los resultados (redondeada a 2 decimales)
    $("horaMuerteOut").textContent = `${r.horaFormato12}:${r.minutoMuerte < 10 ? '0' + r.minutoMuerte : r.minutoMuerte} ${r.amPm}`;

    // Mostrar el procedimiento
    $("pasosOut").textContent = r.procedimiento;

    $("result").scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    alert(err.message);
  }
});

$("btnLimpiar").addEventListener("click", () => {
  ["Ta", "T0", "t1", "T1", "t2", "T2", "horaHallazgo"].forEach(id => $(id).value = "");
  $("kOut").textContent = "—";
  $("tMuerteOut").textContent = "—";
  $("t0Out").textContent = "—";
  $("horaMuerteOut").textContent = "—";
  $("pasosOut").textContent = "—";
});
