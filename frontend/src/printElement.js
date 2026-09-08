export function printElement(elementId) {
  const source = document.getElementById(elementId);
  if (!source) return false;

  document.getElementById('timetable-print-root')?.remove();
  const printRoot = document.createElement('div');
  printRoot.id = 'timetable-print-root';
  printRoot.append(source.cloneNode(true));
  document.body.append(printRoot);
  document.body.classList.add('printing-timetable');

  const cleanup = () => {
    document.body.classList.remove('printing-timetable');
    printRoot.remove();
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  window.print();
  return true;
}
