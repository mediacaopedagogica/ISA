// Distingue explicitamente os dois acessos da Keise.
// Raiz /ISA/ = notebook. ?perfil=Keise = mobile.
(function(){
  const profile=String(new URLSearchParams(location.search).get('perfil')||'').trim().toLowerCase()
  const mobileLink=profile==='keise'
  document.body.classList.toggle('keise-mobile-access-link',mobileLink)
  document.body.classList.toggle('keise-notebook-access-link',!mobileLink)

  if(document.getElementById('keiseAccessModeStyle'))return
  const s=document.createElement('style')
  s.id='keiseAccessModeStyle'
  s.textContent=`
    /* O link ?perfil=Keise é sempre apresentado como a versão mobile aprovada. */
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active{overflow:auto!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active #keiseDesktopTopbar{display:none!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active #mainView{
      display:block!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:100dvh!important;
      overflow:visible!important;background:linear-gradient(155deg,#fff8fb,#f7f0ff 57%,#f2f8ff)!important
    }
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active #mainView>.sidebar{display:none!important;visibility:hidden!important;width:0!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active #mainView>.content{
      display:block!important;width:100%!important;max-width:100%!important;min-height:100dvh!important;height:auto!important;
      padding:10px 10px 34px!important;overflow:visible!important
    }
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active #keiseHomeDashboard{
      width:min(520px,100%)!important;max-width:520px!important;margin:0 auto!important;padding:0 4px 28px!important
    }
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-hero{
      grid-template-columns:auto minmax(0,1fr) auto!important;
      grid-template-areas:'avatar identity logout' 'avatar status logout'!important;
      gap:7px 11px!important;padding:14px 15px!important;border-radius:28px!important;min-height:142px!important
    }
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-avatar-btn{grid-area:avatar!important;width:96px!important;height:96px!important;border-radius:26px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-avatar-content{border-radius:26px!important;font-size:52px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-identity{grid-area:identity!important;align-self:end!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-identity h1{font-size:29px!important;margin-bottom:4px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-identity p{font-size:17px!important;white-space:nowrap!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-status-btn{
      grid-area:status!important;min-width:0!important;min-height:45px!important;width:max-content!important;max-width:100%!important;
      padding:6px 13px!important;border-radius:999px!important;align-self:start!important;font-size:14px!important
    }
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-status-btn .cloud{font-size:23px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-status-btn small{display:none!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-logout{grid-area:logout!important;align-self:center!important;padding:15px 17px!important;border-radius:20px!important;font-size:17px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:9px!important;margin-top:12px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-feature,
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-feature:nth-child(n+5){grid-column:span 1!important;min-height:108px!important;border-radius:22px!important;font-size:13px!important;padding:10px 3px!important;gap:7px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-feature-icon{font-size:36px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-feature.settings .kd-feature-icon{font-size:39px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-feature.settings span:last-child{font-size:12px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-feature.private:after{font-size:8px!important;padding:4px 6px!important;top:5px!important;right:5px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-conv-head{margin-top:18px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-conv-head h2{font-size:26px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-group-btn{padding:12px 18px!important;font-size:16px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-conversations-list{max-width:none!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-conv-card{min-height:88px!important;padding:10px 12px!important;border-radius:22px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-conv-card .avatar{width:60px!important;height:60px!important}
    body.keise-mobile-access-link.keise-dashboard-mode.keise-home-active .kd-heart-deco{position:absolute!important;font-size:72px!important;right:17px!important;bottom:65px!important}
  `
  document.head.appendChild(s)
})();