// Chat logic + client-side TF-IDF fallback (used if Python backend is unreachable)
const FAQS = [
 {
  "question": "What is the tuition fee for the semester?",
  "answer": "The tuition fee is announced for each programme in the fee circular on the college notice board and student portal. Please check the circular for your programme and year."
 },
 {
  "question": "How can I pay my college fees online?",
  "answer": "Log in to the student portal, open the Fee Payment section, select the pending fee, and pay using net banking, UPI, debit card or credit card. Download the receipt after payment."
 },
 {
  "question": "Can I pay my fees in cash at the college office?",
  "answer": "Yes. Fees can be paid in cash, by demand draft or by card at the accounts office during working hours. Always collect the official receipt."
 },
 {
  "question": "What is the last date to pay the semester fee?",
  "answer": "The last date is mentioned in the fee circular issued at the start of each semester. Payments after the due date attract a late fee."
 },
 {
  "question": "Is there a late fee or fine for delayed payment?",
  "answer": "Yes. A fine per day or a fixed late fee is charged after the due date. Contact the accounts office to confirm the current amount."
 },
 {
  "question": "Can I pay the fees in instalments?",
  "answer": "Instalment payment may be permitted on a written request to the Principal with valid reasons. Approval is decided by the accounts office."
 },
 {
  "question": "How do I download my fee receipt?",
  "answer": "Sign in to the student portal, go to Fee Payment, then Payment History, and click Download Receipt next to the transaction."
 },
 {
  "question": "What should I do if the money was deducted but the payment failed?",
  "answer": "Wait 2 to 3 working days for an automatic refund or status update. If unresolved, send the transaction ID and screenshot to the accounts office."
 },
 {
  "question": "What are the examination fees and how are they paid?",
  "answer": "Examination fees are notified before every semester exam and are paid through the student portal or the accounts office before the stated deadline."
 },
 {
  "question": "How do I apply for a scholarship?",
  "answer": "Apply through the student portal or the relevant government scholarship website, upload the required documents, and submit the form before the deadline. Get it verified by the scholarship coordinator."
 },
 {
  "question": "What documents are required for scholarship application?",
  "answer": "Usually required are the community certificate, income certificate, previous marksheet, Aadhaar card, bank passbook copy, passport photo and fee receipt."
 },
 {
  "question": "Who is eligible for a merit scholarship?",
  "answer": "Students with high academic performance, as per the percentage or CGPA cut-off in the scholarship notice, are eligible for merit scholarships."
 },
 {
  "question": "Are there scholarships for SC, ST, BC and MBC students?",
  "answer": "Yes. Government post-matric scholarships are available for eligible SC, ST, BC, MBC and minority students. Contact the scholarship coordinator for details."
 },
 {
  "question": "Is there a fee concession for economically weaker students?",
  "answer": "Fee concession may be granted to economically weaker students based on income proof and a written application to the Principal."
 },
 {
  "question": "What is the last date to apply for a scholarship?",
  "answer": "Scholarship deadlines are published on the notice board and student portal each year. Apply early to allow time for verification."
 },
 {
  "question": "How long does it take to receive the scholarship amount?",
  "answer": "Scholarships are usually credited directly to the student's bank account after verification, which can take a few weeks to a few months depending on the scheme."
 },
 {
  "question": "How can I check my scholarship application status?",
  "answer": "Check the status on the scholarship portal with your application number, or ask the scholarship coordinator at the college office."
 },
 {
  "question": "How do I get a refund of fees if I withdraw from the course?",
  "answer": "Refunds follow the college refund policy and depend on the withdrawal date. Submit a written request with your receipt to the accounts office."
 },
 {
  "question": "Are there education loans available for students?",
  "answer": "Yes. Students can apply for education loans from nationalised banks. The college issues a fee structure and bonafide certificate to support the loan application."
 },
 {
  "question": "How do I get a fee structure or bonafide certificate for a loan?",
  "answer": "Apply at the academic office with your ID card and a request letter. The certificate is usually issued within 2 to 3 working days."
 },
 {
  "question": "What are the hostel and bus fees, and are they included in tuition?",
  "answer": "Hostel, mess and transport fees are charged separately from tuition fees. Amounts are given in the fee circular."
 },
 {
  "question": "Is there a separate fee for laboratory, library or other charges?",
  "answer": "Laboratory, library, caution deposit and other charges are listed in the fee structure. The caution deposit is refundable at the end of the course."
 },
 {
  "question": "Who should I contact for fee and scholarship queries?",
  "answer": "Contact the accounts office for fee matters and the scholarship coordinator for scholarships. Both are available during working hours on the administrative block."
 }
];
const THRESHOLD = 0.25;
const STOP = new Set("a an the is are was were be been am i me my we you your it its of in on at to for from by with and or but if as do does did can could should would will shall may might what which who whom how when where why this that these those there here about into than then so not no yes please tell".split(" "));
const SYN = {fees:"fee",charges:"fee",payment:"pay",paying:"pay",paid:"pay",scholarships:"scholarship",bursary:"scholarship",grant:"scholarship",documents:"document",certificate:"document",refunds:"refund",loans:"loan",instalments:"instalment",installment:"instalment",installments:"instalment",upi:"online",deadline:"date"};
const THRESH_MSG = "Sorry, I could not find a matching answer. Please contact the accounts office or the scholarship coordinator.";
const EMPTY_MSG = "Please type a question about college fees or scholarships.";

