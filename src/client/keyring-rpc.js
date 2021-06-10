import {rpcRequest} from '../rpc-client';

export class KeyringRpc {
  /**
   * 
   * @param {*} options 
   * @returns 
   */
  static initialize() {
    return rpcRequest('keyring.initialize');
  }

  static addFromMnemonic(...options) {
    return rpcRequest('keyring.addFromMnemonic', ...options);
  }

  static addFromJson(...params) {
    return rpcRequest('keyring.addFromJson', ...params);
  }

  static cryptoIsReady() {
    return rpcRequest('utilCrypto.cryptoIsReady');
  }
}

export class KeyringPairRpc {
  static unlock(...params) {
    return rpcRequest('pair.unlock', ...params);
  }

  static address() {
    return rpcRequest('pair.address');
  }

  static isLocked() {
    return rpcRequest('pair.isLocked');
  }

  static lock() {
    return rpcRequest('pair.lock');
  }
  
  static toJson(password) {
    return rpcRequest('pair.toJson', password);
  }
}