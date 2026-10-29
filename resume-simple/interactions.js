/* Optional interaction layer. Resume copy and native navigation stay in the HTML. */
(() => {
  'use strict';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const play = (element, frames, options = {}) => {
    if (!motion.matches && element.animate) {
      return element.animate(frames, { duration: 500, easing: 'cubic-bezier(.2,.7,.2,1)', ...options });
    }
  };

  // No content is hidden while waiting for JS or an observer callback.
  if ('IntersectionObserver' in window) {
    const entrances = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        if (target.matches('.skills')) target.classList.add('is-visible');
        else play(target, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }]);
        entrances.unobserve(target);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.section-heading, .W-introduce, .skills, .skills-text, .experience-card, .project-card, .W-lian')
      .forEach(element => entrances.observe(element));
  }

  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.querySelector('.site-header').append(progress);
  const timeline = [...document.querySelectorAll('.experience-node')];
  const timelineTrack = document.querySelector('.W-experience-timeline');
  const experienceCards = [...document.querySelectorAll('.experience-card')];
  let followedExperience = '';
  let followedTrackWidth = 0;
  let draggingTimeline = false;
  timelineTrack.addEventListener('pointerdown', () => { draggingTimeline = true; });
  window.addEventListener('pointerup', () => { draggingTimeline = false; });
  window.addEventListener('pointercancel', () => { draggingTimeline = false; });
  let scrollFrame = 0;
  const updateReading = () => {
    scrollFrame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
    const cards = experienceCards;
    const current = cards.filter(card => card.getBoundingClientRect().top < innerHeight * 0.45).pop() || cards[0];
    timeline.forEach(link => {
      const active = link.hash === '#' + current.id;
      link.classList.toggle('is-current', active);
      if (active) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    // Move only this horizontal track, never the page. Do not fight a manual swipe.
    const trackWidth = timelineTrack.clientWidth;
    if (followedExperience !== current.id || followedTrackWidth !== trackWidth) {
      followedExperience = current.id;
      followedTrackWidth = trackWidth;
      const activeLink = timeline.find(link => link.hash === '#' + current.id);
      if (!draggingTimeline && activeLink && timelineTrack.scrollWidth > trackWidth + 1) {
        const trackRect = timelineTrack.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        const left = timelineTrack.scrollLeft + linkRect.left - trackRect.left - (trackWidth - linkRect.width) / 2;
        timelineTrack.scrollTo({ left: Math.max(0, Math.min(left, timelineTrack.scrollWidth - trackWidth)),
          behavior: motion.matches ? 'instant' : 'smooth' });
      }
    }
  };
  const scheduleReading = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateReading); };
  window.addEventListener('scroll', scheduleReading, { passive: true });
  window.addEventListener('resize', scheduleReading);
  // Expanding details and changing categories also change the reading distance.
  if ('ResizeObserver' in window) new ResizeObserver(scheduleReading).observe(document.querySelector('main'));
  updateReading();

  const art = document.querySelector('.hero-art');
  let artInView = false;
  const updateArtActivity = () => art.classList.toggle('is-in-view', artInView && !document.hidden && !motion.matches);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      artInView = entries[0].isIntersecting;
      updateArtActivity();
    }).observe(art);
  }
  document.addEventListener('visibilitychange', updateArtActivity);
  motion.addEventListener('change', updateArtActivity);
  art.addEventListener('pointerenter', () => {
    if (finePointer.matches && !motion.matches) art.classList.add('is-pointer-active');
  });
  let pointerFrame = 0;
  art.addEventListener('pointermove', event => {
    if (!finePointer.matches || motion.matches || pointerFrame) return;
    const { clientX, clientY } = event;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      const rect = art.getBoundingClientRect();
      art.style.setProperty('--turn-x', `${-(clientY - rect.top - rect.height / 2) / rect.height * 7}deg`);
      art.style.setProperty('--turn-y', `${(clientX - rect.left - rect.width / 2) / rect.width * 9}deg`);
    });
  });
  const resetArt = () => {
    cancelAnimationFrame(pointerFrame); pointerFrame = 0;
    art.classList.remove('is-pointer-active');
    art.style.removeProperty('--turn-x'); art.style.removeProperty('--turn-y');
  };
  art.addEventListener('pointerleave', resetArt);
  motion.addEventListener('change', resetArt);
  finePointer.addEventListener('change', resetArt);

  document.querySelectorAll('.project-card').forEach(card => {
    let frame = 0;
    card.addEventListener('pointermove', event => {
      if (!finePointer.matches || motion.matches || frame) return;
      const { clientX, clientY } = event;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--light-x', `${clientX - rect.left}px`);
        card.style.setProperty('--light-y', `${clientY - rect.top}px`);
      });
    });
    card.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); frame = 0; });
    const summary = card.querySelector('summary');
    const label = document.createElement('span'); label.textContent = summary.textContent;
    summary.replaceChildren(label);
    const icon = document.createElement('span'); icon.className = 'details-icon';
    icon.setAttribute('aria-hidden', 'true'); summary.append(icon);
    const details = card.querySelector('details');
    let expansion = null;
    let expanded = details.open;
    const syncExpansion = () => {
      details.dataset.expanded = String(expanded);
      summary.setAttribute('aria-expanded', String(expanded));
    };
    const finishExpansion = open => {
      if (expansion) { expansion.cancel(); expansion = null; }
      expanded = open;
      details.open = open;
      details.style.removeProperty('height');
      details.style.removeProperty('overflow');
      syncExpansion();
      scheduleReading();
    };
    syncExpansion();
    summary.addEventListener('click', event => {
      event.preventDefault();
      const open = !expanded;
      const startHeight = details.getBoundingClientRect().height;
      if (motion.matches || !details.animate) { finishExpansion(open); return; }
      if (expansion) { expansion.cancel(); expansion = null; }
      expanded = open;
      syncExpansion();
      // Measure the native destination, then keep content mounted during closing.
      details.style.removeProperty('height');
      details.open = open;
      const endHeight = details.getBoundingClientRect().height;
      details.open = true;
      details.style.height = `${startHeight}px`;
      details.style.overflow = 'hidden';
      const animation = details.animate([
        { height: `${startHeight}px` }, { height: `${endHeight}px` }
      ], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
      expansion = animation;
      animation.onfinish = () => {
        if (expansion === animation) finishExpansion(open);
      };
    });
    details.addEventListener('toggle', () => {
      if (!expansion) { expanded = details.open; syncExpansion(); }
      scheduleReading();
    });
    // External state changes (printing, resize, reduced motion) must not leave a fixed height.
    window.addEventListener('resize', () => { if (expansion) finishExpansion(expanded); });
    motion.addEventListener('change', () => { if (expansion) finishExpansion(expanded); });
    window.addEventListener('beforeprint', () => {
      if (expansion) finishExpansion(expanded);
    }, { capture: true });
    window.addEventListener('beforeprint', () => finishExpansion(true));
    window.addEventListener('afterprint', () => {
      expanded = details.open;
      syncExpansion();
    });
    document.querySelector('.glass-radio-group').addEventListener('change', () => {
      if (expansion) finishExpansion(expanded);
    });
  });
  document.querySelector('.glass-radio-group').addEventListener('change', () => {
    document.querySelectorAll('.swiper-container2 > .swiper-wrapper > .swiper-slide:not([hidden]) .project-card')
      .forEach((card, index) => play(card, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 350, delay: Math.min(index * 35, 140) }));
    scheduleReading();
  });

  // A native dialog supplies keyboard focus trapping and Escape-to-close.
  const viewer = document.createElement('dialog');
  viewer.className = 'image-viewer'; viewer.setAttribute('aria-label', '二维码预览');
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'viewer-close'; close.textContent = '×'; close.setAttribute('aria-label', '关闭二维码预览');
  const preview = document.createElement('img'); preview.alt = '二维码';
  viewer.append(close, preview); document.body.append(viewer);
  const openQR = image => {
    preview.src = image.currentSrc || image.src; preview.alt = image.alt || '二维码';
    viewer.showModal();
    play(viewer, [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 220 });
  };
  close.addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation(); });
  viewer.addEventListener('click', event => {
    const bounds = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) viewer.close();
  });
  document.querySelectorAll('.contact-qr').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => { event.preventDefault(); openQR(link.querySelector('img')); });
  });
  document.querySelectorAll('.qr-popover img').forEach(image => {
    const zoom = document.createElement('button'); zoom.type = 'button'; zoom.className = 'qr-zoom';
    zoom.setAttribute('aria-label', '放大小程序二维码');
    image.before(zoom); zoom.append(image);
    zoom.addEventListener('click', () => openQR(image));
  });

  // Copying is an explicit user action; failures leave the number selectable.
  const qq = document.querySelector('.W-lian-bottom .W-qq');
  const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'copy-contact';
  copy.setAttribute('aria-label', '复制 QQ 号码');
  const number = document.createElement('span'); number.textContent = qq.textContent;
  const copyIcon = document.createElement('span'); copyIcon.className = 'copy-icon';
  copyIcon.setAttribute('aria-hidden', 'true'); copyIcon.textContent = '⧉'; copy.append(number, copyIcon);
  qq.replaceChildren(copy);
  const feedback = document.createElement('div'); feedback.className = 'copy-feedback';
  feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite'); document.body.append(feedback);
  let feedbackTimer;
  copy.addEventListener('click', async () => {
    let message;
    try {
      await navigator.clipboard.writeText(number.textContent.replace(/^QQ\s*:\s*/, '').trim());
      message = 'QQ 号码已复制';
    } catch {
      message = '未能自动复制，请长按或选中号码复制';
    }
    clearTimeout(feedbackTimer); feedback.textContent = message; feedback.classList.add('show');
    feedbackTimer = setTimeout(() => feedback.classList.remove('show'), 3200);
  });
})();
