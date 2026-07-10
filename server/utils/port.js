const net = require('net');

const getPort = (preferredPort, attempts = 10) => new Promise((resolve, reject) => {
  const tryPort = (port, attempt) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE' && attempt < attempts) {
        tryPort(port + 1, attempt + 1);
        return;
      }
      reject(error);
    });
    server.listen(port, '0.0.0.0', () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      server.close(() => resolve(actualPort));
    });
  };

  tryPort(Number(preferredPort), 0);
});

module.exports = { getPort };
