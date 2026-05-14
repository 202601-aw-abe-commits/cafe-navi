(function () {
  var host = window.location.hostname;
  var isGitHubPages = host.indexOf('github.io') !== -1;

  // Replace with your actual Render API URL after deploy.
  var renderApiBase = 'https://cafe-navi-api.onrender.com';

  window.CAFE_NAVI_API_BASE = isGitHubPages ? renderApiBase : '';
})();
