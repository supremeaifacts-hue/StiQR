const fs = require('fs');
const text = fs.readFileSync('src/EditorPage.js','utf8').split(/\n/);
let stack=[];
text.forEach((l,i)=>{
  const opens=(l.match(/<div(\s|>)/g)||[]).length;
  const closes=(l.match(/<\/div>/g)||[]).length;
  for(let j=0;j<opens;j++) stack.push(i+1);
  for(let j=0;j<closes;j++) stack.pop();
});
console.log('unmatched opens', stack);