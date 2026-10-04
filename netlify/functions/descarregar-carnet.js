const settings = require('../../src/data/settings.json');

exports.handler = async function (event, context) {
  const { dni, email } = event.queryStringParameters;

  if (!dni || !email) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Falten dades (DNI o Email)." })
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

    const cleanCsvValue = (val) => val ? val.trim().replace(/^"|"$/g, '').toLowerCase().trim() : '';
    const cleanString = (val) => val ? val.trim().replace(/^"|"$/g, '').trim() : '';
    
    const rows = csvText.split('\n');
    
    let isAuthorized = false;
    let foundCodi = null;
    let titulars = [];

    const inputDni = cleanCsvValue(dni);
    const inputEmail = cleanCsvValue(email);

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (cols.length >= 4) { // Minim 4 cols fins a Email P1
        const codi = cleanString(cols[0]); // Col A
        const nom1 = cleanString(cols[1]); // Col B
        const dni1 = cleanCsvValue(cols[2]); // Col C
        const email1 = cleanCsvValue(cols[3]); // Col D
        
        let nom2 = '';
        let dni2 = '';
        let email2 = '';
        
        if (cols.length >= 7) {
            nom2 = cleanString(cols[4]); // Col E
            dni2 = cleanCsvValue(cols[5]); // Col F
            email2 = cleanCsvValue(cols[6]); // Col G
        }

        // Comprovem si coincideix amb el Progenitor 1
        const matchP1 = (inputDni === dni1 && inputEmail === email1);
        // Comprovem si coincideix amb el Progenitor 2
        const matchP2 = (inputDni === dni2 && inputEmail === email2);

        if (matchP1 || matchP2) {
          isAuthorized = true;
          foundCodi = codi;
          if (nom1) titulars.push(nom1);
          if (nom2) titulars.push(nom2);
          break; // Trobat!
        }
      }
    }

    if (isAuthorized) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valid: true, codi: foundCodi, titulars: titulars })
      };
    } else {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valid: false, error: "DNI o Correu incorrectes." })
      };
    }

  } catch (error) {
    console.error("Error al backend:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Error intern connectant amb la base de dades." })
    };
  }
};
