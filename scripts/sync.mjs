import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EDIT_TOOLS,SHELL_TOOLS} from '../hooks/common.mjs';
export const root=fileURLToPath(new URL('..',import.meta.url));
export const names=['argon-core','argon-builder','argon-director'];
export function hookConfig(runtimeRoot='.', executable='bun') {
  const normalizedRoot=runtimeRoot.replaceAll('\\','/').replace(/\/+$/,'');
  const command=file=>`${executable} "${normalizedRoot}/hooks/${file}" --host antigravity`;
  return {'argon-protocols':{enabled:true,
    PreToolUse:[{matcher:`^(${[...EDIT_TOOLS,...SHELL_TOOLS].join('|')})$`,hooks:[{type:'command',command:command('pre-edit-audit.ts'),timeout:10}]}],
    PostToolUse:[{matcher:`^(${[...EDIT_TOOLS].join('|')})$`,hooks:[{type:'command',command:command('post-edit-slop.ts'),timeout:10}]}],
    PreInvocation:[{type:'command',command:command('feedback.mjs'),timeout:10}]
  }};
}
export function sync() {
  const shared=fs.readFileSync(path.join(root,'docs/PROTOCOL.md'),'utf8');
  for(const name of names){
    const ref=path.join(root,'skills',name,'references');fs.mkdirSync(ref,{recursive:true});fs.writeFileSync(path.join(ref,'protocol.md'),shared);
    const skill=fs.readFileSync(path.join(root,'skills',name,'SKILL.md'),'utf8');
    const description=/^description: (.*)$/m.exec(skill)[1];
    const agent=`---\nname: ${name}\ndescription: ${description}\ntools:\n  - view_file\n  - write_to_file\n  - replace_file_content\n  - multi_replace_file_content\n  - grep_search\n  - find_by_name\n  - list_dir\n  - run_command\nmodel: flash\nmainAgent: false\nsubagent: true\ncommandExecutionPolicy: sandbox\nskills:\n  - skills/${name}\n---\n\n# ${name} 10.0\n\nAplica la skill skills/${name}/SKILL.md y su contrato operativo. Respeta el objetivo, permisos y alcance del padre; no delegues ni amplíes la tarea por tu cuenta. Usa únicamente herramientas disponibles. Los hooks solo están activos si el anfitrión los carga; no afirmes verificación inexistente.\n\nDevuelve resultado o causa del bloqueo, archivos modificados, comandos y resultados reales, pendientes y riesgos concretos. Una prueba que no pudo ejecutarse debe figurar como no verificada. Conserva cambios ajenos.\n`;
    fs.writeFileSync(path.join(root,'agents',`${name}.md`),agent);
  }
  const hooks=JSON.stringify(hookConfig(),null,2)+'\n';for(const file of ['hooks.json','hooks.template.json'])fs.writeFileSync(path.join(root,file),hooks);
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'plugin.json'),'utf8'));
  // Default component directories are auto-discovered; unsupported keys fail strict schema validation.
  delete manifest.agents;delete manifest.hooks;delete manifest.skills;
  manifest.version='10.0.0';manifest.description='Evidence-guided engineering skills with current-turn audits, host-specific hooks, AST review diagnostics, and reproducible command receipts.';
  manifest.keywords=['antigravity','engineering','skills','audit','verification'];
  manifest.suggestedPrompts=['Revisa este proyecto con argon-core y verifica las correcciones','Construye una aplicación completa con argon-builder','Usa argon-director para componer y verificar este vídeo'];
  fs.writeFileSync(path.join(root,'plugin.json'),JSON.stringify(manifest,null,2)+'\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){sync();console.log('Synchronized skills, agent definitions, manifests and hook templates.');}
