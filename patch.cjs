const fs = require('fs');
const file = 'src/layouts/Layout.astro';
let content = fs.readFileSync(file, 'utf8');

// Replace logo and remove text
content = content.replace(
  /<a href="\/" class="flex items-center gap-3">\s*<img src="\/images\/logo-afa\.png" alt="Logo Escola Casa Nostra" class="h-12" \/>\s*<div class="font-bold text-xl text-brand-blue leading-tight hidden sm:block">\s*AFA<br\/>.*?<\/div>\s*<\/a>/s,
  `<a href="/" class="flex items-center gap-3">
          <img src="/images/logo-afa-email.png" alt="Logo AFA Casa Nostra" class="h-14" />
        </a>`
);

// Add "Inici" to menu
content = content.replace(
  /<nav class="hidden md:flex gap-5 font-medium text-brand-blue items-center text-sm lg:text-base">\s*<a href="\/afa" class="hover:text-brand-accent transition">L'AFA<\/a>/,
  `<nav class="hidden md:flex gap-5 font-medium text-brand-blue items-center text-sm lg:text-base">
          <a href="/" class="hover:text-brand-accent transition">Inici</a>
          <a href="/afa" class="hover:text-brand-accent transition">L'AFA</a>`
);

fs.writeFileSync(file, content);
