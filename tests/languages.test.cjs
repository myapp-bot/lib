const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../www/index.html'),'utf8');
const errors=[];let voicesRead=0;
function open(saved){const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));return new JSDOM(html,{url:'https://liberte.test',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.matchMedia=()=>({matches:false});w.scrollTo=()=>{};w.confirm=()=>true;w.HTMLElement.prototype.scrollIntoView=()=>{};w.speechSynthesis={getVoices:()=>[{name:'Français',lang:'fr-FR'}],cancel(){},resume(){},speak(){voicesRead++}};if(saved)w.localStorage.setItem('liberte90_v2',saved)}})}
(async()=>{const dom=open(),w=dom.window,d=w.document;
const initial=w.eval('JSON.stringify(state.library)');
d.getElementById('quickNote').value='Brouillon personnel tsy voatahiry';
const chooseLanguage=lang=>{const select=d.getElementById('languageChoice');select.value=lang;select.dispatchEvent(new w.Event('change',{bubbles:true}))};
for(let i=0;i<3;i++){
 chooseLanguage('mg');assert.equal(d.documentElement.lang,'mg');assert(d.querySelector('.drawer').textContent.includes('Fandraisana'));
 assert(d.getElementById('meditationVerses').textContent.includes('fahafahana'));
 chooseLanguage('fr');assert.equal(d.documentElement.lang,'fr');assert(d.getElementById('meditationVerses').textContent.includes('liberté'));
}
assert.equal(d.getElementById('quickNote').value,'Brouillon personnel tsy voatahiry');assert.equal(w.eval('JSON.stringify(state.library)'),initial);
chooseLanguage('mg');
d.querySelector('[data-add-kind="verset"]').click();d.getElementById('contentTitle').value='Accueil';d.getElementById('contentText').value='Note personnelle <script> non exécutée';d.getElementById('saveContent').click();
assert(d.getElementById('meditationVerses').textContent.includes('Accueil'));assert.equal(d.querySelectorAll('#meditationVerses script').length,0);
d.querySelector('#meditationVerses [data-edit-content="meditation-0"]').click();assert(d.getElementById('contentText').value.includes('fahafahana'));d.getElementById('contentText').value='Andininy manokana amin’ny teny malagasy';d.getElementById('saveContent').click();
assert(d.getElementById('meditationVerses').textContent.includes('Andininy manokana'));chooseLanguage('fr');assert(d.getElementById('meditationVerses').textContent.includes("l'Esprit du Seigneur"));assert(!d.getElementById('meditationVerses').textContent.includes('Andininy manokana'));
chooseLanguage('mg');assert(d.getElementById('meditationVerses').textContent.includes('Andininy manokana'));await w.speakText('Lahatsoratra');assert.equal(voicesRead,0);assert(d.getElementById('toast').textContent.includes('Tsy misy feo malagasy'));
const stored=w.localStorage.getItem('liberte90_v2');dom.window.close();const next=open(stored);assert.equal(next.window.document.documentElement.lang,'mg');assert(next.window.document.getElementById('meditationVerses').textContent.includes('Andininy manokana'));next.window.close();assert.deepEqual(errors,[]);console.log('PASS: reversible FR/MG, language retention, unchanged source data and drafts, language-specific editing, no incorrect speech fallback.');
})().catch(e=>{console.error(e);process.exit(1)});
