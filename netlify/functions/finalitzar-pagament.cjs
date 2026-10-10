const querystring = require('querystring');
const nodemailer = require('nodemailer');

function generarCorreuHtml(titol, contingut) {
  return `
<!DOCTYPE html>
<html lang="ca">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AFA Casa Nostra - Comunicat</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 600px; width: 100%;">
          <tr>
            <td align="center" style="background-color: #ffffff; padding: 30px; border-bottom: 4px solid #C4122E;">
              <a href="https://afa-casanostra.netlify.app" target="_blank">
                <img src="https://afa-casanostra.netlify.app/images/logo-afa-email.png" alt="AFA Casa Nostra" width="160" style="display: block; width: 160px; max-width: 100%; height: auto; border: 0;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; line-height: 1.6; color: #334155; font-size: 16px;">
              <h1 style="color: #4B5154; font-size: 24px; margin-top: 0; margin-bottom: 20px; font-weight: bold;">${titol}</h1>
              ${contingut}
              <p style="margin: 30px 0 0 0; font-weight: bold; color: #4B5154;">La Junta de l'AFA Casa Nostra</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #4B5154; color: #f8fafc; text-align: center; padding: 30px 40px; font-size: 14px;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #ffffff; font-size: 16px;">AFA Escola Casa Nostra</p>
              <p style="margin: 0 0 10px 0;">Banyoles / Porqueres</p>
              <p style="margin: 0 0 20px 0;">
                <a href="mailto:ampa.escolacasanostra@gmail.com" style="color: #FBB03B; text-decoration: none; font-weight: bold;">ampa.escolacasanostra@gmail.com</a>
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr><td style="border-top: 1px solid #71777A;"></td></tr>
              </table>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                Heu rebut aquest correu perquè heu realitzat una inscripció o formeu part de l'AFA.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { rawData } = querystring.parse(event.body);
  if (!rawData) {
    return { statusCode: 400, body: 'Falten dades' };
  }

  const params = JSON.parse(Buffer.from(rawData, 'base64').toString('utf8'));
  
  const formTitol = params['form-id'] || 'Activitat AFA';
  const totalPagat = params['total-price'] || '0';
  
  let userEmail = '';
  let userName = 'Família';
  
  let resumCompraHtmlWeb = '';
  let resumCompraHtmlEmail = '';
  
  const dadesNetes = {}; // Obecte net per enviar a Google Sheets
  
  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith('q_') && value !== '') {
      const index = key.replace('q_', '');
      const label = params[`label_q_${index}`] || \`Pregunta \${index}\`;
      
      dadesNetes[label] = value;
      
      resumCompraHtmlWeb += \`<li class="mb-2"><span class="text-slate-500">\${label}:</span> <span class="font-semibold text-slate-800">\${value}</span></li>\`;
      resumCompraHtmlEmail += \`<li><span style="color:#64748b;">\${label}:</span> <strong>\${value}</strong></li>\`;
      
      if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
        userEmail = value;
      } else if (typeof value === 'string' && value.length > 2 && userName === 'Família' && !value.match(/^[0-9]+$/)) {
        userName = value;
      }
    }
  }

  // ===== GOOGLE SHEETS WEBHOOK =====
  if (process.env.GOOGLE_SHEETS_WEBHOOK) {
    try {
      await fetch(process.env.GOOGLE_SHEETS_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formName: formTitol,
          totalPagat: totalPagat,
          dades: dadesNetes
        })
      });
      console.log('Dades enviades a Google Sheets correctament.');
    } catch (error) {
      console.error('Error enviant dades a Google Sheets:', error);
    }
  }

  // ===== CONFIGURACIÓ EMAILS =====
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'ampa.escolacasanostra@gmail.com',
        pass: process.env.EMAIL_PASS || 'falsa-contrasenya',
      }
    });

    const contingutAfa = `
      <p style="margin: 0 0 20px 0;">S'ha completat una nova inscripció / pagament amb èxit per l'activitat <strong>${formTitol}</strong>.</p>
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; font-size: 18px; color: #334155;">Detalls de la inscripció:</h2>
        <ul>${resumCompraHtmlEmail}</ul>
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 15px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>Total abonat: <span style="color: #C4122E;">${totalPagat}€</span></strong></p>
      </div>
      <p style="margin: 0 0 20px 0;">El correu de contacte proporcionat és: <a href="mailto:${userEmail}" style="color: #C4122E;">${userEmail}</a>.</p>
    `;
    const htmlAfa = generarCorreuHtml(`Nova inscripció: ${formTitol}`, contingutAfa);

    const contingutUser = `
      <p style="margin: 0 0 20px 0;">Hola ${userName},</p>
      <p style="margin: 0 0 20px 0;">Hem rebut correctament la teva inscripció i el pagament per <strong>${formTitol}</strong>.</p>
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; font-size: 18px; color: #334155;">Resum de la teva operació:</h2>
        <ul>${resumCompraHtmlEmail}</ul>
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 15px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>Total abonat: <span style="color: #C4122E;">${totalPagat}€</span></strong></p>
      </div>
      <p style="margin: 0 0 20px 0;">Si tens qualsevol dubte sobre aquesta activitat, pots respondre directament a aquest correu.</p>
    `;
    const htmlUser = generarCorreuHtml(`Confirmació d'inscripció: ${formTitol}`, contingutUser);

    if (process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: '"AFA Casa Nostra Web" <ampa.escolacasanostra@gmail.com>',
        to: 'adriaguixa@gmail.com',
        subject: `[Nova Inscripció] ${formTitol} - ${totalPagat}€`,
        html: htmlAfa
      });
      
      if (userEmail) {
        await transporter.sendMail({
          from: '"AFA Casa Nostra" <ampa.escolacasanostra@gmail.com>',
          to: userEmail,
          subject: `Confirmació d'inscripció: ${formTitol}`,
          html: htmlUser
        });
      }
    }
  } catch (error) {
    console.error('Error enviant correus:', error);
  }

  // ===== PANTALLA DE RESUM WEB =====
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
            ${resumCompraHtmlWeb || '<li>Inscripció confirmada</li>'}
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
