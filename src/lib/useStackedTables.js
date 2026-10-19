import { useEffect } from 'react';

// Tags every <table> inside `root` with data-label attributes (copied from its header cells)
// so the mobile CSS in index.css can render each row as a labelled card.
const labelTable = (table) => {
  const headers = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
  if (!headers.length) return;
  table.classList.add('mtable');
  table.querySelectorAll('tbody tr').forEach(tr => {
    let col = 0;
    [...tr.children].forEach(td => {
      const span = td.colSpan || 1;
      if (span === 1 && headers[col] !== undefined) {
        if (td.getAttribute('data-label') !== headers[col]) td.setAttribute('data-label', headers[col]);
      } else {
        td.setAttribute('data-span', 'true');
      }
      col += span;
    });
  });
};

export default function useStackedTables(rootSelector = 'main') {
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return undefined;
    let queued = false;
    const run = () => {
      queued = false;
      root.querySelectorAll('table').forEach(labelTable);
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    };
    run();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [rootSelector]);
}
