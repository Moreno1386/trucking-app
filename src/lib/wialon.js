// En desarrollo usa el proxy de Vite para evitar CORS. En producción llama directo.
const BASE_URL = import.meta.env.DEV
  ? '/wialon-proxy'
  : 'https://hst-api.wialon.com/wialon/ajax.html';

export async function fetchWialonUnits(token) {
  // 1. Login
  const loginRes = await fetch(
    `${BASE_URL}?svc=token/login&params=${encodeURIComponent(JSON.stringify({ token }))}`
  );
  const loginData = await loginRes.json();

  if (loginData.error || !loginData.eid) {
    const msg = loginData.error === 1 ? 'Token inválido' :
                loginData.error === 4 ? 'Token expirado o sin acceso' :
                `Error Wialon: ${loginData.error}`;
    throw new Error(msg);
  }

  const sid = loginData.eid;

  try {
    // 2. Buscar unidades (flags 257 = base + contadores)
    const searchParams = {
      spec: {
        itemsType: 'avl_unit',
        propName: 'sys_name',
        propValueMask: '*',
        sortType: 'sys_name',
      },
      force: 1,
      flags: 1025,
      from: 0,
      to: 0,
    };

    const searchRes = await fetch(
      `${BASE_URL}?svc=core/search_items&params=${encodeURIComponent(JSON.stringify(searchParams))}&sid=${sid}`
    );
    const searchData = await searchRes.json();

    if (searchData.error) throw new Error(`Error al obtener unidades: ${searchData.error}`);

    return (searchData.items || []).map((unit) => {
      // Wialon puede devolver el odómetro en cnm (metros) o pos.x/y
      // También puede estar en los counters (cntrs) o en last message
      let mileage_km = null;

      if (unit.cnm != null && unit.cnm > 0) {
        mileage_km = Math.round(unit.cnm / 1000);
      } else if (unit.pos && unit.pos.lc != null && unit.pos.lc > 0) {
        mileage_km = Math.round(unit.pos.lc / 1000);
      } else if (unit.cntrs && unit.cntrs.mileage != null) {
        mileage_km = Math.round(unit.cntrs.mileage / 1000);
      }

      return {
        id: unit.id,
        name: unit.nm,
        mileage_km,
        raw: unit, // guardamos el objeto completo para debug
      };
    });
  } finally {
    // 3. Logout
    await fetch(`${BASE_URL}?svc=core/logout&params={}&sid=${sid}`).catch(() => {});
  }
}

export function saveWialonToken(token) {
  localStorage.setItem('wialon_token', token);
}

export function getWialonToken() {
  return localStorage.getItem('wialon_token') || '';
}

export function saveWialonMapping(mapping) {
  localStorage.setItem('wialon_mapping', JSON.stringify(mapping));
}

export function getWialonMapping() {
  try {
    return JSON.parse(localStorage.getItem('wialon_mapping') || '{}');
  } catch {
    return {};
  }
}
