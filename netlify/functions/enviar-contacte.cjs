const nodemailer = require('nodemailer');

function generarCorreuHtml(titol, contingut) {
  return `
<!DOCTYPE html>
<html lang="ca">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AFA Casa Nostra - Contacte</title>
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
                <a href="mailto:afa@escolacasanostra.cat" style="color: #FBB03B; text-decoration: none; font-weight: bold;">afa@escolacasanostra.cat</a>
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr><td style="border-top: 1px solid #71777A;"></td></tr>
              </table>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                Missatge enviat a través del formulari de contacte del web oficial de l'AFA.
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
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const nom = (data.nom || '').trim();
    const email = (data.email || '').trim();
    const comissio = (data.comissio || 'general').trim();
    const missatge = (data.missatge || '').trim();

    if (!nom || !email || !missatge) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Si us plau, emplena tots els camps obligatoris.' })
      };
    }

    const comissionsMap = {
      general: 'Consulta General / Junta',
      festes: 'Comissió de Festes',
      llibres: 'Comissió de Socialització de Llibres'
    };
    const comissioNom = comissionsMap[comissio] || 'Consulta General / Junta';

    const missatgeFormatat = missatge.replace(/\n/g, '<br/>');

    // 1. Contingut de l'email per a l'AFA
    const contingutAfa = `
      <p style="margin: 0 0 20px 0;">S'ha rebut una nova consulta des del formulari de contacte del web:</p>
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0;"><strong>Nom:</strong> ${nom}</p>
        <p style="margin: 0 0 8px 0;"><strong>Correu:</strong> <a href="mailto:${email}" style="color: #C4122E;">${email}</a></p>
        <p style="margin: 0 0 16px 0;"><strong>Comissió de destí:</strong> ${comissioNom}</p>
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 15px 0;">
        <p style="margin: 0 0 8px 0; font-weight: bold; color: #4B5154;">Missatge:</p>
        <p style="margin: 0; background: #ffffff; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0; color: #334155; line-height: 1.5;">${missatgeFormatat}</p>
      </div>
      <p style="margin: 0; font-size: 14px; color: #64748b;">Pots respondre directament a aquest correu per contestar a la família (${email}).</p>
    `;
    const htmlAfa = generarCorreuHtml(`Nou missatge: ${comissioNom}`, contingutAfa);

    // 2. Contingut de l'email de confirmació per a l'usuari
    const contingutUsuari = `
      <p style="margin: 0 0 20px 0;">Hola ${nom},</p>
      <p style="margin: 0 0 20px 0;">Hem rebut correctament la teva consulta adreçada a <strong>${comissioNom}</strong>.</p>
      <p style="margin: 0 0 20px 0;">Els membres de la comissió revisarem la teva petició i ens posarem en contacte amb tu al teu correu tan aviat com ens sigui possible.</p>
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0; font-weight: bold; color: #4B5154;">Còpia del teu missatge:</p>
        <p style="margin: 0; background: #ffffff; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0; color: #334155; line-height: 1.5;">${missatgeFormatat}</p>
      </div>
      <p style="margin: 0 0 20px 0;">Gràcies per la teva implicació i per posar-te en contacte amb l'AFA!</p>
    `;
    const htmlUsuari = generarCorreuHtml('Hem rebut el teu missatge!', contingutUsuari);

    // 3. Enviament amb Nodemailer
    if (process.env.EMAIL_PASS) {
      const emailAfa = process.env.EMAIL_TO || 'afa@escolacasanostra.cat';
      const emailSender = process.env.EMAIL_FROM || 'afa@escolacasanostra.cat';
      const authUser = process.env.EMAIL_USER || 'afa@escolacasanostra.cat';

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: authUser,
          pass: process.env.EMAIL_PASS,
        }
      });

      // Email a l'AFA
      await transporter.sendMail({
        from: `"${nom} (via Web AFA)" <${emailSender}>`,
        to: emailAfa,
        replyTo: email,
        subject: `[Contacte Web] ${comissioNom} - ${nom}`,
        html: htmlAfa
      });

      // Còpia a la família
      await transporter.sendMail({
        from: `"AFA Casa Nostra" <${emailSender}>`,
        to: email,
        subject: 'Hem rebut la teva consulta - AFA Casa Nostra',
        html: htmlUsuari
      });
    } else {
      console.log('--- SIMULACIÓ EMAIL CONTACTE (AFA) ---');
      console.log(contingutAfa);
      console.log('--- SIMULACIÓ EMAIL CONTACTE (USUARI) ---');
      console.log(contingutUsuari);
    }

    // 4. Enviament opcional a Google Sheets si el webhook està actiu
    if (process.env.GOOGLE_SHEETS_WEBHOOK) {
      try {
        await fetch(process.env.GOOGLE_SHEETS_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formName: 'Contacte Web',
            totalPagat: '0',
            dades: {
              'Nom': nom,
              'Correu': email,
              'Comissió': comissioNom,
              'Missatge': missatge
            }
          })
        });
      } catch (sheetsError) {
        console.error('Error enviant contacte a Google Sheets:', sheetsError);
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Missatge enviat correctament.' })
    };
  } catch (error) {
    console.error('Error processant formulari de contacte:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'S\'ha produït un error en enviar el missatge. Si us plau, torna-ho a provar més tard.' })
    };
  }
};
