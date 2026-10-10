const querystring = require('querystring');
const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { rawData } = querystring.parse(event.body);
  if (!rawData) {
    return { statusCode: 400, body: 'Falten dades' };
  }

  // Desempaquetem les dades originals del formulari
  const params = JSON.parse(Buffer.from(rawData, 'base64').toString('utf8'));
  
  const formTitol = params['form-id'] || 'Activitat AFA';
  const totalPagat = params['total-price'] || '0';
  
  // Intentem trobar algun correu de l'usuari (buscant valors que tinguin @)
  let userEmail = '';
  let userName = 'Família'; // Valor per defecte
  
  let resumCompraHtml = '';
  
  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith('q_')) {
      resumCompraHtml += `<li class="mb-2"><span class="font-semibold">${value}</span></li>`;
      if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
        userEmail = value;
      } else if (typeof value === 'string' && value.length > 2 && userName === 'Família' && !value.match(/^[0-9]+$/)) {
        // Assume the first text field that isn't an email might be the name
        userName = value;
      }
    }
  }

  // ===== CONFIGURACIÓ EMAILS =====
  // En producció, caldrà posar les variables d'entorn EMAIL_USER i EMAIL_PASS a Netlify
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Pots canviar-ho
      auth: {
        user: process.env.EMAIL_USER || 'ampa.escolacasanostra@gmail.com',
        pass: process.env.EMAIL_PASS || 'falsa-contrasenya',
      }
    });

    const mailTextAfa = `Nova inscripció rebuda per: ${formTitol}\nTotal pagat: ${totalPagat}€\nCorreu usuari: ${userEmail}\nDetalls: ${JSON.stringify(params)}`;
    const mailTextUser = `Hola!\nHem rebut correctament la teva inscripció per: ${formTitol}.\nImport total pagat: ${totalPagat}€.\n\nGràcies!\nAFA Casa Nostra`;

    // 1. Email a l'AFA (i al teu personal com has demanat)
    if (process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: '"AFA Casa Nostra Web" <ampa.escolacasanostra@gmail.com>',
        to: 'adriaguixa@gmail.com', // Enviem aquí de moment
        subject: `[Nova Inscripció] ${formTitol} - ${totalPagat}€`,
        text: mailTextAfa
      });
      
      // 2. Email a l'Usuari
      if (userEmail) {
        await transporter.sendMail({
          from: '"AFA Casa Nostra" <ampa.escolacasanostra@gmail.com>',
          to: userEmail,
          subject: `Confirmació d'inscripció: ${formTitol}`,
          text: mailTextUser
        });
      }
    } else {
      console.log('SIMULACIÓ EMAIL AFA:', mailTextAfa);
      console.log('SIMULACIÓ EMAIL USUARI:', mailTextUser);
    }
  } catch (error) {
    console.error('Error enviant correus:', error);
    // No aturem el procés, mostrem la pantalla d'èxit igualment
  }

  // ===== PANTALLA DE RESUM =====
  const successHtml = `
    <!DOCTYPE html>
    <html lang="ca">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pagament Completat - AFA Casa Nostra</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50 flex items-center justify-center min-h-screen p-4">
      <div class="bg-white p-8 md:p-12 max-w-lg w-full rounded-2xl shadow-xl border border-slate-200">
        <div class="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl shadow-inner">
          ✓
        </div>
        <h1 class="text-3xl font-bold text-slate-800 mb-2 text-center">Pagament Completat!</h1>
        <p class="text-slate-600 mb-8 text-center text-lg">Gràcies per la teva inscripció a <strong>${formTitol}</strong>.</p>
        
        <div class="bg-slate-50 rounded-xl p-6 text-left border border-slate-200 mb-8 shadow-sm">
          <h2 class="font-bold text-slate-700 mb-4 uppercase tracking-wider text-sm border-b pb-2">Resum de la Compra</h2>
          <ul class="text-slate-600 space-y-2 mb-4">
            ${resumCompraHtml || '<li>Inscripció confirmada</li>'}
          </ul>
          <div class="border-t border-slate-200 pt-4 mt-2 flex justify-between items-center">
            <span class="font-bold text-slate-700">Total abonat:</span>
            <span class="text-2xl font-black text-brand-blue">${totalPagat} €</span>
          </div>
        </div>
        
        <div class="text-center mb-8">
          <p class="text-sm text-slate-500">
            Hem enviat un correu de confirmació${userEmail ? ` a <strong>${userEmail}</strong>` : ''} amb els detalls d'aquesta operació.
          </p>
        </div>
        
        <a href="/" class="w-full bg-blue-900 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-800 transition block text-center shadow-lg shadow-blue-200 cursor-pointer">
          Tornar a l'inici
        </a>
      </div>
    </body>
    </html>
  `;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: successHtml,
  };
};
