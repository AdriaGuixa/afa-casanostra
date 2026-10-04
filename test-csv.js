const csv = `NUM DE SOCI,NOM PROGENITOR 1,DNI PROGENITOR 1,EMAIL PROGENITOR 1,NOM PROGENITOR 2,DNI PROGENITOR 2,EMAIL PROGENITOR 2
AFA-2026-001,Anna Cardó Santafé,47798113L,annomsa@gmail.com,Adrià Guixà Ibáñez,47103350V,adriaguixa@gmail.com`;

const dni = '47103350V';
const email = 'adriaguixa@gmail.com';

const cleanCsvValue = (val) => val ? val.trim().replace(/^"|"$/g, '').toLowerCase().trim() : '';
const cleanString = (val) => val ? val.trim().replace(/^"|"$/g, '').trim() : '';

const rows = csv.split('\n');

let isAuthorized = false;
const inputDni = cleanCsvValue(dni);
const inputEmail = cleanCsvValue(email);

console.log('INPUT:', {inputDni, inputEmail});

for (let i = 0; i < rows.length; i++) {
  const cols = rows[i].split(',');
  console.log(`Row ${i} cols:`, cols.length);
  if (cols.length >= 4) { 
    const codi = cleanString(cols[0]); 
    const nom1 = cleanString(cols[1]); 
    const dni1 = cleanCsvValue(cols[2]); 
    const email1 = cleanCsvValue(cols[3]); 
    
    let nom2 = '';
    let dni2 = '';
    let email2 = '';
    
    if (cols.length >= 7) {
        nom2 = cleanString(cols[4]); 
        dni2 = cleanCsvValue(cols[5]); 
        email2 = cleanCsvValue(cols[6]); 
    }

    console.log('Parsed P1:', {dni1, email1});
    console.log('Parsed P2:', {dni2, email2});

    const matchP1 = (inputDni === dni1 && inputEmail === email1);
    const matchP2 = (inputDni === dni2 && inputEmail === email2);

    if (matchP1 || matchP2) {
      isAuthorized = true;
      console.log('AUTHORIZED!');
      break; 
    }
  }
}
console.log('Final Result:', isAuthorized);
