const params = new URLSearchParams(window.location.search);
const page = params.get('page');
document.getElementById('page').textContent = page;