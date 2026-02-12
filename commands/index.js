const goto = require('./goto');
const click = require('./click');
const type = require('./type');
const text = require('./text');
const close = require('./close');
const waitElement = require('./waitElement');
const localStorageCmd = require('./localStorage');
const getAttribute = require('./getAttribute');
const isChecked = require('./isChecked');
const html = require('./html');
const evaluate = require('./evaluate');
const evaluateFile = require('./evaluateFile');
const setOffline = require('./setOffline');
const wait = require('./wait');
const waitServiceWorker = require('./waitServiceWorker');
const sessionStorageCmd = require('./sessionStorage');
const cookies = require('./cookies');
const route = require('./route');
const performance = require('./performance');
const screenshot = require('./screenshot');
const fileCmd = require('./file');
const worker = require('./worker');
const serviceworker = require('./serviceworker');
const indexeddb = require('./indexeddb');
const mobile = require('./mobile');
const security = require('./security');
const custom = require('./custom');
const saveState = require('./saveState');
const restoreState = require('./restoreState');

module.exports = {
  goto,
  click,
  type,
  text,
  close,
  waitElement,
  localStorage: localStorageCmd,
  getAttribute,
  isChecked,
  html,
  evaluate,
  evaluateFile,
  setOffline,
  wait,
  waitServiceWorker,
  sessionStorage: sessionStorageCmd,
  cookies,
  route,
  performance,
  screenshot,
  file: fileCmd,
  worker,
  serviceworker,
  indexeddb,
  mobile,
  security,
  custom,
  saveState,
  restoreState,
};
