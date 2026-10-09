const fs = require('fs');
let content = fs.readFileSync('public/admin/config.yml', 'utf8');

// Replace the old formularis block with a new dynamic one
const newFormularis = `
  - name: "formularis"
    label: "Formularis Natius (amb Pagament)"
    folder: "src/content/formularis"
    create: true
    slug: "{{slug}}"
    fields:
      - {label: "Títol de l'Activitat", name: "title", widget: "string"}
      - {label: "Breu Descripció", name: "description", widget: "text", required: false}
      - {label: "Actiu (Obert al públic)", name: "actiu", widget: "boolean", default: true}
      - label: "Preguntes / Camps del Formulari"
        name: "preguntes"
        widget: "list"
        fields:
          - {label: "Títol de la pregunta (Ex: Nom de l'alumne)", name: "titol_pregunta", widget: "string"}
          - {label: "Tipus de camp", name: "tipus", widget: "select", options: ["Text", "Correu electrònic", "Número (sense preu)", "Article amb Preu (Calcula el total)"]}
          - {label: "Preu per unitat (Només si has escollit Article amb Preu)", name: "preu", widget: "number", value_type: "float", default: 0, required: false, hint: "Ex: 15. Si marquen 2 unitats, sumarà 30€ al total."}
          - {label: "Obligatori?", name: "obligatori", widget: "boolean", default: true}
      - {label: "Text de confirmació final", name: "text_exit", widget: "text", required: false, default: "Gràcies! Hem rebut la teva inscripció correctament."}
`;

content = content.replace(/  - name: "formularis".*?(?=\n  - name|\n$)/s, newFormularis.trim());
fs.writeFileSync('public/admin/config.yml', content);
