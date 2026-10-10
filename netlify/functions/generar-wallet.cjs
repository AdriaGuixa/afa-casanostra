exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const WALLET_API_KEY = process.env.WALLETWALLET_API_KEY;

  if (!WALLET_API_KEY) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "No s'ha configurat la clau de WalletWallet a Netlify." }) 
    };
  }

  try {
    const data = JSON.parse(event.body);
    const validationUrl = "https://afa-casanostra.netlify.app/validar?id=" + encodeURIComponent(data.codi);
    const nomsTitulars = data.titulars.join(' i ');

    const passPayload = {
      passData: {
        format: "generic",
        organizationName: "AFA Escola Casa Nostra",
        description: "Carnet de Soci AFA",
        logoText: "AFA Casa Nostra",
        backgroundColor: "rgb(30, 58, 138)", // bg-blue-900 (aprox)
        foregroundColor: "rgb(255, 255, 255)",
        labelColor: "rgb(219, 234, 254)", // blue-100
        primaryFields: [
          {
            key: "titular",
            label: "FAMÍLIA",
            value: nomsTitulars
          }
        ],
        secondaryFields: [
          {
            key: "codi",
            label: "CODI SOCI",
            value: data.codi
          },
          {
            key: "curs",
            label: "CURS",
            value: "2025-2026"
          }
        ],
        barcode: {
          format: "PKBarcodeFormatQR",
          message: validationUrl,
          messageEncoding: "iso-8859-1"
        }
      }
    };

    const response = await fetch('https://api.walletwallet.dev/api/passes?format=pkpass', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WALLET_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passPayload)
    });

    const result = await response.json();

    if (response.ok && result.shareUrl) {
      return {
        statusCode: 200,
        body: JSON.stringify({ url: result.shareUrl })
      };
    } else {
      console.error("WalletWallet API Error:", result);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Error de l'API de WalletWallet: " + (result.message || "Desconegut") })
      };
    }
  } catch (error) {
    console.error("Internal Server Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error intern del servidor al comunicar amb WalletWallet." })
    };
  }
};
