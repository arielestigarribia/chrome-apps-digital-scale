'use strict';

var scaleConnectionId = null;
var lastReading = null;

initScale();

function initScale() {
  var filters = [
    {usage: 1, usagePage: 141},
    {usage: 32, usagePage: 141}
  ];

  chrome.hid.getDevices({filters: filters}, function(devices) {
    if (devices.length === 0) {
      document.getElementById('status').innerHTML = 'Desconectado';
    }
    else {
      // just go with the first scale listed
      chrome.hid.connect(devices[0].deviceId, function(connection) {
        document.getElementById('status').innerHTML = 'Conectado';
        scaleConnectionId = connection.connectionId;
        pollScale();
      });
    }
  })
}

function formatRaw(bytes) {
  var ar = [];
  for (var i = 0; i < bytes.length; i++) {
    ar[i] = bytes[i];
  }

  return ar.join(' ');
}

function pollScale() {
  chrome.hid.receive(scaleConnectionId, function(reportId, data) {
    if (reportId === 3) {
      // we have a measurement from the scale
      var bytes = new Uint8Array(data);

      if (document.getElementById('raw')) {
        document.getElementById('raw').innerHTML = formatRaw(bytes);
      }

      // check to make sure the scale is stable
      if (bytes[0] === 2 || bytes[0] === 4) {
        var unit;

        if (bytes[1] === 11) {
          unit = 'oz';
        }
        else if (bytes[1] === 12) {
          unit = 'lb';
        }
        else if (bytes[1] === 3) {
          unit = 'kg';
        }
        else {
          unit = 'g';
        }

        // the scaling factor is a signed integer
        var factor = new Int8Array(data)[2];
        var fixedDigits = 0 - factor;
        if (fixedDigits < 0) fixedDigits = 0;

        // var newReading = ((bytes[4] * 256 + bytes[3]) * Math.pow(10, factor)).toFixed(fixedDigits) + ' ' + unit;
        var newReading = ((bytes[4] * 256 + bytes[3]) * Math.pow(10, factor)).toFixed(fixedDigits);

        if (newReading !== lastReading) {
          lastReading = newReading;
          reportReading();
        }
      }
    }
    setTimeout(pollScale, 0);
  });
}

function reportReading() {
  document.getElementById('reading').innerHTML = lastReading;

}

// Copy
// var copyTextareaBtn = document.querySelector('#visible-button');

// copyTextareaBtn.addEventListener('click', function(event) {
//   var copyTextarea = document.querySelector('#reading');
//   copyTextarea.select();

//   try {
//     var successful = document.execCommand('copy');
//     var msg = successful ? 'successful' : 'unsuccessful';
//     console.log('Copying text command was ' + msg);
//   } catch (err) {
//     console.log('Oops, unable to copy');
//   }
// });

// Copy to clipboard
document.querySelector("#visible-button").onclick = function() {
  document.querySelector("#reading").focus();
  document.execCommand('selectAll',false,null)
  document.execCommand('copy');
};