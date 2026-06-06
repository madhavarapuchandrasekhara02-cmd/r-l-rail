import fs from 'fs';
import path from 'path';

const routes = [
  { path: 'src/app/page.tsx', component: 'Home', importPath: '@/pages/Home' },
  { path: 'src/app/shop/page.tsx', component: 'Shop', importPath: '@/pages/Shop' },
  { path: 'src/app/product/[slug]/page.tsx', component: 'ProductDetail', importPath: '@/pages/ProductDetail' },
  { path: 'src/app/checkout/page.tsx', component: 'Checkout', importPath: '@/pages/Checkout' },
  { path: 'src/app/track/page.tsx', component: 'TrackOrder', importPath: '@/pages/TrackOrder' },
  { path: 'src/app/about/page.tsx', component: 'About', importPath: '@/pages/About' },
  { path: 'src/app/contact/page.tsx', component: 'Contact', importPath: '@/pages/Contact' },
  { path: 'src/app/admin/layout.tsx', component: 'AdminLayout', importPath: '@/admin/AdminLayout', isLayout: true },
  { path: 'src/app/admin/page.tsx', component: 'AdminDashboard', importPath: '@/admin/AdminDashboard' },
  { path: 'src/app/admin/login/page.tsx', component: 'AdminLogin', importPath: '@/admin/AdminLogin' },
  { path: 'src/app/admin/products/page.tsx', component: 'AdminProducts', importPath: '@/admin/AdminProducts' },
  { path: 'src/app/admin/orders/page.tsx', component: 'AdminOrders', importPath: '@/admin/AdminOrders' },
  { path: 'src/app/admin/packing/page.tsx', component: 'AdminPacking', importPath: '@/admin/AdminPacking' },
];

for (const route of routes) {
  const fullPath = path.resolve(route.path);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });

  let content = `"use client";\nimport ${route.component} from "${route.importPath}";\n\n`;
  if (route.isLayout) {
    content += `export default function Layout({ children }: { children: React.ReactNode }) {\n  return <${route.component}>{children}</${route.component}>;\n}\n`;
  } else {
    content += `export default function Page() {\n  return <${route.component} />;\n}\n`;
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created ${route.path}`);
}