function pre(t){return (t.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>!STOP.has(w)).map(w=>SYN[w]||w);}
const docs = FAQS.map(f=>pre(f.question));
const vocab = [...new Set(docs.flat())];
const idf = {}; vocab.forEach(w=>{const df=docs.filter(d=>d.includes(w)).length; idf[w]=Math.log((1+docs.length)/(1+df))+1;});
function vec(tokens){const v={};tokens.forEach(w=>{if(idf[w])v[w]=(v[w]||0)+1;});let n=0;for(const w in v){v[w]*=idf[w];n+=v[w]*v[w];}n=Math.sqrt(n)||1;for(const w in v)v[w]/=n;return v;}
const docVecs = docs.map(vec);
function localAsk(q){
  const tokens=pre(q); if(!tokens.length) return {answer:EMPTY_MSG,matched:null,score:0};
  const qv=vec(tokens); let best=0,bi=-1;
  docVecs.forEach((dv,i)=>{let s=0;for(const w in qv)if(dv[w])s+=qv[w]*dv[w];if(s>best){best=s;bi=i;}});
  return best>=THRESH ? {answer:FAQS[bi].answer,matched:FAQS[bi].question,score:best} : {answer:THRESH_MSG,matched:null,score:best};
}
const THRESH = THRESHOLD;

async function ask(q){
  try{
    const r=await fetch("/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q})});
    if(!r.ok) throw new Error("bad");
    return await r.json();
  }catch(e){return localAsk(q);}
}

const chat=document.getElementById("chat"), input=document.getElementById("input");
function add(text,who,meta){
  const d=document.createElement("div"); d.className="msg "+who; d.textContent=text;
  if(meta){const m=document.createElement("span");m.className="meta";m.textContent=meta;d.appendChild(m);}
  chat.appendChild(d); chat.scrollTop=chat.scrollHeight;
}
async function send(text){
  text=(text||input.value).trim(); if(!text) return;
  add(text,"user"); input.value="";
  const r=await ask(text);
  add(r.answer,"bot", r.matched ? `Matched FAQ: ${r.matched} (${(r.score*100).toFixed(1)}% similarity)` : null);
}
function welcome(){add("Hello! I can answer questions about college fees, payments and scholarships. Try a suggestion below or type your own question.","bot");}
document.getElementById("send").onclick=()=>send();
input.addEventListener("keydown",e=>{if(e.key==="Enter")send();});
document.getElementById("clear").onclick=()=>{chat.innerHTML="";welcome();};
const chips=document.getElementById("chips");
["How can I pay my college fees online?","How do I apply for a scholarship?","What documents are required for scholarship application?","Is there a late fee or fine for delayed payment?","Are there education loans available for students?"].forEach(q=>{const b=document.createElement("button");b.textContent=q;b.onclick=()=>send(q);chips.appendChild(b);});
welcome();
