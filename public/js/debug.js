var socket = io.connect(location.protocol + '//' + location.host);
socket.on('error', console.error.bind(console));
socket.on('refresh', function(data) {
  location.reload();
});