/* Native enhancements; resume content remains in the HTML. */
(() => {
  'use strict';
  const nav = document.querySelector('.site-header nav');
  const menu = document.querySelector('.menu-toggle');
  nav.id = 'mobile-nav';
  const closeMenu = () => {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', '展开导航');
  };
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '收起导航' : '展开导航');
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (nav.classList.contains('is-open')) { closeMenu(); menu.focus(); }
      document.querySelectorAll('.qr-btn-container.is-open').forEach(el => {
        el.classList.remove('is-open');
        el.querySelector('a').setAttribute('aria-expanded', 'false');
      });
    }
  });
  const sections = [...document.querySelectorAll('main > .swiper-wrapper1 > section')];
  const updateNavigation = () => {
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    const current = atBottom ? sections[sections.length - 1] :
      sections.filter(section => section.getBoundingClientRect().top <= window.innerHeight * 0.35).pop() || sections[0];
    nav.querySelectorAll('a').forEach(link => {
      if (link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  let navigationFrame = 0;
  const scheduleNavigation = () => {
    if (navigationFrame) return;
    navigationFrame = requestAnimationFrame(() => {
      navigationFrame = 0;
      updateNavigation();
    });
  };
  window.addEventListener('scroll', scheduleNavigation, { passive: true });
  window.addEventListener('resize', scheduleNavigation);
  updateNavigation();
  // Keep the original skill names and percentages from the source inputs.
  document.querySelectorAll('.get .arc').forEach((arc, index) => {
    const item = document.querySelectorAll('.skills li')[index];
    const percent = arc.querySelector('.percent').value;
    if (!item) return;
    item.style.setProperty('--level', percent + '%');
    const value = document.createElement('span');
    value.className = 'skill-value'; value.textContent = percent + '%';
    item.append(value);
  });
  const group = document.querySelector('.glass-radio-group');
  const all = document.createElement('input');
  all.type = 'radio'; all.name = 'project-page'; all.id = 'projects-all'; all.checked = true;
  const allLabel = document.createElement('label');
  allLabel.htmlFor = all.id; allLabel.textContent = '全部项目';
  group.prepend(all, allLabel);
  group.setAttribute('role', 'group'); group.setAttribute('aria-label', '项目分类');
  const pages = [...document.querySelectorAll('.swiper-container2 > .swiper-wrapper > .swiper-slide')];
  group.addEventListener('change', event => {
    const radios = [...group.querySelectorAll('input')];
    const selected = radios.indexOf(event.target) - 1;
    pages.forEach((page, index) => { page.hidden = selected !== -1 && index !== selected; });
  });
  document.querySelectorAll('.project-card').forEach((card, index) => { card.dataset.index = String(index + 1).padStart(2, '0') + ' / PROJECT'; });
  const toast = document.querySelector('.toast');
  let toastTimer;
  document.querySelectorAll('.project-link-disabled').forEach(link => link.addEventListener('click', event => {
    event.preventDefault(); clearTimeout(toastTimer);
    toast.textContent = link.dataset.reason || '项目正在维护中...';
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 6000);
  }));
  document.querySelectorAll('.qr-btn-container').forEach(container => {
    const trigger = container.querySelector('a');
    trigger.addEventListener('click', event => {
      event.preventDefault();
      const open = container.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', event => {
    if (event.target.closest('.qr-btn-container')) return;
    document.querySelectorAll('.qr-btn-container.is-open').forEach(el => {
      el.classList.remove('is-open'); el.querySelector('a').setAttribute('aria-expanded', 'false');
    });
  });
  const top = document.querySelector('.back-top');
  const updateTop = () => top.classList.toggle('visible', window.scrollY > 500);
  window.addEventListener('scroll', updateTop, { passive: true }); updateTop();
  top.addEventListener('click', () => { document.querySelector('.wordmark').focus({preventScroll:true}); window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}); });
  let printState = [];
  window.addEventListener('beforeprint', () => {
    printState = [...document.querySelectorAll('.project-details')].map(el => [el, el.open]);
    printState.forEach(([el]) => { el.open = true; });
    pages.forEach(page => { page.dataset.beforePrintHidden = String(page.hidden); page.hidden = false; });
  });
  window.addEventListener('afterprint', () => {
    printState.forEach(([el, open]) => { el.open = open; });
    pages.forEach(page => { page.hidden = page.dataset.beforePrintHidden === 'true'; });
  });
})();
