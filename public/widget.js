(function() {
  var el = document.currentScript;
  var projectId = el.getAttribute('data-project');
  var token = el.getAttribute('data-token');
  var host = el.getAttribute('data-host') || 'https://cobrahub.io';

  if (!projectId || !token) return;

  var container = document.createElement('div');
  container.id = 'cobrahub-widget';
  container.style.cssText = 'font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:400px;border:1px solid #e5e7eb;border-radius:8px;padding:16px;background:#fff;';
  el.parentNode.insertBefore(container, el.nextSibling);
  container.innerHTML = '<p style="color:#9ca3af;font-size:13px">Loading project status...</p>';

  fetch(host + '/api/projects/' + projectId + '/widget?token=' + encodeURIComponent(token))
    .then(function(r) { return r.ok ? r.json() : Promise.reject() })
    .then(function(data) {
      var color = data.agency.color || '#059669';
      var pct = data.completionPercentage;
      var done = data.tasks.filter(function(t) { return t.status === 'completado' }).length;
      var html = '<div style="margin-bottom:12px">'
        + '<div style="font-size:14px;font-weight:600;color:#111">' + esc(data.name) + '</div>'
        + '<div style="font-size:12px;color:#6b7280;margin-top:2px">' + esc(data.agency.name) + '</div>'
        + '</div>'
        + '<div style="background:#f3f4f6;border-radius:9999px;height:8px;margin-bottom:8px">'
        + '<div style="background:' + color + ';height:8px;border-radius:9999px;width:' + pct + '%;transition:width 0.3s"></div>'
        + '</div>'
        + '<div style="font-size:13px;color:#374151;margin-bottom:12px"><strong>' + pct + '%</strong> complete &middot; ' + done + '/' + data.tasks.length + ' tasks</div>'
        + '<div style="font-size:12px">';
      data.tasks.forEach(function(t) {
        var icon = t.status === 'completado' ? '✅' : t.status === 'en_progreso' ? '🔵' : '⬜';
        html += '<div style="padding:4px 0;color:#374151">' + icon + ' ' + esc(t.title) + '</div>';
      });
      html += '</div><div style="margin-top:12px;font-size:10px;color:#9ca3af">Powered by CobraHub</div>';
      container.innerHTML = html;
    })
    .catch(function() {
      container.innerHTML = '<p style="color:#ef4444;font-size:13px">Unable to load project status</p>';
    });

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
})();
