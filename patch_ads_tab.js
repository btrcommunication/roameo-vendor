const fs = require('fs');

const filesToPatch = [
  'src/app/index.tsx',
  'src/app/orders.tsx',
  'src/app/bookings.tsx',
  'src/app/listings/index.tsx'
];

for (const file of filesToPatch) {
  if (!fs.existsSync(file)) continue;
  let c = fs.readFileSync(file, 'utf8');

  // 1. Update typing of path to allow '/ads' (if it has strict typing)
  c = c.replace(/path:\s*'\/'.*?\|.*?'\/listings';/g, "path: '/' | '/orders' | '/listings' | '/ads' | any;");

  // 2. Add the Ads tab to the bottom bar
  // Look for the Coupons TabBarItem and append the Ads TabBarItem
  const couponsTab = `<TabBarItem
          icon="tag"
          label="Coupons"
          path="/listings"
        />`;
  const couponsTabInline = `<TabBarItem icon="tag" label="Coupons" path="/listings" />`;
  
  const adsTab = `
        <TabBarItem
          icon="bullhorn"
          label="Ads"
          path="/ads"
        />`;
  const adsTabInline = `\n        <TabBarItem icon="bullhorn" label="Ads" path="/ads" />`;

  if (c.includes(couponsTab)) {
    c = c.replace(couponsTab, couponsTab + adsTab);
  } else if (c.includes(couponsTabInline)) {
    c = c.replace(couponsTabInline, couponsTabInline + adsTabInline);
  }

  // Same for FontAwesome name type
  c = c.replace(/icon:\s*React\.ComponentProps<typeof FontAwesome>\['name'\];/g, 'icon: any;');
  
  fs.writeFileSync(file, c);
  console.log('Patched:', file);
}
