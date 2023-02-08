"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCandyMachineError = exports.CreateTokenError = exports.DefaultError = void 0;
exports.DefaultError = new Error("Default error. This is a bug, please report it at");
exports.CreateTokenError = new Error("Error creating token, try again later.");
exports.CreateCandyMachineError = new Error("Error creating candy machine, try again later.");
//# sourceMappingURL=errors.js.map