(function initializeSagittarius() {
  'use strict';

  const figure = document.querySelector('.constellation');
  const canvas = document.getElementById('sagittarius');
  const main = document.querySelector('.home-main');
  const hero = document.querySelector('.home-hero');
  const directory = document.querySelector('.contact-directory');
  if (!figure || !canvas || !main || !hero || !directory) return;
  if (new URLSearchParams(window.location.search).get('constellation') === 'off') {
    figure.hidden = true;
    return;
  }

  const context = canvas.getContext('2d');
  if (!context) return;

  // Normalized from SIMBAD J2000 ICRS positions for principal Sagittarius stars.
  const stars = [
    { name: 'eta', x: 0.000, y: 1.000, size: 1 },
    { name: 'delta', x: 0.071, y: 0.389, size: 2 },
    { name: 'epsilon', x: 0.151, y: 0.790, size: 2 },
    { name: 'lambda', x: 0.238, y: 0.000, size: 1 },
    { name: 'phi', x: 0.568, y: 0.138, size: 1 },
    { name: 'sigma', x: 0.791, y: 0.078, size: 2 },
    { name: 'zeta', x: 0.946, y: 0.393, size: 2 },
    { name: 'tau', x: 1.000, y: 0.199, size: 1 },
  ];
  const connections = [
    [0, 1], [0, 2], [1, 2],
    [1, 3], [3, 4], [4, 6], [6, 2], [2, 1],
    [4, 5], [5, 7], [7, 6],
  ];
  const morphOffsets = [
    [-7.0, 4.5], [4.0, -6.5], [6.5, 3.5], [-4.5, 7.0],
    [7.5, -4.0], [-5.5, -5.0], [4.5, 6.0], [-6.5, 3.0],
  ];
  let animationFrame = null;

  function geometry() {
    const mainRect = main.getBoundingClientRect();
    const top = hero.getBoundingClientRect().bottom - mainRect.top;
    const bottom = directory.getBoundingClientRect().top - mainRect.top;
    const gap = bottom - top;
    if (gap < 80 || mainRect.width < 220) return null;

    return {
      width: mainRect.width,
      height: mainRect.height,
      gap,
      centerX: mainRect.width / 2,
      centerY: top + (gap / 2),
      figureWidth: Math.min(280, mainRect.width * 0.46),
      figureHeight: Math.min(120, gap * 0.62),
    };
  }

  function prepareCanvas(layout) {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(layout.width * scale);
    const height = Math.round(layout.height * scale);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, layout.width, layout.height);
  }

  function drawDot(x, y, opacity, radius = 0.65) {
    context.fillStyle = `rgb(63 58 49 / ${opacity}%)`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  function drawDottedConnection(start, end) {
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const steps = Math.max(1, Math.floor(distance / 7));
    for (let step = 1; step < steps; step += 1) {
      const ratio = step / steps;
      drawDot(
        start.x + ((end.x - start.x) * ratio),
        start.y + ((end.y - start.y) * ratio),
        11,
      );
    }
  }

  function wave(time, duration, phase = 0) {
    return Math.sin(((time / duration) * Math.PI * 2) + phase);
  }

  function starPositions(layout, time) {
    const horizontalRange = Math.max(0, ((layout.width - layout.figureWidth) / 2) - 14);
    const horizontalCycle = 22000 + (horizontalRange * 60);
    const driftX = wave(time, horizontalCycle) * horizontalRange;
    const driftY = wave(time, 18000, 1.4) * Math.min(18, layout.gap * 0.12);
    const left = layout.centerX - (layout.figureWidth / 2) + driftX;
    const top = layout.centerY - (layout.figureHeight / 2) + driftY;

    return stars.map((star, index) => {
      const xMorph = wave(time, 5200 + ((index % 3) * 1100), index * 0.72);
      const yMorph = wave(time, 6800 + ((index % 4) * 900), 1.7 + (index * 0.61));
      return {
        x: left + (star.x * layout.figureWidth) + (morphOffsets[index][0] * xMorph),
        y: top + (star.y * layout.figureHeight) + (morphOffsets[index][1] * yMorph),
        size: star.size,
      };
    });
  }

  function draw(time = 0) {
    const layout = geometry();
    if (!layout) {
      figure.hidden = true;
      return false;
    }

    figure.hidden = false;
    prepareCanvas(layout);
    const positions = starPositions(layout, time);
    for (const [startIndex, endIndex] of connections) {
      drawDottedConnection(positions[startIndex], positions[endIndex]);
    }
    for (const star of positions) {
      drawDot(star.x, star.y, 30, star.size === 2 ? 1.8 : 1.2);
    }
    return true;
  }

  function animate(time) {
    animationFrame = null;
    if (document.hidden) return;

    if (!draw(time)) return;
    animationFrame = window.requestAnimationFrame(animate);
  }

  function start() {
    if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
    if (!document.hidden) animationFrame = window.requestAnimationFrame(animate);
  }

  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(start);
    observer.observe(main);
    observer.observe(hero);
    observer.observe(directory);
  } else {
    window.addEventListener('resize', start);
  }

  document.addEventListener('visibilitychange', start);
  start();
}());
