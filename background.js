chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'id': 'main-window',
    'bounds': {
      'width': 200,
      'height': 200
    }
  });
});
