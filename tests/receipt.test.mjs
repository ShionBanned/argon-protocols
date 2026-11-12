import test from 'node:test';
import assert from 'node:assert/strict';
import {runCheck} from '../scripts/receipt.mjs';
const base={task:'test',claim:'A specific acceptance check',timeoutMs:10000};
test('no implicit git status acceptance or missing executable',async()=>{await assert.rejects(runCheck({...base,command:[]}),/explicit/);});
test('drains large stdout and stderr concurrently without deadlock',async()=>{
  const r=await runCheck({...base,maxOutputBytes:1000,command:[process.execPath,'-e','process.stdout.write("x".repeat(1000000));process.stderr.write("y".repeat(1000000));']});
  assert.equal(r.verdict,'CHECK_PASSED');assert.equal(r.evidence.output_truncated,true);assert.equal(r.evidence.stdout.length,1000);assert.equal(r.evidence.stderr.length,1000);
});
test('nonzero, spawn failure, and timeout are distinct',async()=>{
  assert.equal((await runCheck({...base,command:[process.execPath,'-e','process.exit(7)']})).verdict,'CHECK_FAILED');
  assert.equal((await runCheck({...base,command:['argon-no-such-executable-12345']})).verdict,'EXECUTION_ERROR');
  assert.equal((await runCheck({...base,timeoutMs:200,command:[process.execPath,'-e','setInterval(()=>{},1000)']})).verdict,'TIMED_OUT');
});
test('argument text is never executed by a shell',async()=>{
  const literal='$(whoami) & echo PWNED';const r=await runCheck({...base,command:[process.execPath,'-e','console.log(process.argv[1])',literal]});assert.equal(r.evidence.stdout.trim(),literal);
});
