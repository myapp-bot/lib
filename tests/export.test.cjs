const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync(__dirname+'/../www/index.html','utf8');
const code=html.slice(html.indexOf('let exportInProgress=false;'),html.indexOf('function exportJSON'));
function setup(cap){
 const buttons=Array.from({length:3},()=>({disabled:false}));let clicked=0;const messages=[];const errors=[];const calls=[];
 const context={window:{Capacitor:cap},document:{getElementById:id=>buttons[['exportData','backupBtn','exportCsv'].indexOf(id)],createElement:()=>({click(){clicked++},remove(){}}),body:{appendChild(){}}},Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:u=>calls.push(u)},setTimeout:fn=>calls.push(fn),toast:s=>messages.push(s),alert:s=>errors.push(s),console:{error(){}}};
 vm.createContext(context);vm.runInContext(code,context);
 return {context,buttons,messages,errors,calls,clicked:()=>clicked};
}
test('Android receives exact Unicode JSON and MIME, without browser download',async()=>{let args;const s=setup({getPlatform:()=> 'android',nativePromise:async(...a)=>{args=a;return {cancelled:false}}});await s.context.download('test.json','{"note":"Liberté 🙏"}');assert.equal(args[0],'DataExport');assert.equal(args[2].content,'{"note":"Liberté 🙏"}');assert.equal(args[2].mimeType,'application/json');assert.equal(s.clicked(),0);assert.equal(s.messages[0],'Fichier enregistré.');assert.ok(s.buttons.every(b=>!b.disabled));});
test('Cancel and failure release export buttons',async()=>{const s=setup({getPlatform:()=> 'android',nativePromise:async()=>({cancelled:true})});await s.context.download('x','y');assert.equal(s.messages[0],'Export annulé.');s.context.window.Capacitor.nativePromise=async()=>{throw Error('Espace insuffisant')};await s.context.download('x','y');assert.match(s.errors[0],/Espace insuffisant/);assert.ok(s.buttons.every(b=>!b.disabled));});
test('Concurrent taps blocked and CSV MIME normalized',async()=>{let finish;let n=0;const s=setup({getPlatform:()=> 'android',nativePromise:(p,m,args)=>{n++;assert.equal(args.mimeType,'text/csv');return new Promise(r=>finish=r)}});const pending=s.context.download('x.csv','\ufeffDate;Note','text/csv;charset=utf-8');await s.context.download('x','y');assert.equal(n,1);assert.ok(s.buttons.every(b=>b.disabled));finish({cancelled:false});await pending;});
test('Browser download and deferred URL cleanup',async()=>{const s=setup();await s.context.download('x.json','{}');assert.equal(s.clicked(),1);assert.equal(s.calls.length,1);s.calls[0]();assert.equal(s.calls[1],'blob:test');});
for(const [i,match] of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries())test('Script syntax '+i,()=>new vm.Script(match[1]));
