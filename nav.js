// Simple navigation logic (optional, for future enhancements)
document.addEventListener('DOMContentLoaded', function() {
  // Example: highlight current page link
  const links = document.querySelectorAll('.inter-page-nav a');
  links.forEach(link => {
    if (window.location.pathname.endsWith(link.getAttribute('href'))) {
      link.style.fontWeight = 'bold';
      link.style.color = '#00d4aa';
    }
  });
});
