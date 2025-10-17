require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');

const ORS_API_KEY = process.env.ORS_API_KEY;
if (!ORS_API_KEY) console.warn('⚠️ ORS_API_KEY no configurada en .env');

const ORS_GEOCODE_URL = 'https://api.openrouteservice.org/geocode/search';
const ORS_DIRECTIONS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

// --- utilidades ---
function normalizeAddress(s) {
  if (!s) return '';
  return String(s).replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
}
function toRad(d) { return d * Math.PI / 180; }
function haversineKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const A = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(A));
}
function isInColombia(lat, lon) {
  return lat >= -6 && lat <= 13 && lon >= -82 && lon <= -66;
}

// --- nuevo helper ---
function prioritizeBello(features) {
  if (!Array.isArray(features) || features.length === 0) return [];

  const BELLO_CENTER = { lat: 6.34, lon: -75.56 };
  const withScores = features.map(f => {
    const [lon, lat] = f.geometry.coordinates.map(Number);
    const label = (f.properties.label || f.properties.name || '').toLowerCase();
    const context = (f.properties.context || '').toLowerCase();
    let score = 0;

    // 1️⃣ si menciona Bello explícitamente, bonus alto
    if (label.includes('bello') || context.includes('bello')) score += 1;

    // 2️⃣ bonus inverso por distancia a Bello
    const d = haversineKm({ lat, lon }, BELLO_CENTER);
    if (d <= 15) score += 0.8;  // dentro del área de Bello
    else if (d <= 30) score += 0.3;

    // 3️⃣ penaliza si está fuera de Colombia
    if (!isInColombia(lat, lon)) score -= 0.5;

    return { f, score, d };
  });

  // ordena por mayor score (mejor primero)
  return withScores.sort((a, b) => b.score - a.score).map(e => e.f);
}

// --- geocode principal ---
async function geocode(address) {
  const text = normalizeAddress(address);
  if (!text) return null;

  try {
    const resp = await axios.get(ORS_GEOCODE_URL, {
      params: { text, size: 10, 'boundary.country': 'COL' },
      headers: { Authorization: ORS_API_KEY },
      timeout: 10000
    });

    let features = resp.data?.features || [];
    console.log(`[geocode] "${text}" => ${features.length} resultados`);

    if (features.length === 0) return null;

    // priorizar si está en Bello o cerca
    features = prioritizeBello(features);

    // elige el mejor
    const f = features[0];
    const [lon, lat] = f.geometry.coordinates.map(Number);
    const label = f.properties.label || f.properties.name || text;

    console.log(`✅ Seleccionada: "${label}" (${lat}, ${lon})`);

    return { lat, lon, label };
  } catch (err) {
    console.warn(`[geocode] error for "${address}":`, err.response ? `${err.response.status} ${err.response.statusText}` : err.message);
    return null;
  }
}

// --- rutas ---
router.post('/geocode', async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Address requerido' });

  const g = await geocode(address);
  if (!g) return res.status(404).json({ error: `No se encontró: ${address}` });
  res.json(g);
});

router.get('/calculate-distance', async (req, res) => {
  const { origen, destino } = req.query;
  if (!origen || !destino) return res.status(400).json({ error: 'origen y destino son requeridos' });

  try {
    const origenG = await geocode(origen);
    const destinoG = await geocode(destino);
    if (!origenG || !destinoG) return res.status(404).json({ error: 'No se pudo geocodificar alguno de los puntos' });

    console.log(`[calculate-distance]\n   Origen: "${origenG.label}" (${origenG.lat}, ${origenG.lon})\n   Destino: "${destinoG.label}" (${destinoG.lat}, ${destinoG.lon})`);

    const body = { coordinates: [[origenG.lon, origenG.lat], [destinoG.lon, destinoG.lat]] };

    try {
      const routeResp = await axios.post(ORS_DIRECTIONS_URL, body, {
        headers: { Authorization: ORS_API_KEY, 'Content-Type': 'application/json' },
        timeout: 15000
      });
      const summary = routeResp.data.routes[0].summary;
      const distanceKm = summary.distance / 1000;
      console.log(`🚗 Distancia real (carretera): ${distanceKm.toFixed(2)} km`);
      return res.json({ distance: Number(distanceKm.toFixed(2)), origen: origenG.label, destino: destinoG.label });
    } catch {
      const fallbackKm = haversineKm(origenG, destinoG);
      console.log(`⚠️ Usando fallback Haversine: ${fallbackKm.toFixed(2)} km`);
      return res.json({ distance: Number(fallbackKm.toFixed(2)), origen: origenG.label, destino: destinoG.label, fallback: true });
    }
  } catch (err) {
    console.error('/calculate-distance error:', err.message);
    res.status(500).json({ error: 'Error calculando distancia' });
  }
});

module.exports = router;
