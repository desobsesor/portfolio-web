export default `:root{--background-primary: #0a0a0f;--background-secondary: rgba(255, 255, 255, .05);--text-primary: #ffffff;--text-secondary: rgba(255, 255, 255, .7);--accent-blue: #0874f0;--accent-pink: #ff49db;--gradient-primary: linear-gradient(60deg, var(--accent-blue), #FFFFFF, var(--accent-pink));--spacing-xs: .25rem;--spacing-sm: .5rem;--spacing-md: 1rem;--spacing-lg: 1.5rem;--spacing-xl: 2rem;--radius-sm: 4px;--radius-md: 8px;--radius-lg: 12px;--radius-full: 9999px;--transition-normal: .3s}html,body{margin:0;padding:0;background:var(--background-primary);color:var(--text-primary);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif;line-height:1.6;min-height:100vh}@mixin glass-effect{background: rgba(255,255,255,.05); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.1);}@mixin neu-effect{background: rgba(255,255,255,.05); box-shadow: 0 4px 15px rgba(0,0,0,.1);}@mixin hover-lift{transition: transform var(--transition-normal) ease; &:hover {transform: translateY(-2px);}}.glass{@include glass-effect();}.neu{@include neu-effect();}.hover-lift{@include hover-lift();}
`;