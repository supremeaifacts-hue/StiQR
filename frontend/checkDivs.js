const fs = require('fs');
const text = fs.readFileSync('src/EditorPage.js','utf8').split(/\n/);
let open=0;
text.forEach((l,i)=>{
  const opens=(l.match(/<div(\s|>)/g)||[]).length;
  const closes=(l.match(/<\/div>/g)||[]).length;
  open += opens - closes;
  if(open<0) console.log('negative at',i+1,l);
});
console.log('remaining open',open);
