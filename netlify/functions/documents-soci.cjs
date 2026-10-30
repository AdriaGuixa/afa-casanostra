const crypto = require('crypto');
const nodemailer = require('nodemailer');
const settings = require('../../src/data/settings.json');
const privateDocsBundle = require('../../src/data/private_documents_bundle.json');

function getSecret() {
  return process.env.SESSION_SECRET || process.env.EMAIL_PASS || 'afa-casanostra-default-secret-2026';
}

function signHmac(data) {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function createChallengeToken(soci, otpCode) {
  const payload = {
    email: soci.email,
    codi: soci.codi,
    titulars: soci.titulars,
    exp: Date.now() + 10 * 60 * 1000 // 10 minuts
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = signHmac(`${payloadB64}.${otpCode}`);
  return `${payloadB64}.${sig}`;
}

function verifyChallengeToken(challengeToken, otpCode) {
  if (!challengeToken || !otpCode) return { valid: false, reason: 'missing' };
  const parts = String(challengeToken).split('.');
  if (parts.length !== 2) return { valid: false, reason: 'malformed' };

  const [payloadB64, sig] = parts;
  const cleanCode = String(otpCode).trim();
  const expectedSig = signHmac(`${payloadB64}.${cleanCode}`);

  if (!safeEqual(sig, expectedSig)) {
    return { valid: false, reason: 'invalid_code' };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return { valid: false, reason: 'expired' };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'malformed' };
  }
}

function createSessionToken(soci) {
  const payload = {
    type: 'soci_docs_session',
    email: soci.email,
    codi: soci.codi,
    titulars: soci.titulars,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 dies
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = signHmac(`session.${payloadB64}`);
  return `${payloadB64}.${sig}`;
}

function verifySessionToken(sessionToken) {
  if (!sessionToken) return null;
  const parts = String(sessionToken).split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;
  const expectedSig = signHmac(`session.${payloadB64}`);
  if (!safeEqual(sig, expectedSig)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.type !== 'soci_docs_session' || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function trobarSociPerEmail(emailInput) {
  const csvUrl = settings.socis_csv_url;
  if (!csvUrl || csvUrl.trim() === '') {
    throw new Error('Sistema de validació de socis no configurat.');
  }

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error("No s'ha pogut connectar amb la base de dades de socis.");
  }

  const csvText = await response.text();
  const cleanCsvValue = (val) => (val ? val.trim().replace(/^"|"$/g, '').toLowerCase().trim() : '');
  const cleanString = (val) => (val ? val.trim().replace(/^"|"$/g, '').trim() : '');

  const inputEmail = cleanCsvValue(emailInput);
  if (!inputEmail || !inputEmail.includes('@')) {
    return null;
  }

  const rows = csvText.split(/\r?\n/);
  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i].split(',');
    if (cols.length >= 4) {
      const codi = cleanString(cols[0]);
      const nom1 = cleanString(cols[1]);
      const email1 = cleanCsvValue(cols[3]);

      let nom2 = '';
      let email2 = '';
      if (cols.length >= 7) {
        nom2 = cleanString(cols[4]);
        email2 = cleanCsvValue(cols[6]);
      }

      if (inputEmail === email1 || (email2 && inputEmail === email2)) {
        const titulars = [];
        if (nom1) titulars.push(nom1);
        if (nom2) titulars.push(nom2);
        return {
          email: inputEmail,
          codi,
          titulars
        };
      }
    }
  }

  return null;
}

function generarCorreuOtpHtml(soci, otpCode) {
  const noms = soci.titulars && soci.titulars.length > 0 ? soci.titulars.join(' i ') : 'Família';
  return `
<!DOCTYPE html>
<html lang="ca">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Codi d'accés a Documents - AFA Casa Nostra</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 600px; width: 100%;">
          <tr>
            <td align="center" style="background-color: #ffffff; padding: 30px; border-bottom: 4px solid #C4122E;">
              <a href="https://afacasanostra.cat" target="_blank">
                <img src="https://afacasanostra.cat/images/logo-afa-email.png" alt="AFA Casa Nostra" width="160" style="display: block; width: 160px; max-width: 100%; height: auto; border: 0;">
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; line-height: 1.6; color: #334155; font-size: 16px;">
              <h1 style="color: #4B5154; font-size: 24px; margin-top: 0; margin-bottom: 20px; font-weight: bold;">Codi d'accés a Documents</h1>
              <p style="margin: 0 0 16px 0;">Hola <strong>${noms}</strong>,</p>
              <p style="margin: 0 0 24px 0;">Has sol·licitat accedir a la secció privada de documents i actes per a socis de l'<strong>AFA Escola Casa Nostra</strong>. Introdueix el següent codi de verificació a la web:</p>
              
              <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #C4122E; display: inline-block;">${otpCode}</span>
              </div>

              <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">
                ⏳ Aquest codi és d'un sol ús i caduca en <strong>10 minuts</strong>.<br>
                Si no has sol·licitat aquest accés, pots ignorar aquest missatge amb total seguretat.
              </p>
              <p style="margin: 30px 0 0 0; font-weight: bold; color: #4B5154;">La Junta de l'AFA Casa Nostra</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #4B5154; color: #f8fafc; text-align: center; padding: 30px 40px; font-size: 14px;">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #ffffff; font-size: 16px;">AFA Escola Casa Nostra</p>
              <p style="margin: 0 0 10px 0;">Banyoles</p>
              <p style="margin: 0 0 20px 0;">
                <a href="mailto:info@afacasanostra.cat" style="color: #FBB03B; text-decoration: none; font-weight: bold;">info@afacasanostra.cat</a>
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr><td style="border-top: 1px solid #71777A;"></td></tr>
              </table>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                Missatge automàtic d'accés per a socis del web oficial de l'AFA.
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

function getSafeDocsList() {
  return (privateDocsBundle || []).map(({ fileBase64, ...meta }) => meta);
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const action = body.action;

    // 1. ENVIAR CODI D'ACCÉS PER CORREU ELECTRÒNIC
    if (action === 'send-code') {
      const email = (body.email || '').trim();
      if (!email || !email.includes('@')) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Si us plau, introdueix un correu electrònic vàlid.' })
        };
      }

      const soci = await trobarSociPerEmail(email);
      if (!soci) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: "Aquest correu electrònic no consta a la llista de socis actius de l'AFA. Revisa que sigui el mateix correu amb què et vas donar d'alta."
          })
        };
      }

      const otpCode = String(crypto.randomInt(100000, 1000000));
      const challengeToken = createChallengeToken(soci, otpCode);
      const htmlOtp = generarCorreuOtpHtml(soci, otpCode);

      if (process.env.EMAIL_PASS) {
        const emailSender = process.env.EMAIL_FROM || 'info@afacasanostra.cat';
        const authUser = process.env.EMAIL_USER || 'ampa.escolacasanostra@gmail.com';

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: authUser,
            pass: process.env.EMAIL_PASS
          }
        });

        await transporter.sendMail({
          from: `"AFA Casa Nostra" <${emailSender}>`,
          replyTo: emailSender,
          to: soci.email,
          subject: `${otpCode} és el teu codi d'accés als documents de l'AFA`,
          html: htmlOtp
        });
      } else {
        console.log(`[SIMULACIÓ OTP DOCUMENTS] Correu: ${soci.email} | Codi: ${otpCode}`);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          challengeToken,
          message: 'Hem enviat un codi de 6 xifres al teu correu electrònic.'
        })
      };
    }

    // 2. VERIFICAR EL CODI DE 6 XIFRES I OBTENIR DOCUMENTS
    if (action === 'verify-code') {
      const { challengeToken, code } = body;
      const result = verifyChallengeToken(challengeToken, code);

      if (!result.valid) {
        const msg =
          result.reason === 'expired'
            ? "El codi ha caducat (validesa de 10 minuts). Si us plau, sol·licita'n un de nou."
            : 'El codi introduït no és correcte. Revisa el correu i torna-ho a provar.';
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: msg })
        };
      }

      const sessionToken = createSessionToken(result.payload);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valid: true,
          sessionToken,
          soci: {
            email: result.payload.email,
            codi: result.payload.codi,
            titulars: result.payload.titulars
          },
          documents: getSafeDocsList()
        })
      };
    }

    // 3. OBTENIR DOCUMENTS AMB SESSIÓ ACTIVA
    if (action === 'get-documents') {
      const session = verifySessionToken(body.sessionToken);
      if (!session) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Sessió caducada o no vàlida.' })
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valid: true,
          soci: {
            email: session.email,
            codi: session.codi,
            titulars: session.titulars
          },
          documents: getSafeDocsList()
        })
      };
    }

    // 4. DESCARREGAR UN DOCUMENT PDF PRIVAT
    if (action === 'download') {
      const session = verifySessionToken(body.sessionToken);
      if (!session) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Sessió caducada. Torna a iniciar sessió.' })
        };
      }

      const doc = (privateDocsBundle || []).find((d) => d.id === body.docId);
      if (!doc || !doc.fileBase64) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: "No s'ha trobat l'arxiu sol·licitat." })
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: doc.fileName || `${doc.id}.pdf`,
          fileBase64: doc.fileBase64
        })
      };
    }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Acció no reconeguda.' })
    };
  } catch (error) {
    console.error('Error a documents-soci:', error);
    const detail = error && error.code === 'EAUTH'
      ? "Error d'autenticació del servidor de correu (revisa EMAIL_USER i EMAIL_PASS a Netlify)."
      : 'Error intern del servidor. Torna-ho a provar més tard.';
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: detail })
    };
  }
};
