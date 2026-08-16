/* Garden Wonder — chunky outlined icon set (no icon font, no images). */

const Icons = (() => {
  const INK = '#2c1a10';
  const S = (body, vb = '0 0 24 24') =>
    `<svg viewBox="${vb}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

  const LIB = {
    coin: S(`
      <circle cx="12" cy="12" r="9" fill="#ffc93c"/>
      <circle cx="12" cy="12" r="5.6" fill="#ffe27a" stroke-width="1.6"/>
      <path d="M12 9.2c1.1 0 1.7 1 1.4 1.9 .9-.3 1.9.3 1.9 1.4 0 1.1-1 1.7-1.9 1.4 .3.9-.3 1.9-1.4 1.9s-1.7-1-1.4-1.9c-.9.3-1.9-.3-1.9-1.4 0-1.1 1-1.7 1.9-1.4-.3-.9.3-1.9 1.4-1.9Z" fill="#f59f00" stroke-width="1.2"/>`),
    gem: S(`
      <path d="M7 3.6h10l4 5.2-9 11.6L3 8.8Z" fill="#8ce0ff"/>
      <path d="M7 3.6 9.6 8.8 12 20.4 14.4 8.8 17 3.6" stroke-width="1.5"/>
      <path d="M3 8.8h18" stroke-width="1.5"/>
      <path d="M9.6 8.8 12 3.6l2.4 5.2" fill="#d6f4ff" stroke-width="1.5"/>`),
    book: S(`
      <path d="M4 4.6h6a3 3 0 0 1 3 3V20a2.6 2.6 0 0 0-2.6-2.2H4Z" fill="#ffd6a5"/>
      <path d="M20 4.6h-6a3 3 0 0 0-3 3V20a2.6 2.6 0 0 1 2.6-2.2H20Z" fill="#fff0d6"/>
      <path d="M12 7.6V20"/>`),
    gear: S(`
      <path d="M12 2.8l1.6 2.2 2.6-.6.5 2.7 2.5 1-1.2 2.4 1.7 2.1-2.2 1.6.3 2.7-2.7.2-1.3 2.4-2.4-1.2-2.3 1.4-1.3-2.4-2.7-.4.1-2.7-2.3-1.4 1.5-2.2-1.1-2.5 2.6-.8.7-2.6 2.6.8Z" fill="#cfd8e3"/>
      <circle cx="12" cy="12" r="3.4" fill="#8b9bb0"/>`),
    close: S(`<path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" stroke-width="2.6"/>`),
    badge: S(`
      <path d="M12 2.6l2.7 1.9 3.3-.2.9 3.2 2.5 2.2-1.7 2.8.4 3.3-3.2.9-2.1 2.6-3-1.4-3 1.4-2.1-2.6-3.2-.9.4-3.3L2.2 9.7l2.5-2.2.9-3.2 3.3.2Z" fill="#ffd43b"/>
      <circle cx="12" cy="11.4" r="4.2" fill="#fff3bf"/>
      <path d="M12 9.1l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2L9.1 11.2l2-.3Z" fill="#f59f00" stroke-width="1.2"/>`),
    decor: S(`
      <path d="M12 3.2c2.4 0 4 1.9 4 4.2 0 1.4-.6 2.4-1.3 3.2h-5.4C8.6 9.8 8 8.8 8 7.4c0-2.3 1.6-4.2 4-4.2Z" fill="#ff8fab"/>
      <path d="M9.3 10.6h5.4l1.6 8.2a2 2 0 0 1-2 2.4h-4.6a2 2 0 0 1-2-2.4Z" fill="#a5d8ff"/>
      <path d="M8.4 14.6h7.2" stroke-width="1.6"/>`),
    bolt: S(`<path d="M13.6 2.4 5.8 13.2h4.6l-.9 8.4 8.4-11.4h-4.9Z" fill="#ffd43b"/>`),
    fist: S(`
      <path d="M6 10.4V8.2a1.7 1.7 0 0 1 3.4 0v1.4a1.7 1.7 0 0 1 3.4 0v.6a1.7 1.7 0 0 1 3.3 0v.7a1.7 1.7 0 0 1 3.3.3v3.4c0 3.3-2.6 5.8-6.2 5.8h-1.9c-3.3 0-5.3-2.2-5.3-5.2Z" fill="#ffc9a5"/>
      <path d="M9.4 9.6v3M12.8 10.2v2.4M16.1 10.9v1.8" stroke-width="1.5"/>`),
    clover: S(`
      <path d="M12 12c-2.6-2.6-6.2-1-6.2 1.6 0 1.7 1.4 3 3.2 3 1.5 0 2.6-.9 3-1.9Z" fill="#69db7c"/>
      <path d="M12 12c2.6-2.6 6.2-1 6.2 1.6 0 1.7-1.4 3-3.2 3-1.5 0-2.6-.9-3-1.9Z" fill="#51cf66"/>
      <path d="M12 12c-2.6-2.6-1-6.2 1.6-6.2 1.7 0 3 1.4 3 3.2 0 1.5-.9 2.6-1.9 3Z" fill="#69db7c"/>
      <path d="M12 12C9.4 9.4 5.8 11 5.8 8.4c0-1.7 1.4-3 3.2-3 1.5 0 2.6.9 3 1.9Z" fill="#51cf66"/>
      <path d="M12 12.6c.6 3 .2 5.6-1.6 8" stroke-width="1.7"/>`),
    star: S(`<path d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.6l6.5-.9Z" fill="#ffd43b"/>`),
    flame: S(`
      <path d="M12 2.6c4 4 6.4 6.3 6.4 10.2A6.4 6.4 0 0 1 12 21.4a6.4 6.4 0 0 1-6.4-8.6C6.4 8.9 8.8 6.4 12 2.6Z" fill="#ff922b"/>
      <path d="M12 11.4c2 2 2.9 3 2.9 4.6A2.9 2.9 0 0 1 12 19a2.9 2.9 0 0 1-2.9-3c0-1.6.9-2.6 2.9-4.6Z" fill="#ffe066" stroke-width="1.4"/>`),
    grid: S(`
      <rect x="3.2" y="3.2" width="7.4" height="7.4" rx="2" fill="#8ce99a"/>
      <rect x="13.4" y="3.2" width="7.4" height="7.4" rx="2" fill="#a5d8ff"/>
      <rect x="3.2" y="13.4" width="7.4" height="7.4" rx="2" fill="#ffd8a8"/>
      <path d="M17.1 13.9v6.4M13.9 17.1h6.4" stroke-width="2.4"/>`),
    drop: S(`
      <path d="M12 2.8c3.6 4.4 6 7.1 6 10.2A6 6 0 0 1 6 13c0-3.1 2.4-5.8 6-10.2Z" fill="#74c0fc"/>
      <path d="M9.4 13.6a2.8 2.8 0 0 0 2.4 3.4" stroke="#fff" stroke-width="1.8"/>`),
    drone: S(`
      <rect x="8" y="9.4" width="8" height="6" rx="2.4" fill="#b197fc"/>
      <path d="M3.4 6.6h5M15.6 6.6h5M5.9 6.6v2.2c0 .8.7 1.4 1.5 1.4M18.1 6.6v2.2c0 .8-.7 1.4-1.5 1.4"/>
      <circle cx="12" cy="12.4" r="1.7" fill="#fff" stroke-width="1.4"/>
      <path d="M9.6 17.6 8.4 20M14.4 17.6 15.6 20" stroke-width="1.7"/>`),
    hand: S(`
      <path d="M7.4 12.4V5.8a1.8 1.8 0 0 1 3.6 0v5M11 10.6V4.6a1.8 1.8 0 0 1 3.6 0v6M14.6 11V6.8a1.8 1.8 0 0 1 3.5 0v7.4c0 4-2.6 6.6-6.4 6.6-3.4 0-5-1.6-6.6-4.6L3.6 13c-.6-1.1 1-2.4 2.1-1.3Z" fill="#ffc9a5"/>`),
    gnome: S(`
      <path d="M12 2.6 19 12H5Z" fill="#e03131"/>
      <path d="M8 12h8c0 3-1.4 4.6-1.4 4.6l1.4 4.8H8l1.4-4.8S8 15 8 12Z" fill="#fff4e6"/>
      <circle cx="12" cy="13.4" r="1.4" fill="#ffc9a5" stroke-width="1.3"/>`),
    butterfly: S(`
      <path d="M12 6.4c-1.4-2.6-4-3.6-5.9-2.6-2.2 1.1-2.3 4.4-.6 6.6 1.2 1.6 4 2.6 6.5 2.6Z" fill="#a5d8ff"/>
      <path d="M12 6.4c1.4-2.6 4-3.6 5.9-2.6 2.2 1.1 2.3 4.4.6 6.6-1.2 1.6-4 2.6-6.5 2.6Z" fill="#d0bfff"/>
      <path d="M12 13c-2 .6-3.6 2.2-3.6 4 0 1.6 1.4 2.8 3.6 2.8s3.6-1.2 3.6-2.8c0-1.8-1.6-3.4-3.6-4Z" fill="#ffc9de"/>
      <path d="M12 6v13.4" stroke-width="1.7"/>`),
    fountain: S(`
      <path d="M4 16.4h16l-1.4 4.2H5.4Z" fill="#74c0fc"/>
      <path d="M7.4 12.6h9.2l-1 3.8H8.4Z" fill="#a5d8ff"/>
      <path d="M12 12.4V6.6M12 6.6c0-2 1.6-2.6 2.8-2M12 6.6c0-2-1.6-2.6-2.8-2" stroke-width="1.8"/>
      <circle cx="12" cy="4.6" r="1.5" fill="#e7f5ff" stroke-width="1.5"/>`),
    lantern: S(`
      <path d="M12 2.8v2.4"/>
      <rect x="6.6" y="5.2" width="10.8" height="3" rx="1.2" fill="#ffa8a8"/>
      <path d="M8 8.2h8c1.2 2 1.2 6.4 0 8.4H8c-1.2-2-1.2-6.4 0-8.4Z" fill="#ff6b6b"/>
      <rect x="6.6" y="16.6" width="10.8" height="2.8" rx="1.2" fill="#ffa8a8"/>
      <path d="M12 19.4v1.8"/>`),
    sprout: S(`
      <path d="M12 20.4v-7.2" stroke-width="2.4"/>
      <path d="M12 13.6C9.6 13.6 6 12.4 5.2 8.6c3.6-.8 6.4 1.6 6.8 5Z" fill="#69db7c"/>
      <path d="M12 12.6c1.4-2.8 4.2-4.6 6.8-4-.4 3.6-3.4 5.4-6.8 5.2Z" fill="#8ce99a"/>`),
    lock: S(`
      <rect x="4.6" y="10.4" width="14.8" height="10" rx="3" fill="#ffd8a8"/>
      <path d="M8.2 10.2V7.8a3.8 3.8 0 0 1 7.6 0v2.4"/>
      <circle cx="12" cy="15.2" r="1.8" fill="#8a5a2b" stroke-width="1.4"/>`),
    check: S(`<path d="m5 12.6 4.6 4.4L19 6.8" stroke-width="2.8"/>`),
    sound: S(`
      <path d="M4.6 9.4h3.2L12 5.6v12.8l-4.2-3.8H4.6Z" fill="#a5d8ff"/>
      <path d="M15.4 9.2a4 4 0 0 1 0 5.6M18 6.6a7.6 7.6 0 0 1 0 10.8"/>`),
    music: S(`
      <path d="M9.4 17.4V5.6l9-1.8v11.4" />
      <ellipse cx="6.9" cy="17.8" rx="2.6" ry="2.2" fill="#d0bfff"/>
      <ellipse cx="15.9" cy="15.4" rx="2.6" ry="2.2" fill="#d0bfff"/>`),
    trash: S(`
      <path d="M4.6 6.6h14.8M9.4 6.4V4.8a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.6"/>
      <path d="M6.4 6.6h11.2l-1 12.4a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8Z" fill="#ffa8a8"/>`),
    sparkle: S(`<path d="M12 2.6c.8 5.4 3.4 8 8.8 8.8-5.4.8-8 3.4-8.8 8.8-.8-5.4-3.4-8-8.8-8.8 5.4-.8 8-3.4 8.8-8.8Z" fill="#ffe066"/>`),
    clock: S(`<circle cx="12" cy="12" r="8.6" fill="#e7f5ff"/><path d="M12 7v5.2l3.4 2.2" stroke-width="2.2"/>`),
    cards: S(`
      <rect x="3.2" y="7.4" width="9.4" height="13" rx="2.2" fill="#8ce99a" transform="rotate(-16 7.9 13.9)"/>
      <rect x="7.3" y="6.2" width="9.4" height="13" rx="2.2" fill="#a5d8ff" transform="rotate(-3 12 12.7)"/>
      <rect x="11.4" y="4.6" width="9.4" height="13" rx="2.2" fill="#ffe066"/>
      <path d="M16.1 8.4c.9-1.1 2.6-.5 2.6.8 0 1.3-1.6 2.4-2.6 3.2-1-.8-2.6-1.9-2.6-3.2 0-1.3 1.7-1.9 2.6-.8Z" fill="#ff6b9d" stroke-width="1.3"/>`),
    ladybug: S(`
      <path d="M12 6.2a5.8 5.8 0 0 1 5.8 5.8v2.6A5.8 5.8 0 0 1 12 20.4a5.8 5.8 0 0 1-5.8-5.8V12A5.8 5.8 0 0 1 12 6.2Z" fill="#fa5252"/>
      <path d="M8.6 6.8a3.8 3.8 0 0 1 6.8 0Z" fill="#2c1a10" stroke-width="1.3"/>
      <path d="M12 6.2v14.2" stroke-width="1.6"/>
      <circle cx="9.3" cy="11.6" r="1.1" fill="#2c1a10" stroke-width="1"/>
      <circle cx="14.7" cy="11.6" r="1.1" fill="#2c1a10" stroke-width="1"/>
      <circle cx="9.7" cy="16.4" r="1.1" fill="#2c1a10" stroke-width="1"/>
      <circle cx="14.3" cy="16.4" r="1.1" fill="#2c1a10" stroke-width="1"/>`),
    plantSpot: S(`
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5.4"
        stroke="#ffe9c9" stroke-opacity=".9" stroke-width="2.4" stroke-dasharray="4.5 4.2"/>
      <path d="M12 8.4v7.2M8.4 12h7.2" stroke="#ffe9c9" stroke-opacity=".95" stroke-width="2.8"/>`)
  };

  /* Apiary + Apothecary */
  Object.assign(LIB, {
    hive: S(`
      <path d="M6.6 5.4h10.8a1.6 1.6 0 0 1 0 3.2H6.6a1.6 1.6 0 0 1 0-3.2Z" fill="#ffc93c"/>
      <path d="M5.4 8.6h13.2a1.6 1.6 0 0 1 0 3.2H5.4a1.6 1.6 0 0 1 0-3.2Z" fill="#ffd85e"/>
      <path d="M4.6 11.8h14.8a1.6 1.6 0 0 1 0 3.2H4.6a1.6 1.6 0 0 1 0-3.2Z" fill="#ffc93c"/>
      <path d="M5.4 15h13.2a1.6 1.6 0 0 1 0 3.2H5.4a1.6 1.6 0 0 1 0-3.2Z" fill="#ffd85e"/>
      <ellipse cx="12" cy="16.6" rx="2" ry="1.6" fill="#8a5a2b" stroke-width="1.4"/>`),
    honey: S(`
      <path d="M9 2.8h6v2.4l1.6 2.6a3 3 0 0 1 .4 1.5v8.9a2.6 2.6 0 0 1-2.6 2.6H9.6A2.6 2.6 0 0 1 7 18.2V9.3a3 3 0 0 1 .4-1.5L9 5.2Z" fill="#ffb020"/>
      <path d="M7 11.6c1.6-1 3.4-1 5 0s3.4 1 5 0v6.6a2.6 2.6 0 0 1-2.6 2.6H9.6A2.6 2.6 0 0 1 7 18.2Z" fill="#f08c00"/>
      <path d="M8.4 2.8h7.2" stroke-width="2.4"/>`),
    wax: S(`
      <path d="M12 3.2 19 7.1v7.8L12 18.8 5 14.9V7.1Z" fill="#ffe9a8"/>
      <path d="M12 3.2 19 7.1 12 11 5 7.1Z" fill="#ffd85e"/>
      <path d="M12 11v7.8" stroke-width="1.6"/>`),
    bee: S(`
      <ellipse cx="8.4" cy="8" rx="4" ry="2.8" fill="#eaf6ff" stroke-width="1.5"/>
      <ellipse cx="15" cy="8" rx="4" ry="2.8" fill="#eaf6ff" stroke-width="1.5"/>
      <ellipse cx="12" cy="14.4" rx="5" ry="5.4" fill="#ffc93c"/>
      <path d="M7.4 12.6h9.2M7.6 16.4h8.8" stroke-width="1.8"/>`),
    teacup: S(`
      <path d="M4.6 9.6h12v4.6a4.6 4.6 0 0 1-4.6 4.6H9.2a4.6 4.6 0 0 1-4.6-4.6Z" fill="#ffd6e0"/>
      <path d="M16.6 11h1.6a2.2 2.2 0 0 1 0 4.4h-1.6" fill="none"/>
      <path d="M4.6 18.8h13.6" stroke-width="2.2"/>
      <path d="M8.6 6.6c.8-1 .8-1.8 0-2.8M12.2 6.6c.8-1 .8-1.8 0-2.8" stroke-width="1.5"/>`),
    perfume: S(`
      <path d="M9.6 2.8h4.8v3H9.6Z" fill="#cfd8e3"/>
      <path d="M8 8.4a3 3 0 0 1 3-2.6h2a3 3 0 0 1 3 2.6v9.4a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3Z" fill="#ffb3d1"/>
      <path d="M8 13.4h8" stroke-width="1.6"/>
      <circle cx="18.4" cy="6" r="2" fill="#a5d8ff" stroke-width="1.5"/>`),
    salve: S(`
      <path d="M6.4 8.6h11.2v9a3 3 0 0 1-3 3H9.4a3 3 0 0 1-3-3Z" fill="#cdebc5"/>
      <path d="M5.4 5.4h13.2v3.2H5.4Z" fill="#8fd18a"/>
      <path d="M6.4 13.4h11.2" stroke-width="1.6"/>
      <path d="M12 2.6v2.8" stroke-width="1.8"/>`),
    flask: S(`
      <path d="M10 2.8h4v6l4.4 7.6a2.6 2.6 0 0 1-2.2 4H7.8a2.6 2.6 0 0 1-2.2-4L10 8.8Z" fill="#e7f5ff"/>
      <path d="M7.4 14.4h9.2l1.8 2a2.6 2.6 0 0 1-2.2 4H7.8a2.6 2.6 0 0 1-2.2-4Z" fill="#8ce0ff"/>
      <path d="M9 2.8h6" stroke-width="2.2"/>`),
    petal: S(`
      <path d="M12 3.4c2.6 2.4 4 5 4 7.6a4 4 0 0 1-8 0c0-2.6 1.4-5.2 4-7.6Z" fill="#ff8fab"/>
      <path d="M12 11v9.4" stroke-width="2"/>
      <path d="M12 15.4c-1.8-1.6-3.4-2-5-1.6.4 2 1.8 3.2 5 3.4Z" fill="#57c15b" stroke-width="1.4"/>`)
  });

  function get(name) {
    return LIB[name] || LIB.sparkle;
  }

  /** Swap every <span data-icon="x"> in a subtree for its SVG. */
  function hydrate(root = document) {
    root.querySelectorAll('[data-icon]').forEach((el) => {
      if (el.dataset.iconDone) return;
      el.innerHTML = get(el.dataset.icon);
      el.dataset.iconDone = '1';
    });
  }

  return { get, hydrate };
})();
