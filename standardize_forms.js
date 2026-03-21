const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'src', 'components', 'admin', 'cms');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const standardInputClass = 'const inputClass = "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all shadow-sm";';
const standardLabelClass = 'const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";';

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Standardize inputClass definition
    content = content.replace(/const inputClass = "w-full bg-slate-50[^"]+";/g, standardInputClass);
    content = content.replace(/const inputClass = "w-full bg-white[^"]+";/g, standardInputClass);

    // Standardize label definitions strings directly
    content = content.replace(/className="text-\[10px\] font-bold text-slate-500 uppercase"/g, 'className={labelClass}');
    content = content.replace(/className="text-\[10px\] font-bold text-slate-500 uppercase flex flex-col items-center"/g, 'className={`${labelClass} flex flex-col items-center text-center`}');

    // Add labelClass if not exists and if we're using it
    if (content.includes('className={labelClass}') && !content.includes('const labelClass =')) {
        content = content.replace(standardInputClass, `${standardInputClass}\n    ${standardLabelClass}`);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
console.log('Standardization complete.');
