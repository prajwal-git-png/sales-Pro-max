const fs = require('fs');
let code = fs.readFileSync('components/Auth.tsx', 'utf8');

// Remove imports
code = code.replace(/import \{ loginWithGooglePopup[\s\S]*?'firebase\/auth';\n/, '');
code = code.replace(/import \{ saveUser, ensureUserProfileFromGoogle \} from '\.\.\/services\/storageService';/, "import { saveUser } from '../services/storageService';");

// Remove useEffect
code = code.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[onLogin\]\);\n/, '');

// Remove google states
code = code.replace(/const \[googleLoading, setGoogleLoading\] = useState\(false\);\n/, '');
code = code.replace(/const \[authNotice, setAuthNotice\] = useState\(''\);\n/, '');
code = code.replace(/const \[googleUser, setGoogleUser\] = useState<any>\(null\);\n/, '');

// Remove handleGoogleSignIn
code = code.replace(/const handleGoogleSignIn = async \(\) => \{[\s\S]*?\};\n/, '');

// Remove google button block from render
code = code.replace(/\{\/\* Google Sign-in Option \*\/\}[\s\S]*?\{\/\* Executive Profile Form \*\/\}/, '{/* Executive Profile Form */}');

// Remove google references in handleSubmit
code = code.replace(/const customId = googleUser\?\.uid \|\| `exec_\$\{cleanName/g, 'const customId = `exec_${cleanName');
code = code.replace(/email: googleUser\?\.email \|\| `\$\{cleanName/g, 'email: `${cleanName');

fs.writeFileSync('components/Auth.tsx', code);
