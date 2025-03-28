
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/portfolio-web/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/portfolio-web"
  },
  {
    "renderMode": 2,
    "route": "/portfolio-web/about"
  },
  {
    "renderMode": 2,
    "route": "/portfolio-web/projects"
  },
  {
    "renderMode": 2,
    "route": "/portfolio-web/contact"
  },
  {
    "renderMode": 2,
    "route": "/portfolio-web/analytics"
  },
  {
    "renderMode": 2,
    "redirectTo": "/portfolio-web",
    "route": "/portfolio-web/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 1598, hash: '06808d4ee024a95e336e653b8129ab4e78fc975f862b322d9edc2576dbfe73f2', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1025, hash: '14d3c5f1dede83906fcedd4278396edbab652f2b2ef108cce48c4b5f4253de9a', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 13183, hash: '67701079aae4a521aeccd773b96f4ed13616bd1c263ef8f26ef6427fe1011511', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'analytics/index.html': {size: 12179, hash: '1a69cdf09b9bce366092dbd4ea840d768d91aa2bda7b3b3245650fe18f7aa441', text: () => import('./assets-chunks/analytics_index_html.mjs').then(m => m.default)},
    'projects/index.html': {size: 45342, hash: 'adafa98b54b358d69cfa3305798519c85ff06a3294a5a80581b8ac11ab6c65f0', text: () => import('./assets-chunks/projects_index_html.mjs').then(m => m.default)},
    'about/index.html': {size: 101111, hash: '8cd955cb32da81667b9b785d79a64d0e823c1ecfac7db9b405e062c818493195', text: () => import('./assets-chunks/about_index_html.mjs').then(m => m.default)},
    'contact/index.html': {size: 22149, hash: 'd4cb4e9bb8728fb55a2bca889b7e05ae96abdbe431bcd0cdfbcc9e725c2e053f', text: () => import('./assets-chunks/contact_index_html.mjs').then(m => m.default)},
    'styles-JATGVDE5.css': {size: 1193, hash: 'EWs9ecpdko0', text: () => import('./assets-chunks/styles-JATGVDE5_css.mjs').then(m => m.default)}
  },
};
