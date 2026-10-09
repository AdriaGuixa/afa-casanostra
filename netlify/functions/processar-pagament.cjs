const querystring = require('querystring');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Parse the submitted form data
  const params = querystring.parse(event.body);
  
  // En un entorn real, aquí faríem:
  // 1. Llegir l'arxiu .md del CMS per comprovar que els preus són reals (evitar hackejos).
  // 2. Calcular el total.
  // 3. Generar la signatura criptogràfica HMAC SHA-256 amb la clau del Banc Sabadell.
  // 4. Redirigir cap a https://sis.redsys.es/sis/realizarPago.
  
  const formTitol = params['form-id'] || 'Activitat AFA';
  const totalPagat = params['total-price'] || '0';
  
  // HTML de Simulació de Pagament
  const simulationHtml = `
    <!DOCTYPE html>
    <html lang="ca">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Simulació de Pagament Redsys</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50 flex items-center justify-center min-h-screen">
      <div class="bg-white p-8 max-w-md w-full rounded-2xl shadow-xl text-center border border-slate-200">
        <div class="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
          💳
        </div>
        <h1 class="text-2xl font-bold text-slate-800 mb-2">Simulador de Redsys</h1>
        <p class="text-slate-600 mb-6">Això és una prova. Quan tinguem les claus del Banc Sabadell, aquesta pantalla saltarà automàticament cap al banc.</p>
        
        <div class="bg-slate-50 rounded-lg p-4 text-left border border-slate-100 mb-8">
          <p class="text-sm text-slate-500 mb-1">Pagament per a:</p>
          <p class="font-bold text-slate-800 mb-3">${formTitol}</p>
          <p class="text-sm text-slate-500 mb-1">Import a cobrar:</p>
          <p class="text-2xl font-bold text-brand-blue">${totalPagat} €</p>
        </div>
        
        <div class="flex gap-4">
          <button onclick="window.history.back()" class="w-full bg-white text-slate-700 border border-slate-300 font-bold py-3 px-4 rounded-lg hover:bg-slate-50 transition">
            Cancel·lar
          </button>
          <!-- Simulació d'èxit, el tornaríem a la web dient "Gràcies" -->
          <a href="/" class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition block text-center shadow-md shadow-blue-200">
            Simular OK
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: simulationHtml,
  };
};
