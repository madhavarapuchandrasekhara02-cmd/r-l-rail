import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  "src/admin/AdminDashboard.tsx",
  "src/admin/AdminLayout.tsx",
  "src/admin/AdminLogin.tsx",
  "src/components/CartDrawer.tsx",
  "src/components/Footer.tsx",
  "src/components/Navbar.tsx",
  "src/components/ProductCard.tsx",
  "src/pages/About.tsx",
  "src/pages/Checkout.tsx",
  "src/pages/Home.tsx",
  "src/pages/ProductDetail.tsx",
  "src/pages/Shop.tsx"
];

for (const relPath of filesToUpdate) {
  const filePath = path.resolve(relPath);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace imports
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]react-router-dom['"]/g, "import { $1 } from 'react-router'");
  
  let needsNextNavigation = false;
  let needsNextLink = false;

  if (content.includes('useNavigate') || content.includes('useParams') || content.includes('useLocation')) {
    needsNextNavigation = true;
  }
  if (content.includes('<Link ')) {
    needsNextLink = true;
  }

  // Remove react-router imports
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]react-router['"]/g, (match, imports) => {
    return ''; // We will add next imports manually at the top
  });

  // Add next imports below the last import or at top
  let newImports = '';
  if (needsNextLink) {
    newImports += "import Link from 'next/link';\n";
  }
  
  let navImports = [];
  if (content.includes('useNavigate')) navImports.push('useRouter');
  if (content.includes('useParams')) navImports.push('useParams');
  if (content.includes('useLocation')) navImports.push('usePathname');
  
  if (navImports.length > 0) {
    newImports += `import { ${navImports.join(', ')} } from 'next/navigation';\n`;
  }

  content = newImports + content;

  // Replace usages
  content = content.replace(/useNavigate\(\)/g, "useRouter()");
  content = content.replace(/const\s+navigate\s*=\s*useRouter\(\)/g, "const router = useRouter()");
  content = content.replace(/navigate\(/g, "router.push(");
  content = content.replace(/useLocation\(\)/g, "usePathname()");
  
  // Replace <Link to="..."> with <Link href="...">
  content = content.replace(/<Link\s+([^>]*)to=/g, "<Link $1href=");

  // AdminLayout specific
  if (relPath.includes("AdminLayout.tsx")) {
    content = content.replace(/<Outlet\s*\/>/g, "{children}");
    content = content.replace(/export\s+default\s+function\s+AdminLayout\(\)\s*{/, "export default function AdminLayout({ children }: { children: React.ReactNode }) {");
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${relPath}`);
}
