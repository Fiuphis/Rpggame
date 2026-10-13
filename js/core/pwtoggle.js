/* Icone de olho para mostrar/ocultar senha em campos .fld com input password. */
(function(){
  var css='.fld.pwt{position:relative}.fld.pwt input{padding-left:38px;padding-right:38px;text-transform:none}'
   +'.pwt-b{position:absolute;right:2px;top:50%;transform:translateY(-50%);width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:0;background:none;padding:0;cursor:pointer;color:#e8c46a;-webkit-tap-highlight-color:transparent}'
   +'.pwt-b svg{width:22px;height:22px;display:block;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
   +'.pwt-b .off{display:none}.pwt-b.on .off{display:block}.pwt-b.on .eye{display:none}.pwt-b:active{opacity:.7}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  var SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><g class="eye"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></g><g class="off"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></g></svg>';
  function add(i){
    var f=i.parentNode;if(!f||f.classList.contains('pwt'))return;
    f.classList.add('pwt');
    var b=document.createElement('button');b.type='button';b.className='pwt-b';b.innerHTML=SVG;
    b.setAttribute('aria-label','Mostrar senha');b.setAttribute('aria-pressed','false');
    b.addEventListener('click',function(){
      var show=i.type==='password';i.type=show?'text':'password';
      b.classList.toggle('on',show);b.setAttribute('aria-pressed',show?'true':'false');
      b.setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');
    });
    f.appendChild(b);
  }
  function run(){Array.prototype.forEach.call(document.querySelectorAll('.fld input[type=password]'),add)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();
