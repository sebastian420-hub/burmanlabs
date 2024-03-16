let isResizing = false;
let offsetX, offsetY;

const container = document.getElementById('iframe-container');
const iframe = document.getElementById('my-iframe');
const container = document.getElementById('iframe-container');
const iframe = document.getElementById('my-iframe');

container.addEventListener('mousedown', (e) => {
  if (e.target === container) {
   
    container.classList.add('resizing');
  }
});

document.addEventListener('mousemove', (e) => {
  if (isResizing) {
    const newWidth = e.clientX - offsetX;
    const newHeight = e.clientY - offsetY;
    container.style.width = `${newWidth}px`;
    container.style.height = `${newHeight}px`;
  }
});

document.addEventListener('mouseup', () => {
  isResizing = false;
  container.classList.remove('resizing');
});
