import { callbackify, promisify } from "util";
import { promises as fs, constants as fsConstants } from "fs";

export const waterfallAsync = async (tasks) => {
  for (const task of tasks) {
    await promisify(task)();
  }
};

export const waterfall = callbackify(waterfallAsync);

export const eachAsync = async (arr, iterator) =>
  Promise.all(arr.map((el) => promisify(iterator)(el)));

export const each = callbackify(eachAsync);

export const apply = function (fn) {
  const args = Array.prototype.slice.call(arguments, 1);
  return function () {
    return fn.apply(null, args.concat(Array.prototype.slice.call(arguments)));
  };
};

export const whilstAsync = async (test, fn) => {
  while (test()) await promisify(fn)();
};

export const whilst = callbackify(whilstAsync);

export const wait = (delay) =>
  new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
export const exists = (path) =>
  fs.access(path, fsConstants.FS_OK).then(
    () => true,
    () => false
  );

// eslint-disable-next-line n/no-callback-literal
export const existsCallback = (path, callback) =>
  fs.access(path, fsConstants.FS_OK).then(
    () => callback(true),
    () => callback(false)
  );
