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
    const validationUrl = "https://afacasanostra.cat/validar?id=" + encodeURIComponent(data.codi);
    const nomsTitulars = data.titulars.join(' i ');

    // Estructura simplificada que demana l'API de WalletWallet
    const passPayload = {
      format: "generic",
      organizationName: "AFA Escola Casa Nostra",
      description: "Carnet de Soci AFA",
      logoText: "AFA Casa Nostra",
      title: nomsTitulars,
      backgroundColor: "#1e3a8a", // Blau fosc corporatiu
      foregroundColor: "#ffffff",
      barcodeFormat: "QR",
      barcodeValue: validationUrl
    };

    const response = await fetch('https://api.walletwallet.dev/api/passes', {
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
      console.error("WalletWallet API Error Payload:", result);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Error API: " + JSON.stringify(result) })
      };
    }
  } catch (error) {
    console.error("Internal Server Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error intern: " + error.message })
    };
  }
};
