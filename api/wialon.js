const BASE_URL = 'https://hst-api.wialon.com/wialon/ajax.html';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Token requerido' });

  let sid = null;

  try {
    // 1. Login con token
    const loginRes = await fetch(
      `${BASE_URL}?svc=token/login&params=${encodeURIComponent(JSON.stringify({ token }))}`,
      { method: 'POST' }
    );
    const loginData = await loginRes.json();

    if (loginData.error || !loginData.eid) {
      const msg = loginData.error === 1 ? 'Token inválido' :
                  loginData.error === 4 ? 'Token expirado o sin acceso' :
                  `Error Wialon: ${loginData.error}`;
      return res.status(401).json({ error: msg });
    }

    sid = loginData.eid;

    // 2. Buscar todas las unidades con km (flags: 1=base, 256=contadores)
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
      `${BASE_URL}?svc=core/search_items&params=${encodeURIComponent(JSON.stringify(searchParams))}&sid=${sid}`,
      { method: 'POST' }
    );
    const searchData = await searchRes.json();

    if (searchData.error) {
      return res.status(400).json({ error: `Error al obtener unidades: ${searchData.error}` });
    }

    const units = (searchData.items || []).map((unit) => {
      let mileage_km = null;
      if (unit.cnm != null && unit.cnm > 0) {
        mileage_km = Math.round(unit.cnm / 1000);
      } else if (unit.pos && unit.pos.lc != null && unit.pos.lc > 0) {
        mileage_km = Math.round(unit.pos.lc / 1000);
      } else if (unit.cntrs && unit.cntrs.mileage != null) {
        mileage_km = Math.round(unit.cntrs.mileage / 1000);
      }
      return { id: unit.id, name: unit.nm, mileage_km };
    });

    return res.status(200).json({ units, total: units.length });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno: ' + err.message });
  } finally {
    // 3. Logout siempre, aunque haya error
    if (sid) {
      await fetch(`${BASE_URL}?svc=core/logout&params={}&sid=${sid}`, { method: 'POST' }).catch(() => {});
    }
  }
}
