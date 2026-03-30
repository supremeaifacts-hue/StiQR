const fs = require('fs');
const text = fs.readFileSync('src/EditorPage.js','utf8').split(/\n/);
let open=0;
text.forEach((l,i)=>{
  const opens=(l.match(/<div(\s|>)/g)||[]).length;
  const closes=(l.match(/<\/div>/g)||[]).length;
  if(opens||closes) console.log(i+1, 'opens',opens,'closes',closes,'->',open+opens-closes);
  open += opens - closes;
});
console.log('remaining open',open);
