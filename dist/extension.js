"use strict";var v=Object.create;var h=Object.defineProperty;var $=Object.getOwnPropertyDescriptor;var E=Object.getOwnPropertyNames;var N=Object.getPrototypeOf,R=Object.prototype.hasOwnProperty;var T=(n,t)=>{for(var e in t)h(n,e,{get:t[e],enumerable:!0})},w=(n,t,e,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of E(t))!R.call(n,s)&&s!==e&&h(n,s,{get:()=>t[s],enumerable:!(o=$(t,s))||o.enumerable});return n};var g=(n,t,e)=>(e=n!=null?v(N(n)):{},w(t||!n||!n.__esModule?h(e,"default",{value:n,enumerable:!0}):e,n)),k=n=>w(h({},"__esModule",{value:!0}),n);var L={};T(L,{activate:()=>F,deactivate:()=>C});module.exports=k(L);var i=g(require("vscode")),r=g(require("fs")),c=g(require("path"));function F(n){let t=i.commands.registerCommand("laravel-model-markdown-generator.generateDocs",async()=>{let e=j();if(!e)return;if(!P(e)){i.window.showErrorMessage("This is not a Laravel project.");return}let o=K(e),s=D(e),a=S(o,s);await _(a)});n.subscriptions.push(t)}function C(){}function u(n){let t=[];return r.existsSync(n)&&r.readdirSync(n).forEach(o=>{let s=c.join(n,o);r.statSync(s).isDirectory()?t=t.concat(u(s)):o.endsWith(".php")&&t.push(s)}),t}function K(n){let t=c.join(n,"app","Models");return u(t).map(o=>{let s=r.readFileSync(o,"utf-8"),a=c.basename(o).replace(".php","");return{name:a,tableName:y(a),relationships:I(s)}})}function D(n){let t=c.join(n,"database","migrations"),e=u(t),o=[];return e.forEach(s=>{let a=r.readFileSync(s,"utf-8"),l=a.match(/Schema::create\(['"](.+?)['"]/);if(!l)return;let M=l[1],m=[],d=[],b=/\$table->(\w+)\(['"](.+?)['"]/g,p;for(;(p=b.exec(a))!==null;)m.push({type:p[1],name:p[2]});let x=/\$table->foreign\(['"](.+?)['"]\)->references\(['"](.+?)['"]\)->on\(['"](.+?)['"]\)/g,f;for(;(f=x.exec(a))!==null;)d.push({column:f[1],references:f[2],on:f[3]});o.push({tableName:M,columns:m,foreignKeys:d})}),o}function I(n){let t=/(hasOne|hasMany|belongsTo|belongsToMany|morphTo|morphMany|morphOne)\s*\(\s*([^)]+)\)/g,e=[],o;for(;(o=t.exec(n))!==null;){let s=o[1],a=o[2],l=a.replace("::class","").split("\\").pop()?.trim();e.push({type:s,related:l||a})}return e}function S(n,t){let e=`# Database Documentation

`;return t.length===0&&(e+=`\u26A0\uFE0F No migrations found. Only model relationships were analyzed.

`),n.length===0&&(e+=`\u26A0\uFE0F No models found.

`),t.forEach(o=>{e+=`## Table: ${o.tableName}

`,e+=`### Columns

`,o.columns.length===0?e+=`_No columns detected._
`:o.columns.forEach(a=>{e+=`- ${a.name} (${a.type})
`}),o.foreignKeys.length>0&&(e+=`
### Foreign Keys

`,o.foreignKeys.forEach(a=>{e+=`- ${a.column} \u2192 ${a.on}.${a.references}
`}));let s=n.find(a=>y(a.name)===o.tableName);s&&s.relationships.length>0&&(e+=`
### Eloquent Relationships

`,s.relationships.forEach(a=>{e+=`- ${a.type} \u2192 ${a.related}
`})),e+=`
---

`}),t.length===0&&n.length>0&&(e+=`## Model Relationships

`,n.forEach(o=>{e+=`### ${o.name}

`,o.relationships.length===0?e+=`_No relationships detected._

`:(o.relationships.forEach(s=>{e+=`- ${s.type} \u2192 ${s.related}
`}),e+=`
`)})),e}function y(n){return n.toLowerCase()+"s"}function j(){let n=i.workspace.workspaceFolders;return!n||n.length===0?(i.window.showErrorMessage("No workspace open."),null):n[0].uri.fsPath}function P(n){return r.existsSync(c.join(n,"artisan"))}async function _(n){let t=await i.workspace.openTextDocument({content:n,language:"markdown"});await i.window.showTextDocument(t)}0&&(module.exports={activate,deactivate});
