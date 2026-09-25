const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('index.html','utf8');
for(const m of html.matchAll(/<script(.*?)>([\s\S]*?)<\/script>/g))if(!m[1].includes('src=')&&!m[1].includes('type="module"'))new Function(m[2]);
let requests=[],els={},reply={ok:true,status:200,text:async()=>JSON.stringify({content:[{text:'Synthetic answer'}]})};
const c={console,AbortController,setTimeout,clearTimeout,TypeError,document:{querySelectorAll:()=>[],getElementById:id=>els[id]},getVisibleFoods:()=>[],activeDrawer:'ai',foods:[],activeCondition:null,filter:'all',loadDiaryAndProfiles(){},getPlateTargets:()=>({kcal:2000,protein:100,fiber:30}),getPlateSummaryForAI:()=>'',getProfileById:()=>({name:'PRIVATE_NAME',note:'PRIVATE_NOTE'}),activeProfileId:'test',fetch:async(url,opts)=>{requests.push(JSON.parse(opts.body));return reply},openDrawer(){}};
vm.createContext(c);vm.runInContext(html.slice(html.indexOf('var aiConversation=[];'),html.indexOf('function renderCombos()')),c);
c.appendMsg=(role,text,id)=>{if(id){const bubble={textContent:text};els[id]={dataset:{},querySelector:()=>bubble}}};
const settle=()=>new Promise(r=>setImmediate(r));
(async()=>{
 c.aiAsk('First');await settle();assert.equal(c.aiConversation.length,2);assert(!JSON.stringify(requests[0]).includes('PRIVATE_'));
 c.aiAsk('Follow up');await settle();assert.equal(requests[1].messages.length,3);assert.equal(requests[1].messages[1].content,'Synthetic answer');
 reply={ok:false,status:501,text:async()=>'<html>server trace</html>'};c.aiAsk('Failure');await settle();assert.equal(c.aiConversation.length,4);assert.equal(c.aiPending,false);assert(Object.values(els).some(e=>e.querySelector().textContent.includes('AI is unavailable')));assert(!Object.values(els).some(e=>e.querySelector().textContent.includes('<html>')));
 reply={ok:true,status:200,text:async()=>'{}'};c.aiAsk('Empty response');await settle();assert.equal(c.aiConversation.length,4);
 c.startNewAIChat();assert.equal(c.aiConversation.length,0);
 console.log('PASS: JS syntax, profile exclusion, follow-up context, 501 sanitization, empty response exclusion, pending reset, new chat');
})().catch(e=>{console.error(e);process.exitCode=1});
