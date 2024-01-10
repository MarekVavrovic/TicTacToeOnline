let ioInstance;

function initialize(io) {
  ioInstance = io;
}

function getIO() {
  return ioInstance;
}

module.exports = {
  initialize,
  getIO,
};
