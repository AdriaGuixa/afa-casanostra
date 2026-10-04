const settings = require('../../src/data/settings.json');

exports.handler = async function (event, context) {
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

    // Iterem per buscar el soci a la Columna A
    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (cols.length >= 2) {
        const colId = cleanCsvValue(cols[0]); // Col A
        if (colId === cleanCsvValue(sociId)) {
          isSoci = true;
          
          const progenitor1 = cleanCsvValue(cols[1]); // Col B
          if (progenitor1) titulars.push(progenitor1);
          
          // El Progenitor 2 ara està a la Columna E (índex 4)
          if (cols.length >= 5) {
            const progenitor2 = cleanCsvValue(cols[4]); // Col E
            if (progenitor2) titulars.push(progenitor2);
          }
          break; // Un cop trobat, parem de buscar
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
