const WIALON_BASE = 'https://hst-api.wialon.com/wialon/ajax.html';

// En desarrollo usa el proxy de Vite. En producción usa la serverless function de Vercel.
async function wialonRequest(svc, params, sid) {
  if (import.meta.env.DEV) {
    const qs = `?svc=${svc}&params=${encodeURIComponent(JSON.stringify(params))}${sid ? `&sid=${sid}` : ''}`;
    const res = await fetch(`/wialon-proxy${qs}`);
    return res.json();
  } else {
    // En producción: usar el proxy serverless /api/wialon
    const res = await fetch('/api/wialon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token || null, svc, params, sid }),
    });
    return res.json();
  }
}

export async function fetchWialonUnits(token) {
  if (import.meta.env.DEV) {
    // Desarrollo: llamadas directas via proxy Vite
    const loginRes = await fetch(
      `/wialon-proxy?svc=token/login&params=${encodeURIComponent(JSON.stringify({ token }))}`
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
      const searchParams = {
        spec: { itemsType: 'avl_unit', propName: 'sys_name', propValueMask: '*', sortType: 'sys_name' },
        force: 1,
        flags: 1025,
        from: 0,
        to: 0,
      };

      const searchRes = await fetch(
        `/wialon-proxy?svc=core/search_items&params=${encodeURIComponent(JSON.stringify(searchParams))}&sid=${sid}`
      );
      const searchData = await searchRes.json();

      if (searchData.error) throw new Error(`Error al obtener unidades: ${searchData.error}`);
      return parseUnits(searchData.items || []);
    } finally {
      await fetch(`/wialon-proxy?svc=core/logout&params={}&sid=${sid}`).catch(() => {});
    }
  } else {
    // Producción: una sola llamada al proxy serverless
    const res = await fetch('/api/wialon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al conectar con Wialon');
    return data.units || [];
  }
}

function parseUnits(items) {
  return items.map((unit) => {
    let mileage_km = null;
    if (unit.cnm != null && unit.cnm > 0) {
      mileage_km = Math.round(unit.cnm / 1000);
    } else if (unit.pos && unit.pos.lc != null && unit.pos.lc > 0) {
      mileage_km = Math.round(unit.pos.lc / 1000);
    } else if (unit.cntrs && unit.cntrs.mileage != null) {
      mileage_km = Math.round(unit.cntrs.mileage / 1000);
    }
    return { id: unit.id, name: unit.nm, mileage_km, raw: unit };
  });
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
