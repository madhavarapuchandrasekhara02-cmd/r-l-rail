import fs from 'fs';
import path from 'path';

function fixFile(relPath, fixFn) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  const newContent = fixFn(content);
  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log('Fixed', relPath);
  }
}

const filesWithLinks = [
  "src/admin/AdminProducts.tsx",
  "src/admin/AdminOrders.tsx",
  "src/admin/AdminPacking.tsx",
  "src/components/Footer.tsx",
  "src/pages/About.tsx",
];

for (const file of filesWithLinks) {
  fixFile(file, (content) => {
    if (content.includes('<Link') && !content.includes('next/link')) {
      return `import Link from 'next/link';\n` + content;
    }
    return content;
  });
}

fixFile("src/components/Navbar.tsx", (content) => {
  return content.replace(/location\.pathname/g, "location");
});

fixFile("src/pages/ProductDetail.tsx", (content) => {
  return content.replace(/const { slug } = useParams\(\)/g, "const { slug } = useParams() as { slug: string }");
});

fixFile("src/pages/Shop.tsx", (content) => {
  if (content.includes('useSearchParams') && !content.includes('useSearchParams } from')) {
    return `import { useSearchParams } from 'next/navigation';\n` + content;
  }
  return content;
});
