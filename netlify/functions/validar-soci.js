import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const settings = require('../../src/data/settings.json');

export const handler = async function (event, context) {
  const sociId = event.queryStringParameters.id;

  if (!sociId) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "No s'ha proporcionat cap ID." })
    };
  }

  const csvUrl = settings.socis_csv_url;
  if (!csvUrl || csvUrl.trim() === '') {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Sistema no configurat" })
    };
  }

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error("No s'ha pogut descarregar el CSV de Google");
    }
    const csvText = await response.text();

    const cleanCsvValue = (val) => val ? val.trim().replace(/^"|"$/g, '').trim() : '';
    const rows = csvText.split('\n');
    
    let isSoci = false;
    let titulars = [];

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (cols.length >= 2) {
        const colId = cleanCsvValue(cols[0]);
        if (colId === cleanCsvValue(sociId)) {
          isSoci = true;
          const progenitor1 = cleanCsvValue(cols[1]);
          if (progenitor1) titulars.push(progenitor1);
          
          if (cols.length >= 5) {
            const progenitor2 = cleanCsvValue(cols[4]);
            if (progenitor2) titulars.push(progenitor2);
          }
          break;
        }
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valid: isSoci, titulars: titulars })
    };
  } catch (error) {
    console.error("Error al backend:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Error intern validant el soci." })
    };
  }
};
