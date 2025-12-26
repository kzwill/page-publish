var e={success:{bgColor:`#f0f9eb`,color:`#67c23a`,icon:`✅`},error:{bgColor:`#fef0f0`,color:`#f56c6c`,icon:`❌`},warning:{bgColor:`#fdf6ec`,color:`#e6a23c`,icon:`⚠️`},info:{bgColor:`#f4f4f5`,color:`#909399`,icon:`ℹ️`}},t=null;function n(){if(t)return t;let e=document.createElement(`div`);return e.style.cssText=`
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    pointer-events: none;
  `,document.body.appendChild(e),t=e,e}function r(r,i=`info`,a=3e3){let o=n(),{bgColor:s,color:c,icon:l}=e[i],u=document.createElement(`div`);u.style.cssText=`
    background: ${s};
    color: ${c};
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 80%;
    min-width: fit-content;
    word-break: break-word;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.3s, transform 0.3s;
    pointer-events: auto;
    cursor: pointer;
  `,u.innerHTML=`<span>${l}</span> ${r}`,requestAnimationFrame(()=>{u.style.opacity=`1`,u.style.transform=`translateY(0)`});let d=()=>{u.style.opacity=`0`,u.style.transform=`translateY(-20px)`,u.addEventListener(`transitionend`,()=>{u.remove(),t&&t.children.length===0&&(t.remove(),t=null)},{once:!0})};u.addEventListener(`click`,d),o.appendChild(u),a>0&&setTimeout(d,a)}var i=!1;function a(){if(i)return;let e=document.createElement(`style`);e.textContent=`
    @keyframes message-loading-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `,document.head.appendChild(e),i=!0}var o=class{constructor(e,t){a(),this.mask=this.createMask(e,t)}createMask(e,t){let{text:n,background:r,cssText:i}=t,a=document.createElement(`div`),o=`${`
      position: ${e?`absolute`:`fixed`};
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      pointer-events: none;
    `} background: ${r??(e?`rgba(255, 255, 255, 0.8)`:`rgba(0, 0, 0, 0.4)`)};`;if(i){let e=i.trim().endsWith(`;`)?i:i+`;`;o+=e}a.style.cssText=o;let s=document.createElement(`div`);if(s.style.cssText=`
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #409eff;
      border-radius: 50%;
      animation: message-loading-spin 1s linear infinite;
    `,a.appendChild(s),n){let e=document.createElement(`div`);e.style.cssText=`
        margin-top: 10px;
        color: #666;
        font-size: 14px;
      `,e.textContent=n,a.appendChild(e)}return e?(getComputedStyle(e).position===`static`&&(e.style.position=`relative`),e.appendChild(a)):document.body.appendChild(a),a}close(){this.mask.parentNode&&this.mask.remove()}},s={success:(e,t=3e3)=>r(e,`success`,t),error:(e,t=3e3)=>r(e,`error`,t),warning:(e,t=3e3)=>r(e,`warning`,t),info:(e,t=3e3)=>r(e,`info`,t),loading:(e,t)=>{let n={};return n=typeof e==`string`?{text:e,...t}:typeof e==`object`&&e?e:t||{},new o(n.target??null,n)}};typeof window<`u`&&(window.Message=s);export{s as t};