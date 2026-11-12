import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,names,hookConfig} from './sync.mjs';
const failures=[];const check=(condition,message)=>{if(!condition)failures.push(message);};
const shared=fs.readFileSync(path.join(root,'docs/PROTOCOL.md'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'plugin.json'),'utf8'));
check(manifest.version===JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,'Version mismatch');
const manifestKeys=new Set(['$schema','name','displayName','description','version','disabled','logo','suggestedPrompts','skills','author','homepage','repository','license','keywords','extensions']);
check(Object.keys(manifest).every(k=>manifestKeys.has(k)),'Unsupported plugin manifest field');
for(const name of names){
  const file=path.join(root,'skills',name,'SKILL.md'),content=fs.readFileSync(file,'utf8');
  check(content.startsWith(`---\nname: ${name}\ndescription: `),'Invalid skill frontmatter: '+name);
  check(/^description: [^<>\n]{1,1024}$/m.test(content),'Invalid description: '+name);
  check(content.split('\n').length<150,'Entrypoint too long: '+name);
  check(fs.readFileSync(path.join(root,'skills',name,'references/protocol.md'),'utf8')===shared,'Shared reference drift: '+name);
  for(const m of content.matchAll(/\]\(([^)]+)\)/g))if(!m[1].includes('://'))check(fs.existsSync(path.resolve(path.dirname(file),m[1])),'Missing reference: '+m[1]);
  const agent=fs.readFileSync(path.join(root,'agents',`${name}.md`),'utf8');
  check(agent.includes('commandExecutionPolicy: sandbox'),'Agent must preserve sandbox: '+name);
  check(!/\n  - (MultiEdit|read_file|edit_file|write_file)\n/.test(agent),'Agent has host-incompatible tools: '+name);
}
for(const file of ['hooks.json','hooks.template.json'])check(JSON.stringify(JSON.parse(fs.readFileSync(path.join(root,file),'utf8')))===JSON.stringify(hookConfig()),'Hook matcher/template drift: '+file);
for(const dir of ['hooks','scripts','tests','evals'])for(const file of fs.readdirSync(path.join(root,dir)).filter(x=>/\.(mjs|ts)$/.test(x))){
  const r=spawnSync(process.execPath,['--check',path.join(root,dir,file)],{encoding:'utf8'});check(r.status===0,`${dir}/${file}: ${r.stderr}`);
}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}else console.log('PASS: skill structure, references, versions, agents, hook adapters and JavaScript syntax.');
