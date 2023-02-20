"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountNotFoundError = exports.CandyMachineDontFoundError = exports.UploadFilesError = exports.CandyMachineDontCreatedError = exports.CreateCandyMachineError = exports.CreateTokenError = exports.DefaultError = void 0;
exports.DefaultError = new Error("Default error. This is a bug, please report it at");
exports.CreateTokenError = new Error("Error creating token, try again later.");
exports.CreateCandyMachineError = new Error("Error creating candy machine, try again later.");
exports.CandyMachineDontCreatedError = new Error("Candy machine not created, try again later.");
exports.UploadFilesError = new Error("Error to uploading files, try again later.");
exports.CandyMachineDontFoundError = new Error("Candy machine not found, try again later.");
exports.AccountNotFoundError = new Error("Account not found, try again later.");
//# sourceMappingURL=errors.js.map